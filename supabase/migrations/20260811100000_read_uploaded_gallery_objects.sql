drop policy if exists "uploaded gallery objects are readable"
on storage.objects;

create policy "uploaded gallery objects are readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gallery');

comment on policy "uploaded gallery objects are readable"
on storage.objects is
  'Allows supporter clients to resolve stable gallery:// object paths to signed URLs after upload.';
