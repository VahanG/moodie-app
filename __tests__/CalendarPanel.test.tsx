import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import CalendarPanel from '../src/screens/CalendarPanel';
import { ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

test('renders the current local date and daily reflection', async () => {
  const today = new Date();
  const expectedDate = `${today.toLocaleString('en-US', {
    weekday: 'long',
  })}, ${today.toLocaleString('en-US', {
    month: 'short',
  })} ${today.getDate().toString().padStart(2, '0')}, ${today.getFullYear()}`;
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <CalendarPanel />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findByProps({ testID: 'screen-calendar' }),
  ).toBeTruthy();
  expect(
    renderer!.root.findByProps({ testID: 'image-calendar-background' }),
  ).toBeTruthy();
  expect(
    renderer!.root.findByProps({ testID: 'text-calendar-date' }).props
      .accessibilityLabel,
  ).toBe(expectedDate);
  expect(
    renderer!.root.findByProps({ testID: 'text-calendar-message' }),
  ).toBeTruthy();
});
