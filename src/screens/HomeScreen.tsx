import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  cancelDailyReminder,
  configureNotificationChannel,
  requestNotificationPermission,
  scheduleDailyReminder,
} from '../features/notifications/service';
import {
  DEFAULT_REMINDER_PREFERENCES,
  loadReminderPreferences,
  saveReminderPreferences,
} from '../features/notifications/storage';
import { ReminderPreferences } from '../features/notifications/types';
import styles from './HomeScreen.styles';

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

type AffirmationCard = {
  imageUri: string;
  text: string;
};

const AFFIRMATION_ROTATION_INTERVAL_MS = 7000;
const AFFIRMATION_CARDS: AffirmationCard[] = [
  {
    imageUri:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    text: 'You are growing every day.',
  },
  {
    imageUri:
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80',
    text: 'Small steps create big change.',
  },
  {
    imageUri:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    text: 'Your calm is your strength.',
  },
];

const HomeScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<ReminderPreferences>(
    DEFAULT_REMINDER_PREFERENCES,
  );
  const [hourInput, setHourInput] = useState(
    DEFAULT_REMINDER_PREFERENCES.hour.toString(),
  );
  const [minuteInput, setMinuteInput] = useState(
    DEFAULT_REMINDER_PREFERENCES.minute.toString(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [affirmationIndex, setAffirmationIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        configureNotificationChannel();
        const storedPreferences = await loadReminderPreferences();

        if (!isMounted) {
          return;
        }

        setPreferences(storedPreferences);
        setHourInput(storedPreferences.hour.toString());
        setMinuteInput(storedPreferences.minute.toString());

        if (storedPreferences.enabled) {
          scheduleDailyReminder(storedPreferences.hour, storedPreferences.minute);
        }
      } catch {
        if (isMounted) {
          setStatusMessage('Could not load reminder settings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (AFFIRMATION_CARDS.length <= 1) {
      return;
    }

    const intervalId = setInterval(() => {
      setAffirmationIndex(current => (current + 1) % AFFIRMATION_CARDS.length);
    }, AFFIRMATION_ROTATION_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const activeAffirmation = AFFIRMATION_CARDS[affirmationIndex] ?? AFFIRMATION_CARDS[0];

  const reminderTimeText = useMemo(
    () => formatTime(preferences.hour, preferences.minute),
    [preferences.hour, preferences.minute],
  );

  const persistPreferences = useCallback(async (next: ReminderPreferences) => {
    setIsSaving(true);

    try {
      await saveReminderPreferences(next);
      setPreferences(next);
      return true;
    } catch {
      setStatusMessage('Failed to save reminder settings.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleToggle = useCallback(
    async (nextEnabled: boolean) => {
      try {
        setStatusMessage(null);

        if (!nextEnabled) {
          const nextPreferences = { ...preferences, enabled: false };
          const persisted = await persistPreferences(nextPreferences);
          if (persisted) {
            cancelDailyReminder();
            setStatusMessage('Daily reminders are off.');
          }
          return;
        }

        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          setStatusMessage(
            'Notification permission is required to enable daily reminders.',
          );
          return;
        }

        const nextPreferences = { ...preferences, enabled: true };
        const persisted = await persistPreferences(nextPreferences);
        if (persisted) {
          scheduleDailyReminder(nextPreferences.hour, nextPreferences.minute);
          setStatusMessage(
            `Daily reminder enabled for ${formatTime(
              nextPreferences.hour,
              nextPreferences.minute,
            )}.`,
          );
        }
      } catch {
        setStatusMessage('Failed to update daily reminder status.');
      }
    },
    [persistPreferences, preferences],
  );

  const handleSaveTime = useCallback(async () => {
    try {
      setStatusMessage(null);

      const parsedHour = Number(hourInput);
      const parsedMinute = Number(minuteInput);

      const hasValidHour =
        Number.isInteger(parsedHour) && parsedHour >= 0 && parsedHour <= 23;
      const hasValidMinute =
        Number.isInteger(parsedMinute) &&
        parsedMinute >= 0 &&
        parsedMinute <= 59;

      if (!hasValidHour || !hasValidMinute) {
        setStatusMessage('Use a valid 24-hour time (HH:MM).');
        return;
      }

      const nextPreferences = {
        ...preferences,
        hour: parsedHour,
        minute: parsedMinute,
      };
      const persisted = await persistPreferences(nextPreferences);

      if (!persisted) {
        return;
      }

      if (nextPreferences.enabled) {
        scheduleDailyReminder(nextPreferences.hour, nextPreferences.minute);
        setStatusMessage(
          `Reminder time updated to ${formatTime(
            nextPreferences.hour,
            nextPreferences.minute,
          )}.`,
        );
        return;
      }

      setStatusMessage(
        `Saved reminder time ${formatTime(
          nextPreferences.hour,
          nextPreferences.minute,
        )}. Turn reminders on to start notifications.`,
      );
    } catch {
      setStatusMessage('Failed to update reminder time.');
    }
  }, [hourInput, minuteInput, persistPreferences, preferences]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Loading reminder settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.affirmationCard}>
          <Image
            source={{ uri: activeAffirmation.imageUri }}
            style={styles.affirmationImage}
            resizeMode="cover"
          />
          <Text style={styles.affirmationText}>{activeAffirmation.text}</Text>
        </View>

        <Text style={styles.title}>Daily reminder</Text>
        <Text style={styles.subtitle}>
          Get a daily notification to check the Moodie app.
        </Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Enable daily reminders</Text>
            <Text style={styles.value}>
              Current time: {reminderTimeText} (local time)
            </Text>
          </View>
            <Switch
              value={preferences.enabled}
              onValueChange={value => {
                handleToggle(value);
              }}
              disabled={isSaving}
            />
        </View>

        <View style={styles.timeInputs}>
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Hour (0-23)</Text>
            <TextInput
              value={hourInput}
              onChangeText={text => {
                setHourInput(text.replace(/[^0-9]/g, ''));
              }}
              keyboardType="number-pad"
              style={styles.input}
              maxLength={2}
            />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Minute (0-59)</Text>
            <TextInput
              value={minuteInput}
              onChangeText={text => {
                setMinuteInput(text.replace(/[^0-9]/g, ''));
              }}
              keyboardType="number-pad"
              style={styles.input}
              maxLength={2}
            />
          </View>
        </View>

        <Button
          title={isSaving ? 'Saving...' : 'Save reminder time'}
          onPress={() => {
            handleSaveTime();
          }}
          disabled={isSaving}
        />

        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
