import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_REMINDER_PREFERENCES,
  loadReminderPreferences,
  saveReminderPreferences,
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

describe('reminder preference storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses the documented default when no preference has been saved', async () => {
    mockGetItem.mockResolvedValue(null);

    await expect(loadReminderPreferences()).resolves.toEqual(
      DEFAULT_REMINDER_PREFERENCES,
    );
  });

  test.each([
    { enabled: true, hour: 0, minute: 0 },
    { enabled: false, hour: 23, minute: 59 },
  ])('accepts valid boundary time $hour:$minute', async preferences => {
    mockGetItem.mockResolvedValue(JSON.stringify(preferences));

    await expect(loadReminderPreferences()).resolves.toEqual(preferences);
  });

  test.each([
    null,
    {},
    { enabled: 'yes', hour: 9, minute: 0 },
    { enabled: true, hour: -1, minute: 0 },
    { enabled: true, hour: 24, minute: 0 },
    { enabled: true, hour: 9, minute: 60 },
    { enabled: true, hour: 9.5, minute: 0 },
  ])('rejects invalid stored preferences: %p', async preferences => {
    mockGetItem.mockResolvedValue(JSON.stringify(preferences));

    await expect(loadReminderPreferences()).rejects.toThrow(
      'Invalid reminder preferences found in storage.',
    );
  });

  test('persists the complete reminder preference', async () => {
    const preferences = { enabled: true, hour: 8, minute: 30 };

    await saveReminderPreferences(preferences);

    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/daily-reminder-preferences',
      JSON.stringify(preferences),
    );
  });
});
