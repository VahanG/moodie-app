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
import LanguageSection from './LanguageSection';
import { useLocalization } from '../features/localization';

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
  const { t } = useLocalization();

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      testID="screen-settings"
    >
      <View style={styles.pageHeader}>
        <AppText variant="title">{t('settings.title')}</AppText>
        <AppText tone="muted">{t('settings.subtitle')}</AppText>
      </View>
      <AppearanceSection />
      <LanguageSection />

      <Card
        style={styles.card}
        variant="elevated"
        testID="section-notifications"
      >
        <SettingsSectionHeader
          description={t('notifications.description')}
          icon={
            <Ionicons
              color={theme.colors.accent}
              name="notifications-outline"
              size={22}
            />
          }
          title={t('notifications.title')}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.accent} />
            <AppText tone="muted">{t('notifications.loading')}</AppText>
          </View>
        ) : (
          <>
            <SettingsRow
              label={t('notifications.daily')}
              description={t('notifications.currentTime', {
                time: reminderTimeText,
              })}
              style={styles.reminderRow}
              trailing={
                <Switch
                  accessibilityLabel={t(
                    'notifications.enableAccessibility',
                  )}
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
                  label={t('notifications.hour')}
                  helperText={t('notifications.hourHelp')}
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
                  label={t('notifications.minute')}
                  helperText={t('notifications.minuteHelp')}
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
              label={
                isSaving
                  ? t('notifications.saving')
                  : t('notifications.saveTime')
              }
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
