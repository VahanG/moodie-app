import React from 'react';
import {
  ActivityIndicator,
  Button,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import styles from './HomeScreen.styles';
import { ReminderPreferences } from '../features/notifications/types';

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
  return (
    <View style={styles.settingsContent}>
      <Text style={styles.title}>Notification setup</Text>
      <Text style={styles.subtitle}>Set up your daily Moodie reminder.</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading reminder settings...</Text>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Enable daily reminders</Text>
              <Text style={styles.value}>Current time: {reminderTimeText} (local time)</Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={value => onToggle(value)}
              disabled={isSaving}
            />
          </View>

          <View style={styles.timeInputs}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Hour (0-23)</Text>
              <TextInput
                value={hourInput}
                onChangeText={text => setHourInput(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={styles.input}
                maxLength={2}
              />
            </View>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Minute (0-59)</Text>
              <TextInput
                value={minuteInput}
                onChangeText={text => setMinuteInput(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={styles.input}
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
          />
        </>
      )}

      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
    </View>
  );
};

export default SettingsPanel;
