import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildAffirmationLikeKey,
  loadAffirmationBackgroundPreference,
  loadLikedAffirmationKeys,
  loadSelectedAffirmationTopics,
  saveAffirmationBackgroundPreference,
  saveSelectedAffirmationTopics,
  toggleLikedAffirmationKey,
} from './storage';

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('affirmation preference storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('builds stable like keys from normalized affirmation text', () => {
    expect(buildAffirmationLikeKey('  affirmation-1  ')).toBe('affirmation-1');
    expect(() => buildAffirmationLikeKey('   ')).toThrow(
      'Affirmation ID is required',
    );
  });

  test('loads an empty default and supports the legacy single-topic format', async () => {
    mockGetItem.mockResolvedValueOnce(null).mockResolvedValueOnce('"calm"');

    await expect(loadSelectedAffirmationTopics()).resolves.toEqual([]);
    await expect(loadSelectedAffirmationTopics()).resolves.toEqual(['calm']);
  });

  test('keeps database identifiers and removes duplicates', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify(['calm', 'unknown', 'calm', 'focus']),
    );

    await expect(loadSelectedAffirmationTopics()).resolves.toEqual([
      'calm',
      'unknown',
      'focus',
    ]);
  });

  test('persists each selected topic only once', async () => {
    await saveSelectedAffirmationTopics(['calm', 'growth', 'calm']);

    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/selected-affirmation-topic',
      JSON.stringify(['calm', 'growth']),
    );
  });

  test('validates stored and newly saved background preferences', async () => {
    const preference = { mode: 'fixed' as const, backgroundId: 'forest-path' };
    mockGetItem
      .mockResolvedValueOnce(JSON.stringify(preference))
      .mockResolvedValueOnce(
        JSON.stringify({ mode: 'fixed', backgroundId: '' }),
      );

    await expect(loadAffirmationBackgroundPreference()).resolves.toEqual(
      preference,
    );
    await expect(loadAffirmationBackgroundPreference()).rejects.toThrow(
      'Invalid affirmation background preference in storage.',
    );
    await expect(
      saveAffirmationBackgroundPreference({
        mode: 'unknown' as never,
        backgroundId: null,
      }),
    ).rejects.toThrow('Invalid affirmation background preference.');
  });

  test('normalizes stored likes and toggles a like persistently', async () => {
    mockGetItem
      .mockResolvedValueOnce(JSON.stringify(['growth::One', 4, 'growth::One']))
      .mockResolvedValueOnce(JSON.stringify(['growth::One']));

    await expect(loadLikedAffirmationKeys()).resolves.toEqual(['growth::One']);
    await expect(toggleLikedAffirmationKey(' growth::Two ')).resolves.toBe(
      true,
    );
    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/liked-affirmations',
      JSON.stringify(['growth::One', 'growth::Two']),
    );
  });
});
