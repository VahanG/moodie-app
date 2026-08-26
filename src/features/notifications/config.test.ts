import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_RANDOM_REMINDER_CONFIG,
  loadRandomReminderConfig,
  parseRandomReminderConfig,
} from './config';

const mockReadSupabaseConfig = jest.fn();
const mockSingle = jest.fn();
const mockEq = jest.fn(() => ({ single: mockSingle }));
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));

jest.mock('../supabase', () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
  readSupabaseConfig: () => mockReadSupabaseConfig(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

describe('random reminder admin configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadSupabaseConfig.mockReturnValue({
      url: 'https://example.supabase.co',
      publishableKey: 'public-key',
    });
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
  });

  test('loads and caches the globally configured count', async () => {
    mockSingle.mockResolvedValue({
      data: { random_reminders_per_day: 5 },
      error: null,
    });

    await expect(loadRandomReminderConfig()).resolves.toEqual({
      notificationsPerDay: 5,
    });
    expect(mockFrom).toHaveBeenCalledWith('notification_delivery_settings');
    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/random-reminder-config-v1',
      JSON.stringify({ notificationsPerDay: 5 }),
    );
  });

  test('falls back to a valid cache when remote loading fails', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('offline') });
    mockGetItem.mockResolvedValue(JSON.stringify({ notificationsPerDay: 4 }));

    await expect(loadRandomReminderConfig()).resolves.toEqual({
      notificationsPerDay: 4,
    });
  });

  test('uses the documented default without remote or cached config', async () => {
    mockReadSupabaseConfig.mockReturnValue(null);

    await expect(loadRandomReminderConfig()).resolves.toEqual(
      DEFAULT_RANDOM_REMINDER_CONFIG,
    );
  });

  test('uses the default when both remote and cached config are invalid', async () => {
    mockSingle.mockResolvedValue({ data: null, error: new Error('offline') });
    mockGetItem.mockResolvedValue(JSON.stringify({ notificationsPerDay: 99 }));

    await expect(loadRandomReminderConfig()).resolves.toEqual(
      DEFAULT_RANDOM_REMINDER_CONFIG,
    );
  });

  test.each([0, 9, 2.5, '3', null])('rejects invalid counts: %p', value => {
    expect(() =>
      parseRandomReminderConfig({ notificationsPerDay: value }),
    ).toThrow('Invalid random reminder configuration');
  });
});
