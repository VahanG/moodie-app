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
  IconButton,
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
  randomStartHourInput: string;
  randomStartMinuteInput: string;
  randomEndHourInput: string;
  randomEndMinuteInput: string;
  setRandomStartHourInput: (value: string) => void;
  setRandomStartMinuteInput: (value: string) => void;
  setRandomEndHourInput: (value: string) => void;
  setRandomEndMinuteInput: (value: string) => void;
  onToggle: (nextEnabled: boolean) => Promise<void>;
  onSaveTime: () => Promise<void>;
  onRandomToggle: (nextEnabled: boolean) => Promise<void>;
  onSaveRandomRange: () => Promise<void>;
  statusMessage: string | null;
  reminderTimeText: string;
  randomReminderStartTimeText: string;
  randomReminderEndTimeText: string;
  randomRemindersPerDay: number;
  onClose: () => void;
};

const SettingsPanel: React.FC<Props> = ({
  isLoading,
  isSaving,
  preferences,
  hourInput,
  minuteInput,
  setHourInput,
  setMinuteInput,
  randomStartHourInput,
  randomStartMinuteInput,
  randomEndHourInput,
  randomEndMinuteInput,
  setRandomStartHourInput,
  setRandomStartMinuteInput,
  setRandomEndHourInput,
  setRandomEndMinuteInput,
  onToggle,
  onSaveTime,
  onRandomToggle,
  onSaveRandomRange,
  statusMessage,
  reminderTimeText,
  randomReminderStartTimeText,
  randomReminderEndTimeText,
  randomRemindersPerDay,
  onClose,
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
        <IconButton
          accessibilityLabel={t('common.closeNamed', {
            title: t('settings.title'),
          })}
          compact
          icon={<Ionicons color={theme.colors.text} name="close" size={24} />}
          onPress={onClose}
          testID="btn-close-settings"
          variant="ghost"
        />
        <View style={styles.pageHeaderText}>
          <AppText variant="title">{t('settings.title')}</AppText>
          <AppText tone="muted">{t('settings.subtitle')}</AppText>
        </View>
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
            <View style={styles.notificationMode}>
              <SettingsRow
                label={t('notifications.daily')}
                description={t('notifications.currentTime', {
                  time: reminderTimeText,
                })}
                style={styles.reminderRow}
                trailing={
                  <Switch
                    accessibilityLabel={t('notifications.enableAccessibility')}
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
            </View>

            <View style={styles.modeDivider} />

            <View style={styles.notificationMode}>
              <SettingsRow
                label={t('notifications.random')}
                description={t('notifications.randomRange', {
                  count: randomRemindersPerDay,
                  start: randomReminderStartTimeText,
                  end: randomReminderEndTimeText,
                })}
                style={styles.reminderRow}
                trailing={
                  <Switch
                    accessibilityLabel={t(
                      'notifications.enableRandomAccessibility',
                    )}
                    value={preferences.randomEnabled}
                    onValueChange={value => onRandomToggle(value)}
                    disabled={isSaving}
                    trackColor={{
                      false: theme.colors.border,
                      true: theme.colors.accent,
                    }}
                    ios_backgroundColor={theme.colors.border}
                    testID="toggle-random-reminders"
                  />
                }
              />

              <AppText tone="muted">
                {t('notifications.randomDescription')}
              </AppText>

              <View style={styles.timeInputs}>
                <View style={styles.inputBlock}>
                  <AppTextField
                    label={t('notifications.startHour')}
                    helperText={t('notifications.hourHelp')}
                    value={randomStartHourInput}
                    onChangeText={text =>
                      setRandomStartHourInput(text.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    testID="input-random-reminder-start-hour"
                  />
                </View>
                <View style={styles.inputBlock}>
                  <AppTextField
                    label={t('notifications.startMinute')}
                    helperText={t('notifications.minuteHelp')}
                    value={randomStartMinuteInput}
                    onChangeText={text =>
                      setRandomStartMinuteInput(text.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    testID="input-random-reminder-start-minute"
                  />
                </View>
              </View>

              <View style={styles.timeInputs}>
                <View style={styles.inputBlock}>
                  <AppTextField
                    label={t('notifications.endHour')}
                    helperText={t('notifications.hourHelp')}
                    value={randomEndHourInput}
                    onChangeText={text =>
                      setRandomEndHourInput(text.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    testID="input-random-reminder-end-hour"
                  />
                </View>
                <View style={styles.inputBlock}>
                  <AppTextField
                    label={t('notifications.endMinute')}
                    helperText={t('notifications.minuteHelp')}
                    value={randomEndMinuteInput}
                    onChangeText={text =>
                      setRandomEndMinuteInput(text.replace(/[^0-9]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    testID="input-random-reminder-end-minute"
                  />
                </View>
              </View>

              <AppButton
                label={
                  isSaving
                    ? t('notifications.saving')
                    : t('notifications.saveRange')
                }
                loading={isSaving}
                onPress={onSaveRandomRange}
                testID="btn-save-random-reminder-range"
              />
            </View>
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
