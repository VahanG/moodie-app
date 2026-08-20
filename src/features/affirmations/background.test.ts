import { resolveAffirmationBackground } from './background';
import {
  AffirmationBackground,
  AffirmationBackgroundPreference,
} from './types';

const backgrounds: AffirmationBackground[] = [
  {
    id: 'forest',
    imageUri: 'https://example.com/forest.jpg',
    tags: ['forest'],
  },
  {
    id: 'ocean',
    imageUri: 'https://example.com/ocean.jpg',
    tags: ['ocean'],
  },
  {
    id: 'mountain',
    imageUri: 'https://example.com/mountain.jpg',
    tags: ['mountain'],
  },
];

function preference(
  mode: AffirmationBackgroundPreference['mode'],
  backgroundId: string | null,
): AffirmationBackgroundPreference {
  return { mode, backgroundId };
}

describe('affirmation background resolution', () => {
  test('uses the selected fixed background before an affirmation suggestion', () => {
    expect(
      resolveAffirmationBackground({
        affirmationImageUri: 'https://example.com/suggested.jpg',
        backgrounds,
        preference: preference('fixed', 'ocean'),
      }),
    ).toEqual({
      backgroundId: 'ocean',
      imageUri: 'https://example.com/ocean.jpg',
      source: 'fixed',
    });
  });

  test('uses the affirmation suggestion when fixed mode is not active', () => {
    expect(
      resolveAffirmationBackground({
        affirmationImageUri: ' https://example.com/suggested.jpg ',
        backgrounds,
        preference: preference('free', 'ocean'),
      }),
    ).toEqual({
      backgroundId: null,
      imageUri: 'https://example.com/suggested.jpg',
      source: 'suggested',
    });
  });

  test('chooses a random catalog background when the suggestion is empty', () => {
    expect(
      resolveAffirmationBackground({
        affirmationImageUri: '',
        backgrounds,
        preference: preference('free', null),
        random: () => 0.5,
      }),
    ).toEqual({
      backgroundId: 'ocean',
      imageUri: 'https://example.com/ocean.jpg',
      source: 'random',
    });
  });

  test('uses the random fallback when a saved fixed background is unavailable', () => {
    expect(
      resolveAffirmationBackground({
        affirmationImageUri: '   ',
        backgrounds,
        preference: preference('fixed', 'removed-background'),
        random: () => 0.99,
      }),
    ).toEqual({
      backgroundId: 'mountain',
      imageUri: 'https://example.com/mountain.jpg',
      source: 'random',
    });
  });

  test('returns no image when neither a suggestion nor catalog background exists', () => {
    expect(
      resolveAffirmationBackground({
        affirmationImageUri: '',
        backgrounds: [],
        preference: preference('free', null),
      }),
    ).toBeNull();
  });
});
