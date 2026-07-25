/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('react-native-push-notification', () => ({
  Importance: { HIGH: 4 },
  createChannel: jest.fn(),
  requestPermissions: jest.fn(async () => ({ alert: true })),
  localNotificationSchedule: jest.fn(),
  cancelLocalNotification: jest.fn(),
}));

jest.mock('expo-navigation-bar', () => ({
  NavigationBar: () => null,
}));

test('renders correctly', async () => {
  let renderer: ReturnType<typeof ReactTestRenderer.create> | null = null;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });

  await ReactTestRenderer.act(() => {
    renderer?.unmount();
  });
});
