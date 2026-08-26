import * as Linking from 'expo-linking';
import { AppState } from 'react-native';
import { loadPublishedWidgetAffirmation } from '../widgets/service';
import { consumeNativeOpenedNotification } from './bridge';

export type OpenedAffirmation = {
  id: string;
  text: string;
};

type NotificationPayload = {
  data?: unknown;
  message?: unknown;
  userInfo?: unknown;
  userInteraction?: boolean;
};

type Listener = (affirmation: OpenedAffirmation) => void;

const listeners = new Set<Listener>();
let pendingAffirmation: OpenedAffirmation | null = null;

function parsePayload(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try {
      return parsePayload(JSON.parse(value));
    } catch {
      return null;
    }
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function getOpenedNotificationAffirmation(
  notification: NotificationPayload,
): OpenedAffirmation | null {
  if (notification.userInteraction !== true) {
    return null;
  }

  const payloads = [
    parsePayload(notification.data),
    parsePayload(notification.userInfo),
    parsePayload(notification),
  ];

  for (const payload of payloads) {
    if (
      payload &&
      typeof payload.affirmationId === 'string' &&
      payload.affirmationId.length > 0 &&
      typeof payload.affirmationText === 'string' &&
      payload.affirmationText.length > 0
    ) {
      return {
        id: payload.affirmationId,
        text: payload.affirmationText,
      };
    }
  }

  return null;
}

export function getOpenedAffirmationFromUrl(
  value: string,
): OpenedAffirmation | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'moodie-app:' || url.hostname !== 'affirmations') {
      return null;
    }

    const id = url.searchParams.get('affirmationId')?.trim();
    const text = url.searchParams.get('affirmationText')?.trim();
    if (!id || !text) {
      return null;
    }

    return { id, text };
  } catch {
    return null;
  }
}

function isAffirmationUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'moodie-app:' && url.hostname === 'affirmations';
  } catch {
    return false;
  }
}

function publishOpenedAffirmation(affirmation: OpenedAffirmation): void {
  if (listeners.size === 0) {
    pendingAffirmation = affirmation;
    return;
  }

  listeners.forEach(listener => listener(affirmation));
}

export function handleNotificationInteraction(
  notification: NotificationPayload,
): void {
  const affirmation = getOpenedNotificationAffirmation(notification);
  if (!affirmation) {
    return;
  }

  publishOpenedAffirmation(affirmation);
}

export function handleOpenedAffirmationUrl(url: string): boolean {
  const affirmation = getOpenedAffirmationFromUrl(url);
  if (!affirmation) {
    return false;
  }

  publishOpenedAffirmation(affirmation);
  return true;
}

export function subscribeToOpenedAffirmationLinks(): () => void {
  const consumePendingLink = () => {
    const url = Linking.getLinkingURL();
    if (!url || !isAffirmationUrl(url)) {
      return;
    }

    const consume = async () => {
      const handledExactLink = handleOpenedAffirmationUrl(url);
      if (!handledExactLink) {
        const affirmation = await loadPublishedWidgetAffirmation();
        if (affirmation) {
          publishOpenedAffirmation(affirmation);
        }
      }

      if (Linking.getLinkingURL() === url) {
        Linking.clearInitialURL();
      }
    };

    consume().catch(() => undefined);
  };

  const consumePendingNativeNotification = () => {
    consumeNativeOpenedNotification()
      .then(affirmation => {
        if (affirmation) {
          publishOpenedAffirmation(affirmation);
        }
      })
      .catch(() => undefined);
  };

  const consumePendingEntryPoints = () => {
    consumePendingLink();
    consumePendingNativeNotification();
  };

  consumePendingEntryPoints();
  const coldStartRetry = setTimeout(consumePendingNativeNotification, 1000);
  const subscription = AppState.addEventListener('change', nextState => {
    if (nextState === 'active') {
      consumePendingEntryPoints();
    }
  });

  return () => {
    clearTimeout(coldStartRetry);
    subscription.remove();
  };
}

export function subscribeToOpenedAffirmation(
  listener: Listener,
): () => void {
  listeners.add(listener);

  if (pendingAffirmation) {
    const affirmation = pendingAffirmation;
    pendingAffirmation = null;
    listener(affirmation);
  }

  return () => {
    listeners.delete(listener);
  };
}
