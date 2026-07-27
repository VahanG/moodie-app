import {
  subscribeToUserSettings,
  synchronizeCurrentUserSettings,
  syncCurrentDeviceSettingsToDatabase,
} from './service';
import { UserSettingsSnapshot } from './types';

const mockLoadDeviceUserSettings = jest.fn();
const mockSaveDeviceUserSettings = jest.fn();
const mockLoadPendingUserSettings = jest.fn();
const mockSavePendingUserSettings = jest.fn();
const mockClearPendingUserSettings = jest.fn();
const mockGetCurrentUserId = jest.fn();
const mockLoadDatabaseUserSettings = jest.fn();
const mockUpsertDatabaseUserSettings = jest.fn();

jest.mock('./device', () => ({
  loadDeviceUserSettings: () => mockLoadDeviceUserSettings(),
  saveDeviceUserSettings: (snapshot: UserSettingsSnapshot) =>
    mockSaveDeviceUserSettings(snapshot),
  loadPendingUserSettings: () => mockLoadPendingUserSettings(),
  savePendingUserSettings: (pending: unknown) =>
    mockSavePendingUserSettings(pending),
  clearPendingUserSettings: () => mockClearPendingUserSettings(),
}));

jest.mock('./remote', () => ({
  getCurrentUserId: () => mockGetCurrentUserId(),
  loadDatabaseUserSettings: (userId: string) =>
    mockLoadDatabaseUserSettings(userId),
  upsertDatabaseUserSettings: (
    userId: string,
    snapshot: UserSettingsSnapshot,
  ) => mockUpsertDatabaseUserSettings(userId, snapshot),
}));

function makeSettings(themePreference: 'system' | 'light' | 'dark') {
  return {
    languageCode: 'en',
    themePreference,
    reminderPreferences: { enabled: false, hour: 9, minute: 0 },
    selectedTopicIds: ['growth'],
    backgroundPreference: { mode: 'free' as const, backgroundId: null },
    likedAffirmationKeys: ['affirmation-1'],
  };
}

describe('user settings synchronization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadDeviceUserSettings.mockResolvedValue(makeSettings('system'));
    mockSaveDeviceUserSettings.mockResolvedValue(undefined);
    mockLoadPendingUserSettings.mockResolvedValue(null);
    mockSavePendingUserSettings.mockResolvedValue(undefined);
    mockClearPendingUserSettings.mockResolvedValue(undefined);
    mockGetCurrentUserId.mockResolvedValue('user-1');
    mockLoadDatabaseUserSettings.mockResolvedValue(makeSettings('dark'));
    mockUpsertDatabaseUserSettings.mockResolvedValue(undefined);
  });

  test('gives an existing database row priority after login', async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToUserSettings(listener);

    const result = await synchronizeCurrentUserSettings();

    expect(result.source).toBe('database');
    expect(result.settings.themePreference).toBe('dark');
    expect(mockSaveDeviceUserSettings).toHaveBeenCalledWith(
      makeSettings('dark'),
    );
    expect(listener).toHaveBeenLastCalledWith(makeSettings('dark'));
    expect(mockUpsertDatabaseUserSettings).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('seeds a missing database row from current device settings', async () => {
    mockLoadDatabaseUserSettings.mockResolvedValue(null);

    const result = await synchronizeCurrentUserSettings();

    expect(result.source).toBe('device');
    expect(mockUpsertDatabaseUserSettings).toHaveBeenCalledWith(
      'user-1',
      makeSettings('system'),
    );
  });

  test('retries a matching pending snapshot before pulling older data', async () => {
    mockLoadPendingUserSettings.mockResolvedValue({
      userId: 'user-1',
      settings: makeSettings('light'),
    });

    const result = await synchronizeCurrentUserSettings();

    expect(result.source).toBe('pending');
    expect(mockUpsertDatabaseUserSettings).toHaveBeenCalledWith(
      'user-1',
      makeSettings('light'),
    );
    expect(mockClearPendingUserSettings).toHaveBeenCalled();
    expect(mockLoadDatabaseUserSettings).not.toHaveBeenCalled();
  });

  test('never uploads another users pending snapshot', async () => {
    mockLoadPendingUserSettings.mockResolvedValue({
      userId: 'user-2',
      settings: makeSettings('light'),
    });

    const result = await synchronizeCurrentUserSettings();

    expect(result.source).toBe('database');
    expect(mockUpsertDatabaseUserSettings).not.toHaveBeenCalled();
  });

  test('stores a user-scoped pending snapshot around authenticated writes', async () => {
    await syncCurrentDeviceSettingsToDatabase();

    expect(mockSavePendingUserSettings).toHaveBeenCalledWith({
      userId: 'user-1',
      settings: makeSettings('system'),
    });
    expect(mockUpsertDatabaseUserSettings).toHaveBeenCalledWith(
      'user-1',
      makeSettings('system'),
    );
    expect(mockClearPendingUserSettings).toHaveBeenCalled();
  });

  test('serializes complete snapshots so an older write cannot finish last', async () => {
    mockLoadDeviceUserSettings
      .mockResolvedValueOnce(makeSettings('light'))
      .mockResolvedValueOnce(makeSettings('dark'));

    const firstWrite = syncCurrentDeviceSettingsToDatabase();
    const secondWrite = syncCurrentDeviceSettingsToDatabase();
    await Promise.all([firstWrite, secondWrite]);

    expect(mockUpsertDatabaseUserSettings.mock.calls).toEqual([
      ['user-1', makeSettings('light')],
      ['user-1', makeSettings('dark')],
    ]);
  });
});
