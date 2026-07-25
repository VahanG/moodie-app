import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SettingsPanel from '../src/screens/SettingsPanel';
import { ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

test('nests account controls inside the existing Settings panel', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <SettingsPanel
          isLoading={false}
          isSaving={false}
          preferences={{ enabled: false, hour: 9, minute: 0 }}
          hourInput="9"
          minuteInput="0"
          setHourInput={jest.fn()}
          setMinuteInput={jest.fn()}
          onToggle={jest.fn(async () => undefined)}
          onSaveTime={jest.fn(async () => undefined)}
          statusMessage={null}
          reminderTimeText="09:00"
        />
      </ThemeProvider>,
    );
  });

  const settings = renderer!.root.findByProps({ testID: 'screen-settings' });

  expect(settings.findByProps({ testID: 'section-appearance' })).toBeTruthy();
  expect(settings.findByProps({ testID: 'section-account' })).toBeTruthy();
});
