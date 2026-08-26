import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReminderAffirmation } from '../notifications/content';
import type { ScheduledReminder } from '../notifications/types';
import { setNativeWidgetState } from './bridge';
import type {
  AffirmationWidgetPayload,
  WidgetAffirmation,
  WidgetScheduledAffirmation,
} from './types';

export const AFFIRMATION_WIDGET_STORAGE_KEY =
  '@moodie/affirmation-widget-state-v1';
export const AFFIRMATION_WIDGET_ROTATION_MS = 3 * 60 * 60 * 1000;
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

function normalizeAffirmations(
  affirmations: ReminderAffirmation[],
): WidgetAffirmation[] {
  const seenIds = new Set<string>();

  return affirmations.flatMap(affirmation => {
    const id = affirmation.id.trim();
    const text = affirmation.text.trim();
    if (!id || !text || seenIds.has(id)) {
      return [];
    }

    seenIds.add(id);
    return [{ id, text }];
  });
}

function isWidgetScheduledAffirmation(
  value: unknown,
): value is WidgetScheduledAffirmation {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<WidgetScheduledAffirmation>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.text === 'string' &&
    candidate.text.trim().length > 0 &&
    typeof candidate.deliveryAt === 'number' &&
    Number.isFinite(candidate.deliveryAt) &&
    (candidate.repeatsDaily === undefined ||
      typeof candidate.repeatsDaily === 'boolean')
  );
}

export function parseAffirmationWidgetPayload(
  storedValue: string | null,
): AffirmationWidgetPayload | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<AffirmationWidgetPayload>;
    if (
      parsed.version !== 1 ||
      typeof parsed.notificationsEnabled !== 'boolean' ||
      !Array.isArray(parsed.affirmations) ||
      !Array.isArray(parsed.scheduledNotifications) ||
      typeof parsed.updatedAt !== 'number' ||
      !Number.isFinite(parsed.updatedAt) ||
      !parsed.affirmations.every(
        affirmation =>
          Boolean(affirmation) &&
          typeof affirmation.id === 'string' &&
          affirmation.id.trim().length > 0 &&
          typeof affirmation.text === 'string' &&
          affirmation.text.trim().length > 0,
      ) ||
      !parsed.scheduledNotifications.every(isWidgetScheduledAffirmation) ||
      (parsed.lastNotification !== null &&
        !isWidgetScheduledAffirmation(parsed.lastNotification))
    ) {
      return null;
    }

    return parsed as AffirmationWidgetPayload;
  } catch {
    return null;
  }
}

function effectiveDeliveryAt(
  notification: WidgetScheduledAffirmation,
  now: number,
): number | null {
  if (notification.deliveryAt > now) {
    return null;
  }

  if (!notification.repeatsDaily) {
    return notification.deliveryAt;
  }

  const elapsedIntervals = Math.floor(
    (now - notification.deliveryAt) / DAILY_INTERVAL_MS,
  );
  return notification.deliveryAt + elapsedIntervals * DAILY_INTERVAL_MS;
}

export function getLatestDeliveredWidgetNotification(
  payload: AffirmationWidgetPayload,
  now = Date.now(),
): WidgetScheduledAffirmation | null {
  const candidates = [
    ...(payload.lastNotification ? [payload.lastNotification] : []),
    ...payload.scheduledNotifications,
  ];

  return candidates.reduce<WidgetScheduledAffirmation | null>(
    (latest, candidate) => {
      const deliveredAt = effectiveDeliveryAt(candidate, now);
      if (deliveredAt === null || deliveredAt <= (latest?.deliveryAt ?? -1)) {
        return latest;
      }

      return { ...candidate, deliveryAt: deliveredAt, repeatsDaily: undefined };
    },
    null,
  );
}

export function getRotatingWidgetAffirmation(
  affirmations: WidgetAffirmation[],
  now = Date.now(),
): WidgetAffirmation | null {
  if (affirmations.length === 0) {
    return null;
  }

  const index =
    Math.floor(now / AFFIRMATION_WIDGET_ROTATION_MS) % affirmations.length;
  return affirmations[index];
}

export function resolveWidgetAffirmation(
  payload: AffirmationWidgetPayload,
  now = Date.now(),
): WidgetAffirmation | null {
  if (payload.notificationsEnabled) {
    const latestNotification = getLatestDeliveredWidgetNotification(
      payload,
      now,
    );
    if (latestNotification) {
      return latestNotification;
    }
  }

  return getRotatingWidgetAffirmation(payload.affirmations, now);
}

type PublishAffirmationWidgetStateOptions = {
  notificationsEnabled: boolean;
  affirmations: ReminderAffirmation[];
  scheduledNotifications: ScheduledReminder[];
  now?: number;
};

async function publishAffirmationWidgetStateImmediately({
  notificationsEnabled,
  affirmations,
  scheduledNotifications,
  now = Date.now(),
}: PublishAffirmationWidgetStateOptions): Promise<AffirmationWidgetPayload> {
  const normalizedAffirmations = normalizeAffirmations(affirmations);
  const eligibleIds = new Set(
    normalizedAffirmations.map(affirmation => affirmation.id),
  );
  const previousPayload = parseAffirmationWidgetPayload(
    await AsyncStorage.getItem(AFFIRMATION_WIDGET_STORAGE_KEY),
  );
  const previousLatest = previousPayload
    ? getLatestDeliveredWidgetNotification(previousPayload, now)
    : null;
  const lastNotification =
    notificationsEnabled && previousLatest && eligibleIds.has(previousLatest.id)
      ? previousLatest
      : null;
  const normalizedScheduledNotifications = notificationsEnabled
    ? scheduledNotifications.flatMap(notification => {
        const id = notification.affirmationId.trim();
        const text = notification.text.trim();
        if (
          !eligibleIds.has(id) ||
          !text ||
          !Number.isFinite(notification.deliveryAt)
        ) {
          return [];
        }

        return [
          {
            id,
            text,
            deliveryAt: notification.deliveryAt,
            ...(notification.repeatsDaily ? { repeatsDaily: true } : {}),
          },
        ];
      })
    : [];
  const payload: AffirmationWidgetPayload = {
    version: 1,
    notificationsEnabled,
    affirmations: normalizedAffirmations,
    scheduledNotifications: normalizedScheduledNotifications,
    lastNotification,
    updatedAt: now,
  };
  const serializedPayload = JSON.stringify(payload);

  await AsyncStorage.setItem(AFFIRMATION_WIDGET_STORAGE_KEY, serializedPayload);
  await setNativeWidgetState(serializedPayload);
  return payload;
}

let widgetPublicationQueue: Promise<void> = Promise.resolve();

export function publishAffirmationWidgetState(
  options: PublishAffirmationWidgetStateOptions,
): Promise<AffirmationWidgetPayload> {
  const publication = widgetPublicationQueue.then(() =>
    publishAffirmationWidgetStateImmediately(options),
  );
  widgetPublicationQueue = publication.then(
    () => undefined,
    () => undefined,
  );
  return publication;
}
