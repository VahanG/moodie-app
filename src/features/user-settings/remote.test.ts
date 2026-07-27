jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { parseUserSettingsRow } from './remote';

describe('database user settings parsing', () => {
  const row = {
    user_id: 'user-1',
    theme_preference: 'dark',
    reminder_enabled: true,
    reminder_hour: 8,
    reminder_minute: 30,
    selected_topic_ids: ['growth', 'growth', 'calm'],
    background_mode: 'fixed',
    background_id: 'forest',
    liked_affirmation_keys: ['affirmation-1'],
  };

  test('validates and normalizes a complete current-user row', () => {
    expect(parseUserSettingsRow(row)).toEqual({
      themePreference: 'dark',
      reminderPreferences: { enabled: true, hour: 8, minute: 30 },
      selectedTopicIds: ['growth', 'calm'],
      backgroundPreference: { mode: 'fixed', backgroundId: 'forest' },
      likedAffirmationKeys: ['affirmation-1'],
    });
  });

  test('rejects invalid remote state before it replaces device settings', () => {
    expect(() => parseUserSettingsRow({ ...row, reminder_hour: 24 })).toThrow(
      'Invalid reminder preferences',
    );
    expect(() =>
      parseUserSettingsRow({
        ...row,
        background_mode: 'fixed',
        background_id: null,
      }),
    ).toThrow('fixed background is missing');
  });
});
