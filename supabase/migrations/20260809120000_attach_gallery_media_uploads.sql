create or replace function public.attach_gallery_media_uploads(p_uploads jsonb)
returns table (
  media_id uuid,
  attached_asset_id text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_expected integer;
  v_updated integer;
begin
  if not (select public.is_admin()) then
    raise exception 'Admin access is required.'
      using errcode = '42501';
  end if;

  if p_uploads is null or jsonb_typeof(p_uploads) <> 'array' then
    raise exception 'Uploads must be a JSON array.'
      using errcode = '22023';
  end if;

  v_expected := jsonb_array_length(p_uploads);
  if v_expected < 1 or v_expected > 500 then
    raise exception 'An attachment batch must contain between 1 and 500 files.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_uploads) as upload (
      asset_id text,
      object_path text,
      mime_type text,
      size_bytes bigint
    )
    where btrim(upload.asset_id) = ''
      or btrim(upload.object_path) = ''
      or upload.mime_type not in (
        'image/avif',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp'
      )
      or upload.size_bytes <= 0
      or upload.size_bytes > 52428800
      or upload.asset_id is null
      or upload.object_path is null
      or upload.mime_type is null
      or upload.size_bytes is null
  ) then
    raise exception 'One or more attachment records are invalid.'
      using errcode = '22023';
  end if;

  if (
    select count(*) <> count(distinct upload.asset_id)
      or count(*) <> count(distinct upload.object_path)
    from jsonb_to_recordset(p_uploads) as upload (
      asset_id text,
      object_path text,
      mime_type text,
      size_bytes bigint
    )
  ) then
    raise exception 'Attachment Asset IDs and object paths must be unique.'
      using errcode = '22023';
  end if;

  return query
  with uploads as materialized (
    select
      upload.asset_id,
      upload.object_path,
      upload.mime_type,
      upload.size_bytes
    from jsonb_to_recordset(p_uploads) as upload (
      asset_id text,
      object_path text,
      mime_type text,
      size_bytes bigint
    )
  ),
  locked_assets as materialized (
    select gallery_media.id
    from public.gallery_media
    join uploads
      on uploads.asset_id = gallery_media.asset_id
    order by gallery_media.id
    for update of gallery_media
  )
  update public.gallery_media
  set
    object_path = uploads.object_path,
    mime_type = uploads.mime_type,
    size_bytes = uploads.size_bytes,
    created_by = coalesce(public.gallery_media.created_by, (select auth.uid())),
    downloaded_on = coalesce(public.gallery_media.downloaded_on, current_date),
    asset_status = 'pending_review'
  from uploads, locked_assets
  where public.gallery_media.id = locked_assets.id
    and public.gallery_media.asset_id = uploads.asset_id
    and public.gallery_media.object_path is null
    and public.gallery_media.mime_type is null
    and public.gallery_media.size_bytes is null
  returning public.gallery_media.id, public.gallery_media.asset_id;

  get diagnostics v_updated = row_count;
  if v_updated <> v_expected then
    raise exception 'Every upload must match an existing fileless gallery asset.'
      using errcode = 'P0002';
  end if;
end;
$function$;

comment on function public.attach_gallery_media_uploads(jsonb) is
  'Atomically attaches a validated Storage upload batch to existing fileless gallery assets.';

revoke all on function public.attach_gallery_media_uploads(jsonb) from public;
revoke all on function public.attach_gallery_media_uploads(jsonb) from anon;
grant execute on function public.attach_gallery_media_uploads(jsonb) to authenticated;
