alter table public.gallery_media
  add column asset_id text,
  add column source_provider text not null default 'unknown',
  add column creator_name text not null default 'Unknown',
  add column creator_handle text,
  add column license_name text not null default 'Unverified',
  add column license_checked_on date,
  add column downloaded_on date,
  add column original_width integer,
  add column original_height integer,
  add column asset_status text not null default 'pending_upload';

update public.gallery_media
set
  asset_id = 'legacy-' || id::text,
  asset_status = 'pending_review';

alter table public.gallery_media
  alter column asset_id set not null,
  alter column object_path drop not null,
  alter column mime_type drop not null,
  alter column size_bytes drop not null,
  alter column created_by drop not null,
  add constraint gallery_media_asset_id_unique unique (asset_id),
  add constraint gallery_media_asset_id_not_blank
    check (btrim(asset_id) <> ''),
  add constraint gallery_media_source_provider_normalized
    check (
      btrim(source_provider) <> ''
      and source_provider = lower(btrim(source_provider))
    ),
  add constraint gallery_media_creator_name_not_blank
    check (btrim(creator_name) <> ''),
  add constraint gallery_media_creator_handle_not_blank
    check (creator_handle is null or btrim(creator_handle) <> ''),
  add constraint gallery_media_license_name_not_blank
    check (btrim(license_name) <> ''),
  add constraint gallery_media_original_dimensions_valid
    check (
      (original_width is null and original_height is null)
      or (original_width > 0 and original_height > 0)
    ),
  add constraint gallery_media_asset_status_valid
    check (
      asset_status in (
        'pending_upload',
        'pending_review',
        'approved',
        'published',
        'rejected'
      )
    ),
  add constraint gallery_media_file_metadata_complete
    check (
      (
        object_path is null
        and mime_type is null
        and size_bytes is null
      )
      or (
        object_path is not null
        and mime_type is not null
        and size_bytes is not null
      )
    );

comment on column public.gallery_media.asset_id is
  'Required globally unique external asset identifier used to match later uploads.';
comment on column public.gallery_media.source_provider is
  'Normalized provider name only; provider URLs remain outside the production database.';
comment on column public.gallery_media.asset_status is
  'Asset lifecycle state from registration through review and publication.';

create or replace function public.get_gallery_media_references(p_media_id uuid)
returns table (
  entity_type text,
  entity_id text,
  image_uri text
)
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_object_path text;
begin
  if not (select public.is_admin()) then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  select gallery_media.object_path
  into v_object_path
  from public.gallery_media
  where gallery_media.id = p_media_id;

  if not found or v_object_path is null then
    return;
  end if;

  return query
  select
    entity_references.entity_type,
    entity_references.entity_id,
    entity_references.image_uri
  from (
    select
      'Category'::text as entity_type,
      affirmation_topics.id::text as entity_id,
      affirmation_topics.image_uri
    from public.affirmation_topics

    union all

    select
      'Affirmation'::text,
      affirmations.id::text,
      affirmations.image_uri
    from public.affirmations

    union all

    select
      'Background'::text,
      affirmation_backgrounds.id::text,
      affirmation_backgrounds.image_uri
    from public.affirmation_backgrounds
  ) as entity_references
  where entity_references.image_uri = v_object_path
    or entity_references.image_uri = 'gallery://' || v_object_path
    or position('/gallery/' || v_object_path in entity_references.image_uri) > 0
    or position(
      '/gallery/' || replace(v_object_path, '/', '%2F')
      in entity_references.image_uri
    ) > 0
  order by entity_references.entity_type, entity_references.entity_id;
end;
$function$;

create or replace function public.delete_gallery_media_if_unreferenced(
  p_media_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_object_path text;
begin
  if not (select public.is_admin()) then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  select gallery_media.object_path
  into v_object_path
  from public.gallery_media
  where gallery_media.id = p_media_id
  for update;

  if not found then
    raise exception 'Gallery media was not found.'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.get_gallery_media_references(p_media_id)
  ) then
    raise exception 'Gallery media is attached to content and cannot be deleted.'
      using errcode = '23503';
  end if;

  delete from public.gallery_media
  where id = p_media_id;

  return v_object_path;
end;
$function$;

comment on function public.delete_gallery_media_if_unreferenced(uuid) is
  'Deletes unreferenced gallery metadata and returns its optional Storage path.';
