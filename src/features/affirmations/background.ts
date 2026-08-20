import {
  AffirmationBackground,
  AffirmationBackgroundPreference,
} from './types';

export type ResolvedAffirmationBackground = {
  backgroundId: string | null;
  imageUri: string;
  source: 'fixed' | 'suggested' | 'random';
};

type ResolveAffirmationBackgroundOptions = {
  affirmationImageUri: string;
  backgrounds: AffirmationBackground[];
  preference: AffirmationBackgroundPreference;
  random?: () => number;
};

export function resolveAffirmationBackground({
  affirmationImageUri,
  backgrounds,
  preference,
  random = Math.random,
}: ResolveAffirmationBackgroundOptions): ResolvedAffirmationBackground | null {
  if (preference.mode === 'fixed' && preference.backgroundId !== null) {
    const fixedBackground = backgrounds.find(
      background => background.id === preference.backgroundId,
    );
    if (fixedBackground) {
      return {
        backgroundId: fixedBackground.id,
        imageUri: fixedBackground.imageUri,
        source: 'fixed',
      };
    }
  }

  const suggestedImageUri = affirmationImageUri.trim();
  if (suggestedImageUri) {
    return {
      backgroundId: null,
      imageUri: suggestedImageUri,
      source: 'suggested',
    };
  }

  if (backgrounds.length === 0) {
    return null;
  }

  const randomIndex = Math.min(
    backgrounds.length - 1,
    Math.max(0, Math.floor(random() * backgrounds.length)),
  );
  const randomBackground = backgrounds[randomIndex];
  return {
    backgroundId: randomBackground.id,
    imageUri: randomBackground.imageUri,
    source: 'random',
  };
}
