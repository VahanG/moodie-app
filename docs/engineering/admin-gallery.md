# Admin media gallery

## Purpose

The admin gallery is Moodie's protected media workspace. It lets an
administrator register image and video assets before or during upload, preview
uploaded files, and maintain the metadata that makes the assets traceable and
reusable by future content workflows.

## Data and storage

- File bytes live in the private Supabase Storage bucket `gallery`.
- Searchable metadata lives in `public.gallery_media`.
- Every gallery row has a required, globally unique string `asset_id`. This is
  the stable external identity used to match a later file upload to an existing
  asset row; it is separate from the row's internal UUID primary key.
- Gallery records store display metadata, normalized tags, provider, creator,
  license review data, original dimensions, download date, and asset status.
- Provider source-page, creator-profile, and license URLs are not stored in the
  production database. They remain in the restricted internal licensing
  record, keyed by provider and `asset_id`.
- A gallery row may exist before its file. Storage object path, MIME type, file
  size, uploader, and preview URL are absent together until upload succeeds.
- Uploaded file bytes and their object path continue to live in the private
  `gallery` bucket.
- Files are limited to 50 MB and to the image/video MIME types configured on
  the bucket.
- Gallery rows and Storage objects are available only to authenticated users
  that pass `public.is_admin()`.
- Admin previews use short-lived signed URLs; the private bucket is never made
  public.

## Admin workflow

1. Open **Gallery** in the admin navigation.
2. Choose **Upload media** and select one or more image or video files.
3. A registered asset without a file appears with an **Awaiting upload**
   placeholder and remains searchable by asset ID and source metadata.
4. After a regular upload completes, every new item is selected and the metadata
   editor opens automatically.
5. With one item selected, the administrator can edit its general and source
   metadata. `asset_id` remains unique across the gallery.
6. With multiple items selected, the administrator explicitly chooses which
   fields to apply to every selected item. Unchecked fields remain unchanged.
7. Existing cards can be selected in any combination, or opened individually
   with **Edit**.
8. A single-item editor can open the permanent removal dialog.

Tags are trimmed, lowercased, de-duplicated, and entered as a comma-separated
list in the admin UI.

## Removal safeguards

- Removal is available for one media item at a time and always requires an
  explicit confirmation.
- Before confirmation, the admin checks whether the media URL is attached to
  an affirmation category, affirmation, or background.
- Referenced media shows every matching entity type and ID. Removal remains
  blocked until those references are replaced.
- A database function repeats the reference check while locking the gallery
  row. Authenticated clients cannot delete gallery metadata directly.
- After the guarded metadata deletion succeeds, the corresponding object is
  permanently removed from the private `gallery` Storage bucket when one is
  attached. Fileless asset rows delete without a Storage operation.
- If the usage check fails, removal fails closed and no delete operation is
  offered.

## Failure behavior

- Unsupported or oversized files are rejected before upload.
- If one file in a batch fails, successfully uploaded files from that batch are
  removed so the gallery is not left with partial uploads.
- If metadata creation fails, the uploaded Storage objects are removed.
- Referenced media cannot be deleted, even if a client bypasses the admin UI.
- Errors remain visible in the gallery while the administrator retries.
