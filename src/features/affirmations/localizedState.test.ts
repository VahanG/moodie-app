import {
  EMPTY_AFFIRMATION_CONTENT,
  getAffirmationContentForLanguage,
  getAffirmationContentStatusForLanguage,
} from './localizedState';
import { AffirmationContent } from './types';

const englishContent: AffirmationContent = {
  topics: [
    {
      id: 'growth',
      name: 'Growth',
      imageUri: 'https://example.com/topic.jpg',
      affirmations: [
        {
          id: 'affirmation-1',
          text: 'English affirmation',
          imageUri: 'https://example.com/affirmation.jpg',
        },
      ],
    },
  ],
  backgrounds: [
    {
      id: 'forest',
      imageUri: 'https://example.com/forest.jpg',
      tags: ['growth'],
    },
  ],
};

describe('localized affirmation content state', () => {
  test('never exposes content loaded for another language', () => {
    expect(getAffirmationContentForLanguage(englishContent, 'en', 'hy')).toBe(
      EMPTY_AFFIRMATION_CONTENT,
    );
  });

  test('exposes content only when its language matches the selection', () => {
    expect(getAffirmationContentForLanguage(englishContent, 'en', 'en')).toBe(
      englishContent,
    );
  });

  test('shows loading while the selected languages request has not started', () => {
    expect(getAffirmationContentStatusForLanguage('ready', 'en', 'hy')).toBe(
      'loading',
    );
    expect(getAffirmationContentStatusForLanguage('error', 'hy', 'hy')).toBe(
      'error',
    );
  });
});
