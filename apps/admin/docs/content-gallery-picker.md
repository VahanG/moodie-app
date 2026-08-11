# Content gallery picker

Content editors for affirmation categories, affirmations, and backgrounds keep
their manual image URL input and also expose **Select from gallery**.

The picker:

- uses the same search input, metadata matching, and media-card grid as the
  Gallery page;
- shows only uploaded images, excluding videos and fileless gallery records;
- supports one selected image at a time and closes after **Use image**;
- stores the durable `gallery://<object-path>` reference in content rather than
  the gallery's expiring signed preview URL; and
- resolves that reference to a signed URL when rendering Content thumbnails.

The dialog closes from its close button, the backdrop, or the Escape key. A
gallery loading failure stays visible in the dialog and does not change the
current image URL.
