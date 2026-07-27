jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import { translate } from './service';

describe('application text translation', () => {
  test('remote admin text overrides bundled text and interpolates values', () => {
    expect(
      translate(
        {
          'notifications.currentTime': 'Remote time: {{time}}',
        },
        'notifications.currentTime',
        { time: '08:30' },
        'en',
      ),
    ).toBe('Remote time: 08:30');
  });

  test('falls back to bundled English and preserves unknown placeholders', () => {
    expect(translate({}, 'settings.title', {}, 'hy')).toBe('Settings');
    expect(
      translate(
        {},
        'affirmations.chooseTopic',
        {},
        'en',
      ),
    ).toContain('{{topic}}');
  });

  test('returns an unknown stable key instead of blank UI', () => {
    expect(translate({}, 'future.missingText')).toBe('future.missingText');
  });
});
