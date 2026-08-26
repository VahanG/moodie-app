import { Image } from 'react-native';

export const AFFIRMATION_IMAGE_PREFETCH_LIMIT = 2;
const inFlightImagePrefetches = new Map<string, Promise<string | null>>();

export function getAdjacentAffirmationImageUris(
  imageUris: string[],
  activeIndex: number,
): string[] {
  if (imageUris.length <= 1) {
    return [];
  }

  const safeActiveIndex =
    ((activeIndex % imageUris.length) + imageUris.length) % imageUris.length;
  const activeImageUri = imageUris[safeActiveIndex]?.trim();
  const adjacentIndexes = [
    (safeActiveIndex - 1 + imageUris.length) % imageUris.length,
    (safeActiveIndex + 1) % imageUris.length,
  ];
  const adjacentImageUris = new Set<string>();

  adjacentIndexes.forEach(index => {
    const imageUri = imageUris[index]?.trim();

    if (imageUri && imageUri !== activeImageUri) {
      adjacentImageUris.add(imageUri);
    }
  });

  return [...adjacentImageUris].slice(0, AFFIRMATION_IMAGE_PREFETCH_LIMIT);
}

export async function prefetchAffirmationImages(
  imageUris: string[],
): Promise<string[]> {
  const candidateImageUris = [
    ...new Set(imageUris.map(imageUri => imageUri.trim()).filter(Boolean)),
  ].slice(0, AFFIRMATION_IMAGE_PREFETCH_LIMIT);
  const prefetches = candidateImageUris.flatMap(imageUri => {
    const existingPrefetch = inFlightImagePrefetches.get(imageUri);
    if (existingPrefetch) return [existingPrefetch];
    if (inFlightImagePrefetches.size >= AFFIRMATION_IMAGE_PREFETCH_LIMIT) {
      return [];
    }

    const prefetch = Promise.resolve()
      .then(() => Image.prefetch(imageUri))
      .then(succeeded => (succeeded ? imageUri : null))
      .catch(() => null)
      .finally(() => {
        inFlightImagePrefetches.delete(imageUri);
      });
    inFlightImagePrefetches.set(imageUri, prefetch);
    return [prefetch];
  });
  const prefetchResults = await Promise.all(prefetches);

  return prefetchResults.filter(
    (imageUri): imageUri is string => imageUri !== null,
  );
}
