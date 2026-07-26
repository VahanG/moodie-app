import React from 'react';
import { ActivityIndicator, Switch, View } from 'react-native';
import { useHomeScreenStyles } from './HomeScreen.styles';
import { ReminderPreferences } from '../features/notifications/types';
import AccountSection from './AccountSection';
import AppearanceSection from './AppearanceSection';
import { useTheme } from '../theme';
import {
  AppButton,
  AppText,
  AppTextField,
  Card,
  Screen,
  SettingsRow,
} from '../components/ui';

type Props = {
  isLoading: boolean;
  isSaving: boolean;
  preferences: ReminderPreferences;
  hourInput: string;
  minuteInput: string;
  setHourInput: (value: string) => void;
  setMinuteInput: (value: string) => void;
  onToggle: (nextEnabled: boolean) => Promise<void>;
  onSaveTime: () => Promise<void>;
  statusMessage: string | null;
  reminderTimeText: string;
};

const SettingsPanel: React.FC<Props> = ({
  isLoading,
  isSaving,
  preferences,
  hourInput,
  minuteInput,
  setHourInput,
  setMinuteInput,
  onToggle,
  onSaveTime,
  statusMessage,
  reminderTimeText,
}) => {
  const styles = useHomeScreenStyles();
  const { theme } = useTheme();

  return (
    <Screen
      scroll
      contentContainerStyle={styles.settingsContent}
      keyboardShouldPersistTaps="handled"
      testID="screen-settings"
    >
      <AppText variant="title">Settings</AppText>
      <AppearanceSection />
      <AccountSection />

      <Card variant="outlined">
        <AppText variant="heading">Notifications</AppText>
        <AppText tone="muted">Set up your daily Moodie reminder.</AppText>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.accent} />
            <AppText tone="muted">Loading reminder settings...</AppText>
          </View>
        ) : (
          <>
            <SettingsRow
              label="Daily reminders"
              description={`Current time: ${reminderTimeText} (local time)`}
              trailing={
                <Switch
                  accessibilityLabel="Enable daily reminders"
                  value={preferences.enabled}
                  onValueChange={value => onToggle(value)}
                  disabled={isSaving}
                  trackColor={{
                    false: theme.colors.border,
                    true: theme.colors.accent,
                  }}
                  ios_backgroundColor={theme.colors.border}
                  testID="toggle-daily-reminders"
                />
              }
            />

            <View style={styles.timeInputs}>
              <View style={styles.inputBlock}>
                <AppTextField
                  label="Hour"
                  helperText="0–23"
                  value={hourInput}
                  onChangeText={text =>
                    setHourInput(text.replace(/[^0-9]/g, ''))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  testID="input-reminder-hour"
                />
              </View>
              <View style={styles.inputBlock}>
                <AppTextField
                  label="Minute"
                  helperText="0–59"
                  value={minuteInput}
                  onChangeText={text =>
                    setMinuteInput(text.replace(/[^0-9]/g, ''))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  testID="input-reminder-minute"
                />
              </View>
            </View>

            <AppButton
              label={isSaving ? 'Saving...' : 'Save reminder time'}
              loading={isSaving}
              onPress={onSaveTime}
              testID="btn-save-reminder-time"
            />
          </>
        )}

        {statusMessage ? (
          <AppText
            accessibilityLiveRegion="polite"
            tone="accent"
            testID="text-reminder-status"
          >
            {statusMessage}
          </AppText>
        ) : null}
      </Card>
    </Screen>
  );
};

export default SettingsPanel;
