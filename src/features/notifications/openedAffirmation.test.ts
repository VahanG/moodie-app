import { Linking } from 'react-native';
import {
  getOpenedAffirmationFromUrl,
  getOpenedNotificationAffirmation,
  handleNotificationInteraction,
  subscribeToOpenedAffirmation,
  subscribeToOpenedAffirmationLinks,
} from './openedAffirmation';

const OPENED_AFFIRMATION = {
  id: 'growth-1',
  text: 'I welcome today with calm and confidence.',
};

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

test('delivers cold-start and foreground widget links', async () => {
  const initialAffirmation = {
    id: 'calm-1',
    text: 'I return to calm.',
  };
  const foregroundAffirmation = {
    id: 'growth-1',
    text: 'I welcome growth.',
  };
  let urlListener: ((event: { url: string }) => void) | undefined;
  const remove = jest.fn();
  const getInitialUrlSpy = jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(
      `moodie-app://affirmations?affirmationId=${initialAffirmation.id}&affirmationText=${encodeURIComponent(
        initialAffirmation.text,
      )}`,
    );
  const addEventListenerSpy = jest
    .spyOn(Linking, 'addEventListener')
    .mockImplementation((_type, listener) => {
      urlListener = listener;
      return { remove } as unknown as ReturnType<
        typeof Linking.addEventListener
      >;
    });
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedAffirmation(listener);
  const unsubscribeLinks = subscribeToOpenedAffirmationLinks();

  await Promise.resolve();
  urlListener?.({
    url: `moodie-app://affirmations?affirmationId=${foregroundAffirmation.id}&affirmationText=${encodeURIComponent(
      foregroundAffirmation.text,
    )}`,
  });

  expect(listener).toHaveBeenNthCalledWith(1, initialAffirmation);
  expect(listener).toHaveBeenNthCalledWith(2, foregroundAffirmation);

  unsubscribeLinks();
  unsubscribe();
  expect(remove).toHaveBeenCalledTimes(1);
  getInitialUrlSpy.mockRestore();
  addEventListenerSpy.mockRestore();
});
