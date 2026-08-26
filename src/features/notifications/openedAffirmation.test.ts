import {
  getOpenedNotificationAffirmation,
  handleNotificationInteraction,
  subscribeToOpenedNotificationAffirmation,
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
  const unsubscribe = subscribeToOpenedNotificationAffirmation(listener);

  expect(listener).toHaveBeenCalledWith(OPENED_AFFIRMATION);
  unsubscribe();
});

test('delivers a notification opened while the app is running', () => {
  const listener = jest.fn();
  const unsubscribe = subscribeToOpenedNotificationAffirmation(listener);

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
