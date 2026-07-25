import React from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHomeScreenStyles } from './HomeScreen.styles';
import { ReminderPreferences } from '../features/notifications/types';
import AccountSection from './AccountSection';
import AppearanceSection from './AppearanceSection';
import { useTheme } from '../theme';

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
    <ScrollView
      contentContainerStyle={styles.settingsContent}
      keyboardShouldPersistTaps="handled"
      testID="screen-settings"
    >
      <Text style={styles.title}>Settings</Text>
      <AppearanceSection />
      <AccountSection />

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.subtitle}>Set up your daily Moodie reminder.</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.loadingText}>Loading reminder settings...</Text>
          </View>
        ) : (
          <>
            <View style={styles.row}>
              <View>
                <Text style={styles.label}>Enable daily reminders</Text>
                <Text style={styles.value}>
                  Current time: {reminderTimeText} (local time)
                </Text>
              </View>
              <Switch
                value={preferences.enabled}
                onValueChange={value => onToggle(value)}
                disabled={isSaving}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.accent,
                }}
                ios_backgroundColor={theme.colors.border}
              />
            </View>

            <View style={styles.timeInputs}>
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Hour (0-23)</Text>
                <TextInput
                  value={hourInput}
                  onChangeText={text =>
                    setHourInput(text.replace(/[^0-9]/g, ''))
                  }
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholderTextColor={theme.colors.placeholder}
                  selectionColor={theme.colors.accent}
                  maxLength={2}
                />
              </View>
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Minute (0-59)</Text>
                <TextInput
                  value={minuteInput}
                  onChangeText={text =>
                    setMinuteInput(text.replace(/[^0-9]/g, ''))
                  }
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholderTextColor={theme.colors.placeholder}
                  selectionColor={theme.colors.accent}
                  maxLength={2}
                />
              </View>
            </View>

            <Button
              title={isSaving ? 'Saving...' : 'Save reminder time'}
              onPress={() => {
                onSaveTime();
              }}
              disabled={isSaving}
              color={theme.colors.accent}
            />
          </>
        )}

        {statusMessage ? (
          <Text style={styles.status}>{statusMessage}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default SettingsPanel;
