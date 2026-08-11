import { type GalleryMedia } from './gallery';

export function galleryMediaMatchesQuery(
  item: GalleryMedia,
  query: string,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    item.assetId,
    item.name,
    item.description,
    item.mimeType ?? '',
    item.sourceProvider,
    item.creatorName,
    item.creatorHandle ?? '',
    item.licenseName,
    item.assetStatus,
    ...item.tags,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}

export function galleryMediaContentUri(item: GalleryMedia): string {
  if (!item.objectPath) {
    throw new Error('Gallery media must have an uploaded file to be selected.');
  }

  return `gallery://${item.objectPath}`;
}
