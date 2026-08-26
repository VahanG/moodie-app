import React from 'react';
import { StyleSheet } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import HomeFooter from '../src/screens/HomeFooter';
import { ThemeProvider } from '../src/theme';
import { AppText } from '../src/components/ui';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

test('hides Calendar and selects the visible Settings page', async () => {
  const onSelectPage = jest.fn();
  const onOpenTopicSelection = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <HomeFooter
          activePage={0}
          onOpenTopicSelection={onOpenTopicSelection}
          onSelectPage={onSelectPage}
        />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findAllByProps({ testID: 'btn-nav-calendar' }),
  ).toHaveLength(0);

  renderer!.root.findByProps({ testID: 'btn-nav-settings' }).props.onPress();

  expect(onSelectPage).toHaveBeenCalledWith(1);

  renderer!.root.findByProps({ testID: 'btn-nav-affirmations' }).props.onPress();

  expect(onOpenTopicSelection).toHaveBeenCalledTimes(1);
  expect(onSelectPage).not.toHaveBeenCalledWith(0);
});

test('renders mobile image navigation as surface-free icons', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <HomeFooter
          activePage={0}
          onOpenTopicSelection={jest.fn()}
          onSelectPage={jest.fn()}
          variant="onImage"
        />
      </ThemeProvider>,
    );
  });

  expect(
    StyleSheet.flatten(
      renderer!.root.findAllByProps({ testID: 'navigation-home' }).at(-1)!.props
        .style,
    ),
  ).toMatchObject({ backgroundColor: 'transparent', borderWidth: 0 });
  expect(renderer!.root.findAllByType(AppText)).toHaveLength(0);
});
