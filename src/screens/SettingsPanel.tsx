import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Switch, View } from 'react-native';
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
  SettingsSectionHeader,
} from '../components/ui';
import { useSettingsPanelStyles } from './SettingsPanel.styles';

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
  const styles = useSettingsPanelStyles();
  const { theme } = useTheme();

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID="screen-settings"
    >
      <View style={styles.pageHeader}>
        <AppText variant="title">Settings</AppText>
        <AppText tone="muted">Personalize your experience and account.</AppText>
      </View>
      <AppearanceSection />

      <Card
        style={styles.card}
        variant="elevated"
        testID="section-notifications"
      >
        <SettingsSectionHeader
          description="Choose when Moodie gently checks in."
          icon={
            <Ionicons
              color={theme.colors.accent}
              name="notifications-outline"
              size={22}
            />
          }
          title="Notifications"
        />

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
              style={styles.reminderRow}
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
          <View style={styles.statusBanner}>
            <Ionicons
              color={theme.colors.accent}
              name="information-circle-outline"
              size={20}
            />
            <AppText
              accessibilityLiveRegion="polite"
              style={styles.statusMessage}
              tone="accent"
              testID="text-reminder-status"
            >
              {statusMessage}
            </AppText>
          </View>
        ) : null}
      </Card>

      <AccountSection />
    </Screen>
  );
};

export default SettingsPanel;
