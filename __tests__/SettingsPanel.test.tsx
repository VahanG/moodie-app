import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import SettingsPanel from '../src/screens/SettingsPanel';
import { ThemeProvider } from '../src/theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

test('renders the modern Settings section hierarchy', async () => {
  const onClose = jest.fn();
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <ThemeProvider>
        <SettingsPanel
          isLoading={false}
          isSaving={false}
          preferences={{
            enabled: false,
            hour: 9,
            minute: 0,
            randomEnabled: false,
            randomStartHour: 9,
            randomStartMinute: 0,
            randomEndHour: 17,
            randomEndMinute: 0,
          }}
          hourInput="9"
          minuteInput="0"
          setHourInput={jest.fn()}
          setMinuteInput={jest.fn()}
          randomStartHourInput="9"
          randomStartMinuteInput="0"
          randomEndHourInput="17"
          randomEndMinuteInput="0"
          setRandomStartHourInput={jest.fn()}
          setRandomStartMinuteInput={jest.fn()}
          setRandomEndHourInput={jest.fn()}
          setRandomEndMinuteInput={jest.fn()}
          onToggle={jest.fn(async () => undefined)}
          onSaveTime={jest.fn(async () => undefined)}
          onRandomToggle={jest.fn(async () => undefined)}
          onSaveRandomRange={jest.fn(async () => undefined)}
          onClose={onClose}
          statusMessage={null}
          reminderTimeText="09:00"
          randomReminderStartTimeText="09:00"
          randomReminderEndTimeText="17:00"
          randomRemindersPerDay={3}
        />
      </ThemeProvider>,
    );
  });

  const settings = renderer!.root.findByProps({ testID: 'screen-settings' });

  expect(settings.findByProps({ testID: 'section-appearance' })).toBeTruthy();
  expect(
    settings.findByProps({ testID: 'section-notifications' }),
  ).toBeTruthy();
  expect(
    settings.findByProps({ testID: 'toggle-random-reminders' }),
  ).toBeTruthy();
  expect(settings.findByProps({ testID: 'section-account' })).toBeTruthy();

  settings.findByProps({ testID: 'btn-close-settings' }).props.onPress();
  expect(onClose).toHaveBeenCalledTimes(1);
});
