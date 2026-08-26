import { PermissionsAndroid, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import {
  RandomReminderRange,
  ReminderNotificationContent,
  ScheduledReminder,
} from './types';
import {
  getRandomReminderRangeDurationMinutes,
  isValidRandomReminderRange,
  MIN_RANDOM_REMINDER_SPACING_MINUTES,
  reminderTimeToMinutes,
} from './validation';

export {
  getEligibleReminderAffirmations,
  selectRandomReminderAffirmation,
} from './content';

const DAILY_REMINDER_CHANNEL_ID = 'moodie-daily-reminders';
const DAILY_REMINDER_NOTIFICATION_ID = 'moodie-daily-reminder';
const RANDOM_REMINDER_NOTIFICATION_ID_PREFIX = 'moodie-random-reminder-';
export const MAX_QUEUED_RANDOM_REMINDERS = 60;

let isChannelConfigured = false;

function getNextReminderDate(hour: number, minute: number): Date {
  const now = new Date();
  const nextReminder = new Date();

  nextReminder.setHours(hour, minute, 0, 0);

  if (nextReminder <= now) {
    nextReminder.setDate(nextReminder.getDate() + 1);
  }

  return nextReminder;
}

export function configureNotificationChannel(
  channelName = 'Daily reminders',
): void {
  if (Platform.OS !== 'android' || isChannelConfigured) {
    return;
  }

  PushNotification.createChannel(
    {
      channelId: DAILY_REMINDER_CHANNEL_ID,
      channelName,
      importance: PushNotification.Importance.HIGH,
      vibrate: true,
    },
    () => {},
  );

  isChannelConfigured = true;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) {
      return true;
    }

    const permissionName = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (!permissionName) {
      return true;
    }

    const permissionResult = await PermissionsAndroid.request(permissionName);
    return permissionResult === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios') {
    const permissionResult = await PushNotification.requestPermissions();
    return Boolean(
      permissionResult.alert ||
        permissionResult.badge ||
        permissionResult.sound,
    );
  }

  return true;
}

export function scheduleDailyReminder(
  hour: number,
  minute: number,
  content: ReminderNotificationContent = {
    title: 'Moodie daily reminder',
    message: 'Come back and check Moodie today.',
  },
): ScheduledReminder | null {
  const nextReminderDate = getNextReminderDate(hour, minute);

  cancelDailyReminder();

  PushNotification.localNotificationSchedule({
    id: DAILY_REMINDER_NOTIFICATION_ID,
    channelId: DAILY_REMINDER_CHANNEL_ID,
    title: content.title,
    message: content.message,
    ...(content.affirmationId
      ? {
          userInfo: {
            affirmationId: content.affirmationId,
            affirmationText: content.message,
          },
        }
      : {}),
    date: nextReminderDate,
    repeatType: 'day',
    allowWhileIdle: true,
  });

  return content.affirmationId
    ? {
        affirmationId: content.affirmationId,
        text: content.message,
        deliveryAt: nextReminderDate.getTime(),
        repeatsDaily: true,
      }
    : null;
}

export function cancelDailyReminder(): void {
  PushNotification.cancelLocalNotification(DAILY_REMINDER_NOTIFICATION_ID);
}

function normalizedRandom(random: () => number): number {
  return Math.min(0.999999999999, Math.max(0, random()));
}

export function createRandomReminderDates(
  range: RandomReminderRange,
  notificationsPerDay: number,
  now = new Date(),
  random: () => number = Math.random,
): Date[] {
  if (!isValidRandomReminderRange(range, notificationsPerDay)) {
    throw new RangeError(
      'The random reminder range cannot preserve the minimum spacing.',
    );
  }

  const startMinutes = reminderTimeToMinutes(
    range.randomStartHour,
    range.randomStartMinute,
  );
  const durationMinutes = getRandomReminderRangeDurationMinutes(range);
  const spacingMinutes =
    (notificationsPerDay - 1) * MIN_RANDOM_REMINDER_SPACING_MINUTES;
  const slackMinutes = durationMinutes - spacingMinutes;
  const daysToQueue = Math.floor(
    MAX_QUEUED_RANDOM_REMINDERS / notificationsPerDay,
  );
  const dates: Date[] = [];

  for (let dayOffset = 0; dayOffset < daysToQueue; dayOffset += 1) {
    const randomSlackOffsets = Array.from({ length: notificationsPerDay }, () =>
      Math.floor(normalizedRandom(random) * (slackMinutes + 1)),
    ).sort((first, second) => first - second);

    randomSlackOffsets.forEach((slackOffset, index) => {
      const minuteOfDay =
        startMinutes +
        index * MIN_RANDOM_REMINDER_SPACING_MINUTES +
        slackOffset;
      const date = new Date(now);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);

      if (date > now) {
        dates.push(date);
      }
    });
  }

  return dates;
}

export function scheduleRandomReminders(
  range: RandomReminderRange,
  notificationsPerDay: number,
  contentFactory: () => ReminderNotificationContent = () => ({
    title: 'Moodie reminder',
    message: 'Come back and check Moodie today.',
  }),
): ScheduledReminder[] {
  cancelRandomReminders();
  const dates = createRandomReminderDates(range, notificationsPerDay);
  const scheduledReminders: ScheduledReminder[] = [];

  dates.forEach((date, index) => {
    const content = contentFactory();
    PushNotification.localNotificationSchedule({
      id: `${RANDOM_REMINDER_NOTIFICATION_ID_PREFIX}${index}`,
      channelId: DAILY_REMINDER_CHANNEL_ID,
      title: content.title,
      message: content.message,
      ...(content.affirmationId
        ? {
            userInfo: {
              affirmationId: content.affirmationId,
              affirmationText: content.message,
            },
          }
        : {}),
      date,
      allowWhileIdle: true,
    });

    if (content.affirmationId) {
      scheduledReminders.push({
        affirmationId: content.affirmationId,
        text: content.message,
        deliveryAt: date.getTime(),
      });
    }
  });

  return scheduledReminders;
}

export function cancelRandomReminders(): void {
  for (let index = 0; index < MAX_QUEUED_RANDOM_REMINDERS; index += 1) {
    PushNotification.cancelLocalNotification(
      `${RANDOM_REMINDER_NOTIFICATION_ID_PREFIX}${index}`,
    );
  }
}
