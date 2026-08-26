import { PermissionsAndroid, Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import {
  cancelDailyReminder,
  cancelRandomReminders,
  configureNotificationChannel,
  createRandomReminderDates,
  getEligibleReminderAffirmations,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleRandomReminders,
  selectRandomReminderAffirmation,
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
    jest.restoreAllMocks();
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
    expect(mockPushNotification.localNotificationSchedule).toHaveBeenCalledWith(
      {
        id: 'moodie-daily-reminder',
        channelId: 'moodie-daily-reminders',
        title: 'Moodie daily reminder',
        message: 'Come back and check Moodie today.',
        date: new Date(2026, 6, 27, 9, 30, 0),
        repeatType: 'day',
        allowWhileIdle: true,
      },
    );
  });

  test('selects a random non-empty affirmation', () => {
    expect(
      selectRandomReminderAffirmation(
        [
          { id: 'first', text: ' First ' },
          { id: 'empty', text: '' },
          { id: 'second', text: 'Second' },
          { id: 'third', text: 'Third' },
        ],
        () => 0.5,
      ),
    ).toEqual({ id: 'second', text: 'Second' });
    expect(selectRandomReminderAffirmation([], () => 0.5)).toBeNull();
  });

  test('uses affirmation messages from the selected topics', () => {
    const topics = [
      {
        id: 'calm',
        name: 'Calm',
        imageUri: '',
        affirmations: [{ id: 'calm-1', imageUri: '', text: 'I am calm.' }],
      },
      {
        id: 'growth',
        name: 'Growth',
        imageUri: '',
        affirmations: [
          { id: 'growth-1', imageUri: '', text: 'I welcome growth.' },
        ],
      },
    ];

    expect(getEligibleReminderAffirmations(topics, ['growth'])).toEqual([
      { id: 'growth-1', text: 'I welcome growth.' },
    ]);
    expect(getEligibleReminderAffirmations(topics, [])).toEqual([
      { id: 'calm-1', text: 'I am calm.' },
      { id: 'growth-1', text: 'I welcome growth.' },
    ]);
  });

  test('schedules the selected affirmation as the notification message', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 26, 8, 0, 0));

    const scheduledReminder = scheduleDailyReminder(9, 30, {
      title: 'Moodie daily reminder',
      message: 'I welcome today with calm and confidence.',
      affirmationId: 'growth-1',
    });

    expect(mockPushNotification.localNotificationSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Moodie daily reminder',
        message: 'I welcome today with calm and confidence.',
        userInfo: {
          affirmationId: 'growth-1',
          affirmationText: 'I welcome today with calm and confidence.',
        },
      }),
    );
    expect(scheduledReminder).toEqual({
      affirmationId: 'growth-1',
      text: 'I welcome today with calm and confidence.',
      deliveryAt: new Date(2026, 6, 26, 9, 30, 0).getTime(),
      repeatsDaily: true,
    });
  });

  test('cancels the stable reminder notification identifier', () => {
    cancelDailyReminder();

    expect(mockPushNotification.cancelLocalNotification).toHaveBeenCalledWith(
      'moodie-daily-reminder',
    );
  });

  test('creates changing daily times with at least one hour of spacing', () => {
    const now = new Date(2026, 6, 26, 8, 0, 0);
    const values = [0, 0.5, 0.999, 0.25, 0.75];
    let valueIndex = 0;
    const dates = createRandomReminderDates(
      {
        randomStartHour: 9,
        randomStartMinute: 0,
        randomEndHour: 17,
        randomEndMinute: 0,
      },
      3,
      now,
      () => values[valueIndex++ % values.length],
    );

    expect(dates).toHaveLength(60);
    for (let index = 0; index < dates.length; index += 3) {
      const dailyDates = dates.slice(index, index + 3);
      expect(dailyDates[0].getHours()).toBeGreaterThanOrEqual(9);
      expect(dailyDates[2].getHours()).toBeLessThanOrEqual(17);
      expect(
        dailyDates[1].getTime() - dailyDates[0].getTime(),
      ).toBeGreaterThanOrEqual(60 * 60 * 1000);
      expect(
        dailyDates[2].getTime() - dailyDates[1].getTime(),
      ).toBeGreaterThanOrEqual(60 * 60 * 1000);
    }
    expect(
      dates.slice(0, 3).map(date => `${date.getHours()}:${date.getMinutes()}`),
    ).not.toEqual(
      dates.slice(3, 6).map(date => `${date.getHours()}:${date.getMinutes()}`),
    );
  });

  test('skips elapsed occurrences today and rejects a range that is too narrow', () => {
    const range = {
      randomStartHour: 9,
      randomStartMinute: 0,
      randomEndHour: 12,
      randomEndMinute: 0,
    };
    const dates = createRandomReminderDates(
      range,
      3,
      new Date(2026, 6, 26, 10, 30, 0),
      () => 0,
    );

    expect(dates[0]).toEqual(new Date(2026, 6, 26, 11, 0, 0));
    expect(dates).toHaveLength(58);
    expect(() =>
      createRandomReminderDates(
        { ...range, randomEndHour: 11, randomEndMinute: 59 },
        3,
      ),
    ).toThrow('minimum spacing');
  });

  test('queues one-off random reminders with stable cancellable identifiers', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 26, 8, 0, 0));
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const scheduledReminders = scheduleRandomReminders(
      {
        randomStartHour: 9,
        randomStartMinute: 0,
        randomEndHour: 11,
        randomEndMinute: 0,
      },
      2,
      () => ({
        title: 'A moment from Moodie',
        message: 'I make room for calm.',
        affirmationId: 'calm-1',
      }),
    );

    expect(mockPushNotification.cancelLocalNotification).toHaveBeenCalledTimes(
      60,
    );
    expect(
      mockPushNotification.localNotificationSchedule,
    ).toHaveBeenCalledTimes(60);
    expect(
      mockPushNotification.localNotificationSchedule,
    ).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'moodie-random-reminder-0',
        title: 'A moment from Moodie',
        message: 'I make room for calm.',
        date: new Date(2026, 6, 26, 9, 0, 0),
        userInfo: {
          affirmationId: 'calm-1',
          affirmationText: 'I make room for calm.',
        },
      }),
    );
    expect(
      mockPushNotification.localNotificationSchedule.mock.calls[0][0]
        .repeatType,
    ).toBeUndefined();
    expect(scheduledReminders[0]).toEqual({
      affirmationId: 'calm-1',
      text: 'I make room for calm.',
      deliveryAt: new Date(2026, 6, 26, 9, 0, 0).getTime(),
    });
  });

  test('cancels every random reminder slot', () => {
    cancelRandomReminders();

    expect(mockPushNotification.cancelLocalNotification).toHaveBeenCalledTimes(
      60,
    );
    expect(
      mockPushNotification.cancelLocalNotification,
    ).toHaveBeenNthCalledWith(1, 'moodie-random-reminder-0');
    expect(
      mockPushNotification.cancelLocalNotification,
    ).toHaveBeenLastCalledWith('moodie-random-reminder-59');
  });
});
