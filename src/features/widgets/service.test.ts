import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';
import {
  AFFIRMATION_WIDGET_ROTATION_MS,
  getLatestDeliveredWidgetNotification,
  loadPublishedWidgetAffirmation,
  parseAffirmationWidgetPayload,
  publishAffirmationWidgetState,
  resolveWidgetAffirmation,
} from './service';
import type { AffirmationWidgetPayload } from './types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

const payload: AffirmationWidgetPayload = {
  version: 1,
  notificationsEnabled: false,
  affirmations: [
    { id: 'calm-1', text: 'I am calm.' },
    { id: 'growth-1', text: 'I welcome growth.' },
  ],
  scheduledNotifications: [],
  lastNotification: null,
  updatedAt: 0,
};

describe('affirmation widget state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    NativeModules.MoodieWidgetBridge = { setState: jest.fn() };
  });

  test('rotates eligible affirmations on three-hour boundaries', () => {
    expect(resolveWidgetAffirmation(payload, 0)).toEqual(
      payload.affirmations[0],
    );
    expect(
      resolveWidgetAffirmation(payload, AFFIRMATION_WIDGET_ROTATION_MS),
    ).toEqual(payload.affirmations[1]);
  });

  test('uses the latest delivered reminder while notifications are enabled', () => {
    const notificationPayload: AffirmationWidgetPayload = {
      ...payload,
      notificationsEnabled: true,
      scheduledNotifications: [
        { id: 'calm-1', text: 'Earlier', deliveryAt: 100 },
        { id: 'growth-1', text: 'Latest', deliveryAt: 200 },
        { id: 'calm-1', text: 'Future', deliveryAt: 400 },
      ],
    };

    expect(
      getLatestDeliveredWidgetNotification(notificationPayload, 300),
    ).toEqual({ id: 'growth-1', text: 'Latest', deliveryAt: 200 });
    expect(resolveWidgetAffirmation(notificationPayload, 300)?.text).toBe(
      'Latest',
    );
  });

  test('loads the affirmation represented by the last published widget state', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(payload));

    await expect(loadPublishedWidgetAffirmation(0)).resolves.toEqual(
      payload.affirmations[0],
    );
  });

  test('retains only an eligible previous notification and current schedule', async () => {
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        ...payload,
        notificationsEnabled: true,
        scheduledNotifications: [
          { id: 'calm-1', text: 'Delivered calm', deliveryAt: 100 },
        ],
      }),
    );

    const nextPayload = await publishAffirmationWidgetState({
      notificationsEnabled: true,
      affirmations: [{ id: 'growth-1', text: 'I welcome growth.' }],
      scheduledNotifications: [
        {
          affirmationId: 'growth-1',
          text: 'Future growth',
          deliveryAt: 500,
        },
        { affirmationId: 'calm-1', text: 'Wrong topic', deliveryAt: 600 },
      ],
      now: 300,
    });

    expect(nextPayload.lastNotification).toBeNull();
    expect(nextPayload.scheduledNotifications).toEqual([
      { id: 'growth-1', text: 'Future growth', deliveryAt: 500 },
    ]);
    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/affirmation-widget-state-v1',
      JSON.stringify(nextPayload),
    );
    expect(NativeModules.MoodieWidgetBridge.setState).toHaveBeenCalledWith(
      JSON.stringify(nextPayload),
    );
  });

  test('rejects malformed persisted state', () => {
    expect(parseAffirmationWidgetPayload('{')).toBeNull();
    expect(
      parseAffirmationWidgetPayload(
        JSON.stringify({ ...payload, scheduledNotifications: [{}] }),
      ),
    ).toBeNull();
  });
});
