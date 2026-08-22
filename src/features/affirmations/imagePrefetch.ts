import { Image } from 'react-native';

export const AFFIRMATION_IMAGE_PREFETCH_LIMIT = 2;

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
  const prefetchResults = await Promise.all(
    imageUris.slice(0, AFFIRMATION_IMAGE_PREFETCH_LIMIT).map(async imageUri => {
      try {
        return (await Image.prefetch(imageUri)) ? imageUri : null;
      } catch {
        // A failed prefetch must not interrupt affirmation navigation.
        return null;
      }
    }),
  );

  return prefetchResults.filter(
    (imageUri): imageUri is string => imageUri !== null,
  );
}
