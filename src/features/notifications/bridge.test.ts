import { NativeModules, Platform } from 'react-native';
import { consumeNativeOpenedNotification } from './bridge';

function setPlatform(os: 'android' | 'ios'): void {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
}

describe('native opened-notification bridge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('ios');
  });

  test('consumes a valid persisted iOS notification affirmation', async () => {
    NativeModules.MoodieWidgetBridge = {
      consumeOpenedNotification: jest.fn().mockResolvedValue(
        JSON.stringify({
          affirmationId: 'calm-1',
          affirmationText: 'I return to calm.',
        }),
      ),
    };

    await expect(consumeNativeOpenedNotification()).resolves.toEqual({
      id: 'calm-1',
      text: 'I return to calm.',
    });
  });

  test('ignores malformed payloads and non-iOS platforms', async () => {
    const consumeOpenedNotification = jest.fn().mockResolvedValue('{');
    NativeModules.MoodieWidgetBridge = { consumeOpenedNotification };

    await expect(consumeNativeOpenedNotification()).resolves.toBeNull();

    setPlatform('android');
    await expect(consumeNativeOpenedNotification()).resolves.toBeNull();
    expect(consumeOpenedNotification).toHaveBeenCalledTimes(1);
  });
});
