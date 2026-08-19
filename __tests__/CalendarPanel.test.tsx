import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import CalendarPanel, {
  getDailyBackgroundImageUri,
} from '../src/screens/CalendarPanel';
import { ThemeProvider } from '../src/theme';

const API_BACKGROUND = {
  id: 'api-background',
  imageUri:
    'https://project.supabase.co/storage/v1/object/sign/gallery/image.webp',
  tags: ['calm'],
};

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
        <CalendarPanel backgrounds={[API_BACKGROUND]} />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findByProps({ testID: 'screen-calendar' }),
  ).toBeTruthy();
  expect(
    renderer!.root.findByProps({ testID: 'image-calendar-background' }).props
      .source,
  ).toEqual({ uri: API_BACKGROUND.imageUri });
  expect(
    renderer!.root.findByProps({ testID: 'text-calendar-date' }).props
      .accessibilityLabel,
  ).toBe(expectedDate);
  expect(
    renderer!.root.findByProps({ testID: 'text-calendar-message' }),
  ).toBeTruthy();
});

test('does not render a hardcoded image when API content is unavailable', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <CalendarPanel backgrounds={[]} />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findAllByProps({ testID: 'image-calendar-background' }),
  ).toHaveLength(0);
});

test('selects the daily image only from supplied API backgrounds', () => {
  const backgrounds = [
    API_BACKGROUND,
    { ...API_BACKGROUND, id: 'second', imageUri: 'api://second' },
  ];
  const selectedUris = [
    getDailyBackgroundImageUri(backgrounds, new Date(2026, 0, 1)),
    getDailyBackgroundImageUri(backgrounds, new Date(2026, 0, 2)),
  ];

  expect(new Set(selectedUris)).toEqual(
    new Set(backgrounds.map(background => background.imageUri)),
  );
  expect(getDailyBackgroundImageUri([], new Date(2026, 0, 1))).toBeNull();
});
