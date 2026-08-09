revoke delete on table public.gallery_media from authenticated;

drop policy if exists "admins delete gallery media"
on public.gallery_media;

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

  if v_object_path is null then
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

comment on function public.get_gallery_media_references(uuid) is
  'Returns content entities whose image URI refers to a gallery Storage object.';

revoke all on function public.get_gallery_media_references(uuid) from public;
revoke all on function public.get_gallery_media_references(uuid) from anon;
grant execute on function public.get_gallery_media_references(uuid) to authenticated;

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

  if v_object_path is null then
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
  'Deletes gallery metadata only when no content entity references its Storage path.';

revoke all on function public.delete_gallery_media_if_unreferenced(uuid) from public;
revoke all on function public.delete_gallery_media_if_unreferenced(uuid) from anon;
grant execute on function public.delete_gallery_media_if_unreferenced(uuid) to authenticated;
