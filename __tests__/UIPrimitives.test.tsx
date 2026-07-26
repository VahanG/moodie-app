import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  AppButton,
  AppTextField,
  ModalSheet,
  SegmentedControl,
} from '../src/components/ui';
import { ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

async function renderWithTheme(element: React.ReactElement) {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>{element}</ThemeProvider>,
    );
  });

  return renderer!;
}

describe('UI primitives', () => {
  test('AppButton exposes action, loading, and disabled states', async () => {
    const onPress = jest.fn();
    const renderer = await renderWithTheme(
      <>
        <AppButton label="Continue" onPress={onPress} testID="enabled" />
        <AppButton
          disabled
          label="Disabled"
          onPress={onPress}
          testID="disabled"
        />
        <AppButton label="Saving" loading testID="loading" />
      </>,
    );

    const enabledMatches = renderer.root.findAll(
      node => node.props.testID === 'enabled',
    );
    const disabledMatches = renderer.root.findAll(
      node => node.props.testID === 'disabled',
    );
    const enabledButton = enabledMatches.find(
      (node, index) => index > 0 && typeof node.props.onPress === 'function',
    )!;
    const disabledButton = disabledMatches.find(
      (node, index) =>
        index > 0 && node.props.accessibilityState?.disabled === true,
    )!;

    enabledButton.props.onPress();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(disabledButton.props.onPress).toBeUndefined();
    const loadingState = renderer.root
      .findAll(node => node.props.testID === 'loading')
      .map(node => node.props.accessibilityState)
      .find(state => state?.busy === true);

    expect(loadingState).toMatchObject({ busy: true, disabled: true });
  });

  test('SegmentedControl reports selection with accessible radio states', async () => {
    const onChange = jest.fn();
    const renderer = await renderWithTheme(
      <SegmentedControl
        onChange={onChange}
        options={[
          { label: 'Light', value: 'light', testID: 'light' },
          { label: 'Dark', value: 'dark', testID: 'dark' },
        ]}
        value="light"
      />,
    );

    expect(
      renderer.root.findByProps({ testID: 'light' }).props.accessibilityState,
    ).toMatchObject({ checked: true });

    renderer.root.findByProps({ testID: 'dark' }).props.onPress();

    expect(onChange).toHaveBeenCalledWith('dark');
  });

  test('AppTextField connects its visible label to the native input', async () => {
    const renderer = await renderWithTheme(
      <AppTextField label="Email" testID="email" value="" />,
    );
    const input = renderer.root
      .findAllByType(TextInput)
      .find(field => field.props.testID === 'email')!;

    expect(input.props.accessibilityLabel).toBe('Email');
    expect(input.props.placeholderTextColor).toBeTruthy();
    expect(input.props.selectionColor).toBeTruthy();
  });

  test('ModalSheet exposes its standard close action', async () => {
    const onClose = jest.fn();
    const renderer = await renderWithTheme(
      <ModalSheet
        closeTestID="close-sheet"
        onClose={onClose}
        title="Choose an option"
        visible
      >
        <AppTextField label="Search" value="" />
      </ModalSheet>,
    );

    renderer.root.findByProps({ testID: 'close-sheet' }).props.onPress();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
