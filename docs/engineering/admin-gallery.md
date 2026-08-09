# Admin media gallery

## Purpose

The admin gallery is Moodie's protected media workspace. It lets an
administrator upload image and video assets, preview them, and maintain the
name, description, and tags that make the assets reusable by future content
workflows.

## Data and storage

- File bytes live in the private Supabase Storage bucket `gallery`.
- Searchable metadata lives in `public.gallery_media`.
- Gallery records store the Storage object path, display name, description,
  normalized tags, MIME type, file size, creator, and timestamps.
- Files are limited to 50 MB and to the image/video MIME types configured on
  the bucket.
- Gallery rows and Storage objects are available only to authenticated users
  that pass `public.is_admin()`.
- Admin previews use short-lived signed URLs; the private bucket is never made
  public.

## Admin workflow

1. Open **Gallery** in the admin navigation.
2. Choose **Upload media** and select one or more image or video files.
3. After the upload completes, every new item is selected and the metadata
   editor opens automatically.
4. With one item selected, name, description, and tags edit that item.
5. With multiple items selected, the administrator explicitly chooses which
   fields to apply to every selected item. Unchecked fields remain unchanged.
6. Existing cards can be selected in any combination, or opened individually
   with **Edit**.
7. A single-item editor can open the permanent removal dialog.

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
  permanently removed from the private `gallery` Storage bucket.
- If the usage check fails, removal fails closed and no delete operation is
  offered.

## Failure behavior

- Unsupported or oversized files are rejected before upload.
- If one file in a batch fails, successfully uploaded files from that batch are
  removed so the gallery is not left with partial uploads.
- If metadata creation fails, the uploaded Storage objects are removed.
- Referenced media cannot be deleted, even if a client bypasses the admin UI.
- Errors remain visible in the gallery while the administrator retries.
