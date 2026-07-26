import { PermissionsAndroid, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import {
  cancelDailyReminder,
  configureNotificationChannel,
  requestNotificationPermission,
  scheduleDailyReminder,
} from './service';

jest.mock('react-native-push-notification', () => ({
  Importance: { HIGH: 'high' },
  cancelLocalNotification: jest.fn(),
  createChannel: jest.fn(),
  localNotificationSchedule: jest.fn(),
  requestPermissions: jest.fn(),
}));

const mockPushNotification = PushNotification as jest.Mocked<
  typeof PushNotification
>;

function setPlatform(os: 'android' | 'ios', version: number | string): void {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: os,
  });
  Object.defineProperty(Platform, 'Version', {
    configurable: true,
    value: version,
  });
}

describe('native reminder service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPlatform('ios', '17.0');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('configures the Android notification channel once', () => {
    configureNotificationChannel();
    expect(mockPushNotification.createChannel).not.toHaveBeenCalled();

    setPlatform('android', 35);
    configureNotificationChannel();
    configureNotificationChannel();

    expect(mockPushNotification.createChannel).toHaveBeenCalledTimes(1);
    expect(mockPushNotification.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        channelId: 'moodie-daily-reminders',
        channelName: 'Daily reminders',
      }),
      expect.any(Function),
    );
  });

  test('requests Android 13+ permission and respects the result', async () => {
    setPlatform('android', 35);
    const requestPermission = jest
      .spyOn(PermissionsAndroid, 'request')
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.GRANTED)
      .mockResolvedValueOnce(PermissionsAndroid.RESULTS.DENIED);

    await expect(requestNotificationPermission()).resolves.toBe(true);
    await expect(requestNotificationPermission()).resolves.toBe(false);
    expect(requestPermission).toHaveBeenCalledTimes(2);
  });

  test('does not request runtime permission on older Android versions', async () => {
    setPlatform('android', 32);
    const requestPermission = jest.spyOn(PermissionsAndroid, 'request');

    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(requestPermission).not.toHaveBeenCalled();
  });

  test('accepts any granted iOS notification capability', async () => {
    mockPushNotification.requestPermissions
      .mockResolvedValueOnce({ alert: false, badge: true, sound: false })
      .mockResolvedValueOnce({ alert: false, badge: false, sound: false });

    await expect(requestNotificationPermission()).resolves.toBe(true);
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });

  test('replaces the existing reminder with the next future occurrence', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 26, 10, 0, 0));

    scheduleDailyReminder(9, 30);

    expect(mockPushNotification.cancelLocalNotification).toHaveBeenCalledWith(
      'moodie-daily-reminder',
    );
    expect(
      mockPushNotification.localNotificationSchedule,
    ).toHaveBeenCalledWith({
      id: 'moodie-daily-reminder',
      channelId: 'moodie-daily-reminders',
      title: 'Moodie daily reminder',
      message: 'Come back and check Moodie today.',
      date: new Date(2026, 6, 27, 9, 30, 0),
      repeatType: 'day',
      allowWhileIdle: true,
    });
  });

  test('cancels the stable reminder notification identifier', () => {
    cancelDailyReminder();

    expect(mockPushNotification.cancelLocalNotification).toHaveBeenCalledWith(
      'moodie-daily-reminder',
    );
  });
});
