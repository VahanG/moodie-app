export type OpenedNotificationAffirmation = {
  id: string;
  text: string;
};

type NotificationPayload = {
  data?: unknown;
  message?: unknown;
  userInfo?: unknown;
  userInteraction?: boolean;
};

type Listener = (affirmation: OpenedNotificationAffirmation) => void;

const listeners = new Set<Listener>();
let pendingAffirmation: OpenedNotificationAffirmation | null = null;

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
): OpenedNotificationAffirmation | null {
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

export function handleNotificationInteraction(
  notification: NotificationPayload,
): void {
  const affirmation = getOpenedNotificationAffirmation(notification);
  if (!affirmation) {
    return;
  }

  if (listeners.size === 0) {
    pendingAffirmation = affirmation;
    return;
  }

  listeners.forEach(listener => listener(affirmation));
}

export function subscribeToOpenedNotificationAffirmation(
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
