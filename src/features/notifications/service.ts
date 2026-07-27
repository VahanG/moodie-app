import { PermissionsAndroid, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';

const DAILY_REMINDER_CHANNEL_ID = 'moodie-daily-reminders';
const DAILY_REMINDER_NOTIFICATION_ID = 'moodie-daily-reminder';

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
      permissionResult.alert || permissionResult.badge || permissionResult.sound,
    );
  }

  return true;
}

export function scheduleDailyReminder(
  hour: number,
  minute: number,
  content: {
    title: string;
    message: string;
  } = {
    title: 'Moodie daily reminder',
    message: 'Come back and check Moodie today.',
  },
): void {
  const nextReminderDate = getNextReminderDate(hour, minute);

  cancelDailyReminder();

  PushNotification.localNotificationSchedule({
    id: DAILY_REMINDER_NOTIFICATION_ID,
    channelId: DAILY_REMINDER_CHANNEL_ID,
    title: content.title,
    message: content.message,
    date: nextReminderDate,
    repeatType: 'day',
    allowWhileIdle: true,
  });
}

export function cancelDailyReminder(): void {
  PushNotification.cancelLocalNotification(DAILY_REMINDER_NOTIFICATION_ID);
}
