import React from 'react';
import { Pressable, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider, useTheme } from '../src/theme';
import { THEME_PREFERENCE_STORAGE_KEY } from '../src/theme/storage';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (key: string) => mockGetItem(key),
  setItem: (key: string, value: string) => mockSetItem(key, value),
}));

const ThemeProbe: React.FC = () => {
  const { preference, resolvedMode, setPreference } = useTheme();

  return (
    <>
      <Text testID="preference">{preference}</Text>
      <Text testID="resolved-mode">{resolvedMode}</Text>
      <Pressable testID="select-dark" onPress={() => setPreference('dark')} />
    </>
  );
};

async function renderThemeProbe() {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );
  });

  return renderer!;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
  });

  test('restores a saved appearance preference', async () => {
    mockGetItem.mockResolvedValue('dark');

    const renderer = await renderThemeProbe();

    expect(mockGetItem).toHaveBeenCalledWith(THEME_PREFERENCE_STORAGE_KEY);
    expect(
      renderer.root.findByProps({ testID: 'preference' }).props.children,
    ).toBe('dark');
    expect(
      renderer.root.findByProps({ testID: 'resolved-mode' }).props.children,
    ).toBe('dark');
  });

  test('updates immediately and persists an explicit preference', async () => {
    const renderer = await renderThemeProbe();

    await ReactTestRenderer.act(async () => {
      await renderer.root
        .findByProps({ testID: 'select-dark' })
        .props.onPress();
    });

    expect(mockSetItem).toHaveBeenCalledWith(
      THEME_PREFERENCE_STORAGE_KEY,
      'dark',
    );
    expect(
      renderer.root.findByProps({ testID: 'preference' }).props.children,
    ).toBe('dark');
    expect(
      renderer.root.findByProps({ testID: 'resolved-mode' }).props.children,
    ).toBe('dark');
  });

  test('falls back to System for an invalid stored value', async () => {
    mockGetItem.mockResolvedValue('sepia');

    const renderer = await renderThemeProbe();

    expect(
      renderer.root.findByProps({ testID: 'preference' }).props.children,
    ).toBe('system');
  });
});
