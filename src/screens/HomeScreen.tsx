import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import {
  buildAffirmationLikeKey,
  DEFAULT_AFFIRMATION_BACKGROUND_PREFERENCE,
  DEFAULT_SELECTED_AFFIRMATION_TOPICS,
  loadAffirmationBackgroundPreference,
  loadLikedAffirmationKeys,
  loadSelectedAffirmationTopics,
  saveAffirmationBackgroundPreference,
  saveSelectedAffirmationTopics,
  toggleLikedAffirmationKey,
} from '../features/affirmations/storage';
import {
  AffirmationBackgroundPreference,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { useHomeScreenStyles } from './HomeScreen.styles';
import SettingsPanel from './SettingsPanel';
import AffirmationPanel from './AffirmationPanel';
import CalendarPanel from './CalendarPanel';
import HomeFooter from './HomeFooter';
import { getHomePageIndex, HOME_PAGE_COUNT } from './homePager';

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
}

const HomeScreen: React.FC = () => {
  const styles = useHomeScreenStyles();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [pagerWidth, setPagerWidth] = useState(windowWidth);
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
  const [selectedTopicIds, setSelectedTopicIds] = useState<
    AffirmationTopicId[]
  >(DEFAULT_SELECTED_AFFIRMATION_TOPICS);
  const [backgroundPreference, setBackgroundPreference] =
    useState<AffirmationBackgroundPreference>(
      DEFAULT_AFFIRMATION_BACKGROUND_PREFERENCE,
    );
  const [likedAffirmationKeys, setLikedAffirmationKeys] = useState<string[]>(
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        configureNotificationChannel();
        const [
          storedPreferences,
          storedTopicIds,
          storedBackgroundPreference,
          storedLikedAffirmationKeys,
        ] = await Promise.all([
          loadReminderPreferences(),
          loadSelectedAffirmationTopics(),
          loadAffirmationBackgroundPreference(),
          loadLikedAffirmationKeys(),
        ]);

        if (!isMounted) {
          return;
        }

        setPreferences(storedPreferences);
        setSelectedTopicIds(storedTopicIds);
        setBackgroundPreference(storedBackgroundPreference);
        setLikedAffirmationKeys(storedLikedAffirmationKeys);
        setHourInput(storedPreferences.hour.toString());
        setMinuteInput(storedPreferences.minute.toString());

        if (storedPreferences.enabled) {
          scheduleDailyReminder(
            storedPreferences.hour,
            storedPreferences.minute,
          );
        }
      } catch {
        if (isMounted) {
          setStatusMessage('Could not load app settings.');
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
    (offsetX: number, viewportWidth: number) => {
      if (viewportWidth <= 0) {
        return;
      }

      const nextPage = getHomePageIndex(offsetX, viewportWidth);
      setActivePage(currentPage =>
        currentPage === nextPage ? currentPage : nextPage,
      );
    },
    [],
  );

  const handlePagerLayout = useCallback(
    (nextWidth: number) => {
      if (nextWidth <= 0 || Math.abs(nextWidth - pagerWidth) < 1) {
        return;
      }

      setPagerWidth(nextWidth);
      scrollViewRef.current?.scrollTo({
        x: activePage * nextWidth,
        y: 0,
        animated: false,
      });
    },
    [activePage, pagerWidth],
  );

  const handlePageSelect = useCallback(
    (page: number) => {
      const nextPage = Math.min(HOME_PAGE_COUNT - 1, Math.max(0, page));

      setActivePage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * pagerWidth,
        y: 0,
        animated: true,
      });
    },
    [pagerWidth],
  );

  const handleTopicSelect = useCallback(
    async (topicIds: AffirmationTopicId[]) => {
      const previousTopicIds = selectedTopicIds;
      setStatusMessage(null);
      setSelectedTopicIds(topicIds);

      try {
        await saveSelectedAffirmationTopics(topicIds);
      } catch {
        setSelectedTopicIds(previousTopicIds);
        setStatusMessage('Failed to save selected topic.');
      }
    },
    [selectedTopicIds],
  );

  const handleBackgroundPreferenceChange = useCallback(
    async (nextPreference: AffirmationBackgroundPreference) => {
      const previousPreference = backgroundPreference;
      setStatusMessage(null);
      setBackgroundPreference(nextPreference);

      try {
        await saveAffirmationBackgroundPreference(nextPreference);
      } catch {
        setBackgroundPreference(previousPreference);
        setStatusMessage('Failed to save background preference.');
      }
    },
    [backgroundPreference],
  );

  const handleToggleAffirmationLike = useCallback(
    async (topicId: AffirmationTopicId, affirmationText: string) => {
      const likeKey = buildAffirmationLikeKey(topicId, affirmationText);
      const previousLikeKeys = likedAffirmationKeys;
      const nextLikeKeys = previousLikeKeys.includes(likeKey)
        ? previousLikeKeys.filter(key => key !== likeKey)
        : [...previousLikeKeys, likeKey];
      setStatusMessage(null);
      setLikedAffirmationKeys(nextLikeKeys);

      try {
        await toggleLikedAffirmationKey(likeKey);
      } catch {
        setLikedAffirmationKeys(previousLikeKeys);
        setStatusMessage('Failed to save liked affirmation.');
      }
    },
    [likedAffirmationKeys],
  );

  return (
    <SafeAreaView style={styles.container} testID="screen-home">
      <ScrollView
        ref={scrollViewRef}
        style={styles.pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onLayout={event => {
          handlePagerLayout(event.nativeEvent.layout.width);
        }}
        onScroll={event => {
          handlePageChange(
            event.nativeEvent.contentOffset.x,
            event.nativeEvent.layoutMeasurement.width,
          );
        }}
        onScrollEndDrag={event => {
          handlePageChange(
            event.nativeEvent.contentOffset.x,
            event.nativeEvent.layoutMeasurement.width,
          );
        }}
        onMomentumScrollEnd={event => {
          handlePageChange(
            event.nativeEvent.contentOffset.x,
            event.nativeEvent.layoutMeasurement.width,
          );
        }}
        scrollEventThrottle={16}
        testID="pager-home"
      >
        <View
          style={[styles.page, styles.affirmationPage, { width: pagerWidth }]}
        >
          <AffirmationPanel
            selectedTopicIds={selectedTopicIds}
            onSelectTopics={handleTopicSelect}
            backgroundPreference={backgroundPreference}
            onBackgroundPreferenceChange={handleBackgroundPreferenceChange}
            likedAffirmationKeys={likedAffirmationKeys}
            onToggleAffirmationLike={handleToggleAffirmationLike}
          />
        </View>
        <View style={[styles.page, styles.calendarPage, { width: pagerWidth }]}>
          <CalendarPanel />
        </View>
        <View style={[styles.page, { width: pagerWidth }]}>
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
      <HomeFooter activePage={activePage} onSelectPage={handlePageSelect} />
    </SafeAreaView>
  );
};

export default HomeScreen;
