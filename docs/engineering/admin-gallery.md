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
- JPEG files are optimized entirely in the admin browser before upload. The
  browser corrects the decoded orientation, limits width to 1440 pixels without
  upscaling, encodes WebP at 80% quality, and uploads only the WebP result.
  Drawing through the browser canvas also removes embedded JPEG metadata from
  the stored copy.
- Other supported image formats and videos are uploaded unchanged. The gallery
  does not create or store thumbnail variants.
- Gallery rows remain available only to authenticated users that pass
  `public.is_admin()`.
- Uploaded Storage objects can be resolved by supporter clients from stable
  `gallery://<object-path>` references. The app exchanges those references for
  24-hour signed URLs; the bucket itself remains private.
- Upload, update, and delete access to Storage objects remains admin-only.
- Admin previews also use short-lived signed URLs.

## Admin workflow

1. Open **Gallery** in the admin navigation.
2. Choose **Upload media** and select one or more image or video files. JPEGs
   are optimized and converted to WebP before the upload begins.
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

## Attach files to registered assets

The gallery upload control has a separate **Attach by Asset ID** mode for
fileless registered assets. This mode never creates gallery rows.

1. The administrator selects one or more image files whose filenames contain
   the exact, case-sensitive `asset_id` of an existing gallery row.
2. Before upload, the client rejects empty, unsupported, oversized, unmatched,
   ambiguous, already-attached, and duplicate files. Rejected files are not
   sent to Storage.
3. Every accepted JPEG is optimized and converted to WebP, then the resulting
   file uploads to a new private `gallery` object path. Asset ID matching still
   uses the administrator-selected filename.
4. An admin-only database function locks and attaches the complete accepted
   batch in one transaction. It sets object path, MIME type, size, uploader,
   download date when missing, and `pending_review` status.
5. If any Storage upload fails, all objects uploaded by that attempt are
   removed and no gallery rows are changed.
6. If the database attachment fails or a row stopped being fileless, all newly
   uploaded objects are removed and the database transaction changes no rows.
7. The admin receives the attached count and a per-file reason for everything
   that was not saved.

If two filenames in the same selection resolve to one `asset_id`, neither is
uploaded. If one filename contains more than one registered Asset ID, it is
ambiguous and is not uploaded.

## Unsplash candidate registration

The initial Unsplash candidate batch is registered as 100 fileless gallery
rows. Candidate fields map to gallery metadata as follows:

- `Asset ID` becomes the globally unique `asset_id` without modification.
- The candidate heading becomes `name`.
- `Why it may fit` becomes `description`.
- `Suggested topics` become normalized `tags` in their documented order.
- Creator name and handle, license name/check date, and any documented original
  dimensions populate their matching columns.
- The document-level check date applies when an entry does not repeat a
  per-entry license check date.
- Every registered candidate starts as `pending_upload`, with no object path,
  MIME type, file size, download date, or uploader.
- Source-page URLs, creator-profile URLs, aspect-ratio display text, and
  requested-format display text remain only in the restricted internal source
  record and are not copied into `public.gallery_media`.

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
- If a JPEG cannot be decoded or encoded as WebP, the upload attempt stops
  before any file from that attempt is written to Storage.
- If one file in a batch fails, successfully uploaded files from that batch are
  removed so the gallery is not left with partial uploads.
- If metadata creation fails, the uploaded Storage objects are removed.
- Asset-ID attachment failures remove every Storage object created by that
  attachment attempt.
- Files that cannot be matched unambiguously to a fileless registered asset are
  rejected before upload and reported to the administrator.
- Referenced media cannot be deleted, even if a client bypasses the admin UI.
- Errors remain visible in the gallery while the administrator retries.
