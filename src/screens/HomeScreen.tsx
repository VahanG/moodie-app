import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
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
import SettingsPanel from './SettingsPanel';
import AffirmationPanel from './AffirmationPanel';
import HomeFooter from './HomeFooter';

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

const HomeScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { width } = useWindowDimensions();
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
  const [activePage, setActivePage] = useState(0);

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

  const handlePageChange = useCallback(
    (offsetX: number) => {
      const nextPage = Math.round(offsetX / width);
      setActivePage(nextPage);
    },
    [width],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onMomentumScrollEnd={event => {
          handlePageChange(event.nativeEvent.contentOffset.x);
        }}
      >
        <View style={[styles.page, styles.affirmationPage, { width }]}>
          <AffirmationPanel  />
        </View>
        <View style={[styles.page, { width }]}>
          <SettingsPanel
              isLoading={isLoading}
              isSaving={isSaving}
              preferences={preferences}
              hourInput={hourInput}
              minuteInput={minuteInput}
              setHourInput={setHourInput}
              setMinuteInput={setMinuteInput}
              onToggle={handleToggle}
              onSaveTime={handleSaveTime}
              statusMessage={statusMessage}
              reminderTimeText={reminderTimeText}
          />
        </View>
      </ScrollView>
      <HomeFooter activePage={activePage} />
    </SafeAreaView>
  );
};

export default HomeScreen;
