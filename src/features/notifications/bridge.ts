import { NativeModules, Platform } from 'react-native';
import type { OpenedAffirmation } from './openedAffirmation';

type MoodieNotificationBridge = {
  consumeOpenedNotification?: () => Promise<string | null>;
};

export async function consumeNativeOpenedNotification(): Promise<OpenedAffirmation | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  const bridge = NativeModules.MoodieWidgetBridge as
    | MoodieNotificationBridge
    | undefined;
  if (!bridge?.consumeOpenedNotification) {
    return null;
  }

  const value = await bridge.consumeOpenedNotification();
  if (!value) {
    return null;
  }

  try {
    const payload = JSON.parse(value) as Record<string, unknown>;
    if (
      typeof payload.affirmationId !== 'string' ||
      payload.affirmationId.length === 0 ||
      typeof payload.affirmationText !== 'string' ||
      payload.affirmationText.length === 0
    ) {
      return null;
    }

    return {
      id: payload.affirmationId,
      text: payload.affirmationText,
    };
  } catch {
    return null;
  }
}
