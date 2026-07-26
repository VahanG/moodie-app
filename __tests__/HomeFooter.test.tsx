import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import HomeFooter from '../src/screens/HomeFooter';
import { ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

test('renders accessible tabs and selects a requested page', async () => {
  const onSelectPage = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <HomeFooter activePage={1} onSelectPage={onSelectPage} />
      </ThemeProvider>,
    );
  });

  expect(
    renderer!.root.findByProps({ testID: 'btn-nav-calendar' }).props
      .accessibilityState,
  ).toMatchObject({ selected: true });

  renderer!.root.findByProps({ testID: 'btn-nav-settings' }).props.onPress();

  expect(onSelectPage).toHaveBeenCalledWith(2);
});
