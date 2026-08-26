import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadPendingUserSettings } from './device';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;

describe('pending user settings compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('adds random reminder defaults to a legacy pending snapshot', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        userId: 'user-1',
        settings: {
          languageCode: 'en',
          themePreference: 'system',
          reminderPreferences: { enabled: true, hour: 8, minute: 30 },
          selectedTopicIds: ['growth'],
          backgroundPreference: { mode: 'free', backgroundId: null },
          likedAffirmationKeys: [],
        },
      }),
    );

    await expect(loadPendingUserSettings()).resolves.toEqual(
      expect.objectContaining({
        userId: 'user-1',
        settings: expect.objectContaining({
          reminderPreferences: {
            enabled: true,
            hour: 8,
            minute: 30,
            randomEnabled: false,
            randomStartHour: 9,
            randomStartMinute: 0,
            randomEndHour: 17,
            randomEndMinute: 0,
          },
        }),
      }),
    );
  });

  test('drops a pending snapshot with partially written random fields', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        userId: 'user-1',
        settings: {
          reminderPreferences: {
            enabled: false,
            hour: 9,
            minute: 0,
            randomEnabled: true,
          },
        },
      }),
    );

    await expect(loadPendingUserSettings()).resolves.toBeNull();
  });
});
