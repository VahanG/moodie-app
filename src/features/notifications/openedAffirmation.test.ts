import * as Linking from 'expo-linking';
import { AppState, type AppStateStatus } from 'react-native';
import {
  getOpenedAffirmationFromUrl,
  getOpenedNotificationAffirmation,
  handleNotificationInteraction,
  subscribeToOpenedAffirmation,
  subscribeToOpenedAffirmationLinks,
} from './openedAffirmation';
import { loadPublishedWidgetAffirmation } from '../widgets/service';
import { consumeNativeOpenedNotification } from './bridge';

jest.mock('expo-linking', () => ({
  clearInitialURL: jest.fn(),
  getLinkingURL: jest.fn(),
}));
jest.mock('../widgets/service', () => ({
  loadPublishedWidgetAffirmation: jest.fn(),
}));
jest.mock('./bridge', () => ({
  consumeNativeOpenedNotification: jest.fn(),
}));

const mockClearInitialURL = Linking.clearInitialURL as jest.MockedFunction<
  typeof Linking.clearInitialURL
>;
const mockGetLinkingURL = Linking.getLinkingURL as jest.MockedFunction<
  typeof Linking.getLinkingURL
>;
const mockLoadPublishedWidgetAffirmation =
  loadPublishedWidgetAffirmation as jest.MockedFunction<
    typeof loadPublishedWidgetAffirmation
  >;
const mockConsumeNativeOpenedNotification =
  consumeNativeOpenedNotification as jest.MockedFunction<
    typeof consumeNativeOpenedNotification
  >;

const OPENED_AFFIRMATION = {
  id: 'growth-1',
  text: 'I welcome today with calm and confidence.',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetLinkingURL.mockReturnValue(null);
  mockLoadPublishedWidgetAffirmation.mockResolvedValue(null);
  mockConsumeNativeOpenedNotification.mockResolvedValue(null);
});

test('extracts affirmation data only from an opened notification', () => {
  expect(
    getOpenedNotificationAffirmation({
      userInteraction: true,
      data: {
        affirmationId: OPENED_AFFIRMATION.id,
        affirmationText: OPENED_AFFIRMATION.text,
      },
    }),
  ).toEqual(OPENED_AFFIRMATION);

  expect(
    getOpenedNotificationAffirmation({
      userInteraction: false,
      data: {
        affirmationId: OPENED_AFFIRMATION.id,
        affirmationText: OPENED_AFFIRMATION.text,
      },
    }),
  ).toBeNull();
});

test('delivers a cold-start notification after the app subscribes', () => {
  handleNotificationInteraction({
    userInteraction: true,
    data: JSON.stringify({
      affirmationId: OPENED_AFFIRMATION.id,
      affirmationText: OPENED_AFFIRMATION.text,
    }),
  });
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedAffirmation(listener);

  expect(listener).toHaveBeenCalledWith(OPENED_AFFIRMATION);
  unsubscribe();
});

test('delivers a notification opened while the app is running', () => {
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedAffirmation(listener);

  handleNotificationInteraction({
    userInteraction: true,
    userInfo: {
      affirmationId: OPENED_AFFIRMATION.id,
      affirmationText: OPENED_AFFIRMATION.text,
    },
  });

  expect(listener).toHaveBeenCalledWith(OPENED_AFFIRMATION);
  unsubscribe();
});

test('extracts the exact affirmation from a widget deep link', () => {
  const text = 'Ես հանգիստ եմ & վստահ։';
  const url = `moodie-app://affirmations?affirmationId=calm-1&affirmationText=${encodeURIComponent(
    text,
  )}`;

  expect(getOpenedAffirmationFromUrl(url)).toEqual({ id: 'calm-1', text });
  expect(getOpenedAffirmationFromUrl('moodie-app://auth/callback')).toBeNull();
  expect(getOpenedAffirmationFromUrl('moodie-app://affirmations')).toBeNull();
});

test('delivers and consumes cold-start and repeated foreground widget links', async () => {
  const initialAffirmation = {
    id: 'calm-1',
    text: 'I return to calm.',
  };
  const foregroundAffirmation = {
    id: 'growth-1',
    text: 'I welcome growth.',
  };
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  const remove = jest.fn();
  const initialUrl = `moodie-app://affirmations?affirmationId=${initialAffirmation.id}&affirmationText=${encodeURIComponent(
    initialAffirmation.text,
  )}`;
  const foregroundUrl = `moodie-app://affirmations?affirmationId=${foregroundAffirmation.id}&affirmationText=${encodeURIComponent(
    foregroundAffirmation.text,
  )}`;
  mockGetLinkingURL.mockReturnValue(initialUrl);
  const appStateListenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_type, listener) => {
      appStateListener = listener;
      return { remove } as unknown as ReturnType<
        typeof AppState.addEventListener
      >;
    });
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedAffirmation(listener);
  const unsubscribeLinks = subscribeToOpenedAffirmationLinks();
  await Promise.resolve();

  mockGetLinkingURL.mockReturnValue(foregroundUrl);
  appStateListener?.('active');
  await Promise.resolve();
  appStateListener?.('background');
  appStateListener?.('active');
  await Promise.resolve();

  expect(listener).toHaveBeenNthCalledWith(1, initialAffirmation);
  expect(listener).toHaveBeenNthCalledWith(2, foregroundAffirmation);
  expect(listener).toHaveBeenNthCalledWith(3, foregroundAffirmation);
  expect(mockClearInitialURL).toHaveBeenCalledTimes(3);

  unsubscribeLinks();
  unsubscribe();
  expect(remove).toHaveBeenCalledTimes(1);
  appStateListenerSpy.mockRestore();
});

test('falls back to the published widget state for a legacy widget URL', async () => {
  const widgetAffirmation = { id: 'legacy-1', text: 'I am here now.' };
  mockGetLinkingURL.mockReturnValue('moodie-app://affirmations');
  mockLoadPublishedWidgetAffirmation.mockResolvedValue(widgetAffirmation);
  const appStateListenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as unknown as ReturnType<
      typeof AppState.addEventListener
    >);
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedAffirmation(listener);
  const unsubscribeLinks = subscribeToOpenedAffirmationLinks();

  await Promise.resolve();
  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith(widgetAffirmation);
  expect(mockClearInitialURL).toHaveBeenCalledTimes(1);

  unsubscribeLinks();
  unsubscribe();
  appStateListenerSpy.mockRestore();
});

test('delivers a notification persisted by the native cold-start handoff', async () => {
  jest.useFakeTimers();
  const nativeAffirmation = {
    id: 'native-notification-1',
    text: 'This notification reached the app.',
  };
  mockConsumeNativeOpenedNotification.mockResolvedValueOnce(nativeAffirmation);
  const appStateListenerSpy = jest
    .spyOn(AppState, 'addEventListener')
    .mockReturnValue({ remove: jest.fn() } as unknown as ReturnType<
      typeof AppState.addEventListener
    >);
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedAffirmation(listener);
  const unsubscribeEntryPoints = subscribeToOpenedAffirmationLinks();

  await Promise.resolve();

  expect(listener).toHaveBeenCalledWith(nativeAffirmation);

  unsubscribeEntryPoints();
  unsubscribe();
  appStateListenerSpy.mockRestore();
  jest.useRealTimers();
});
