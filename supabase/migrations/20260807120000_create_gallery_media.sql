create table public.gallery_media (
  id uuid primary key default gen_random_uuid(),
  object_path text not null unique,
  name text not null,
  description text not null default '',
  tags text[] not null default '{}',
  mime_type text not null,
  size_bytes bigint not null,
  created_by uuid not null default auth.uid()
    references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_media_object_path_not_blank
    check (btrim(object_path) <> ''),
  constraint gallery_media_name_not_blank
    check (btrim(name) <> ''),
  constraint gallery_media_tags_not_blank
    check (array_position(tags, '') is null),
  constraint gallery_media_mime_type_supported
    check (mime_type like 'image/%' or mime_type like 'video/%'),
  constraint gallery_media_size_valid
    check (size_bytes > 0 and size_bytes <= 52428800)
);

create index gallery_media_created_at_idx
  on public.gallery_media (created_at desc, id desc);

create index gallery_media_tags_idx
  on public.gallery_media using gin (tags);

create trigger gallery_media_set_updated_at
before update on public.gallery_media
for each row execute function public.set_content_updated_at();

alter table public.gallery_media enable row level security;

revoke all on table public.gallery_media from public, anon, authenticated;
grant select, insert, update, delete on table public.gallery_media to authenticated;

create policy "admins read gallery media"
on public.gallery_media
for select
to authenticated
using ((select public.is_admin()));

create policy "admins create gallery media"
on public.gallery_media
for insert
to authenticated
with check (
  (select public.is_admin())
  and created_by = (select auth.uid())
);

create policy "admins update gallery media"
on public.gallery_media
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "admins delete gallery media"
on public.gallery_media
for delete
to authenticated
using ((select public.is_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'gallery',
  'gallery',
  false,
  52428800,
  array[
    'image/avif',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admins read gallery objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'gallery'
  and (select public.is_admin())
);

create policy "admins create gallery objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'gallery'
  and (select public.is_admin())
);

create policy "admins update gallery objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'gallery'
  and (select public.is_admin())
)
with check (
  bucket_id = 'gallery'
  and (select public.is_admin())
);

create policy "admins delete gallery objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'gallery'
  and (select public.is_admin())
);
