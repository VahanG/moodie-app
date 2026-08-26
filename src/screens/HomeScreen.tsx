import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  cancelDailyReminder,
  cancelRandomReminders,
  configureNotificationChannel,
  getEligibleReminderAffirmations,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleRandomReminders,
  selectRandomReminderAffirmation,
} from '../features/notifications/service';
import {
  type OpenedAffirmation,
  subscribeToOpenedAffirmation,
  subscribeToOpenedAffirmationLinks,
} from '../features/notifications/openedAffirmation';
import {
  DEFAULT_REMINDER_PREFERENCES,
  loadReminderPreferences,
  saveReminderPreferences,
} from '../features/notifications/storage';
import {
  ReminderPreferences,
  ScheduledReminder,
} from '../features/notifications/types';
import {
  DEFAULT_RANDOM_REMINDER_CONFIG,
  loadRandomReminderConfig,
} from '../features/notifications/config';
import { isValidRandomReminderRange } from '../features/notifications/validation';
import {
  buildAffirmationLikeKey,
  DEFAULT_AFFIRMATION_BACKGROUND_PREFERENCE,
  DEFAULT_SELECTED_AFFIRMATION_TOPICS,
  loadAffirmationBackgroundPreference,
  loadLikedAffirmationKeys,
  loadSelectedAffirmationTopics,
  saveAffirmationBackgroundPreference,
  saveLikedAffirmationKeys,
  saveSelectedAffirmationTopics,
  toggleLikedAffirmationKey,
} from '../features/affirmations/storage';
import { loadAffirmationContent } from '../features/affirmations/content';
import {
  AffirmationContent,
  AffirmationBackgroundPreference,
  AffirmationTopicId,
  LoadedAffirmationContent,
} from '../features/affirmations/types';
import { useHomeScreenStyles } from './HomeScreen.styles';
import SettingsPanel from './SettingsPanel';
import AffirmationPanel from './AffirmationPanel';
import CalendarPanel from './CalendarPanel';
import HomeFooter from './HomeFooter';
import {
  CALENDAR_PAGE_VISIBLE,
  getHomePageIndex,
  HOME_PAGE_COUNT,
  HOME_PAGER_SWIPE_ENABLED,
} from './homePager';
import {
  subscribeToUserSettings,
  syncCurrentDeviceSettingsToDatabase,
} from '../features/user-settings';
import { useLocalization } from '../features/localization';
import {
  getAffirmationContentForLanguage,
  getAffirmationContentStatusForLanguage,
  type AffirmationContentStatus,
} from '../features/affirmations/localizedState';
import { MOBILE_LAYOUT_BREAKPOINT, useTheme } from '../theme';
import { publishAffirmationWidgetState } from '../features/widgets/service';

function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`;
}

const HomeScreen: React.FC = () => {
  const { languageCode, t } = useLocalization();
  const { theme } = useTheme();
  const styles = useHomeScreenStyles();
  const safeAreaInsets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const contentRequestIdRef = useRef(0);
  const translationRef = useRef(t);
  translationRef.current = t;
  const { width: windowWidth } = useWindowDimensions();
  const isMobileLayout = windowWidth < MOBILE_LAYOUT_BREAKPOINT;
  const mobileSecondaryPageInsets = isMobileLayout
    ? {
        paddingTop: safeAreaInsets.top,
        paddingBottom: safeAreaInsets.bottom + 72,
      }
    : undefined;
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
  const [randomStartHourInput, setRandomStartHourInput] = useState(
    DEFAULT_REMINDER_PREFERENCES.randomStartHour.toString(),
  );
  const [randomStartMinuteInput, setRandomStartMinuteInput] = useState(
    DEFAULT_REMINDER_PREFERENCES.randomStartMinute.toString(),
  );
  const [randomEndHourInput, setRandomEndHourInput] = useState(
    DEFAULT_REMINDER_PREFERENCES.randomEndHour.toString(),
  );
  const [randomEndMinuteInput, setRandomEndMinuteInput] = useState(
    DEFAULT_REMINDER_PREFERENCES.randomEndMinute.toString(),
  );
  const [randomRemindersPerDay, setRandomRemindersPerDay] = useState(
    DEFAULT_RANDOM_REMINDER_CONFIG.notificationsPerDay,
  );
  const [randomScheduleRevision, setRandomScheduleRevision] = useState(0);
  const [scheduledWidgetReminders, setScheduledWidgetReminders] = useState<
    ScheduledReminder[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [isTopicSelectionVisible, setIsTopicSelectionVisible] = useState(false);
  const [openedAffirmation, setOpenedAffirmation] =
    useState<OpenedAffirmation | null>(null);
  const statusBarStyle =
    (isMobileLayout && activePage === 0) || theme.isDark
      ? 'light-content'
      : 'dark-content';
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
  const [affirmationContent, setAffirmationContent] =
    useState<AffirmationContent>({ topics: [], backgrounds: [] });
  const [contentLanguageCode, setContentLanguageCode] = useState<string | null>(
    null,
  );
  const [contentStatus, setContentStatus] =
    useState<AffirmationContentStatus>('loading');
  const [contentStatusLanguageCode, setContentStatusLanguageCode] = useState<
    string | null
  >(null);
  const refreshAffirmationContent = useCallback(async () => {
    const requestedLanguageCode = languageCode;
    const requestId = contentRequestIdRef.current + 1;
    contentRequestIdRef.current = requestId;
    setContentStatusLanguageCode(requestedLanguageCode);
    setContentStatus('loading');

    const publishLoadedContent = (loaded: LoadedAffirmationContent) => {
      if (contentRequestIdRef.current !== requestId) {
        return;
      }
      setAffirmationContent(loaded.content);
      setContentLanguageCode(requestedLanguageCode);
      setContentStatus('ready');
    };

    try {
      const loaded = await loadAffirmationContent(
        requestedLanguageCode,
        publishLoadedContent,
      );
      publishLoadedContent(loaded);
    } catch {
      if (contentRequestIdRef.current !== requestId) {
        return;
      }
      setContentStatus('error');
    }
  }, [languageCode]);

  const visibleAffirmationContent = getAffirmationContentForLanguage(
    affirmationContent,
    contentLanguageCode,
    languageCode,
  );
  const visibleContentStatus = getAffirmationContentStatusForLanguage(
    contentStatus,
    contentStatusLanguageCode,
    languageCode,
  );
  const eligibleReminderAffirmations = useMemo(() => {
    return getEligibleReminderAffirmations(
      visibleAffirmationContent.topics,
      selectedTopicIds,
    );
  }, [selectedTopicIds, visibleAffirmationContent.topics]);
  const scheduleConfiguredReminder = useCallback(
    (reminderPreferences: ReminderPreferences): ScheduledReminder[] => {
      const reminderAffirmation = selectRandomReminderAffirmation(
        eligibleReminderAffirmations,
      );
      if (!reminderAffirmation) {
        cancelDailyReminder();
        return [];
      }

      const scheduledReminder = scheduleDailyReminder(
        reminderPreferences.hour,
        reminderPreferences.minute,
        {
          title: t('notifications.reminderTitle'),
          message: reminderAffirmation.text,
          affirmationId: reminderAffirmation.id,
        },
      );
      return scheduledReminder ? [scheduledReminder] : [];
    },
    [eligibleReminderAffirmations, t],
  );
  const scheduleConfiguredRandomReminders = useCallback(
    (
      reminderPreferences: ReminderPreferences,
      notificationsPerDay: number,
    ): ScheduledReminder[] => {
      const fallbackAffirmation = eligibleReminderAffirmations[0];
      if (!fallbackAffirmation) {
        cancelRandomReminders();
        return [];
      }

      return scheduleRandomReminders(
        reminderPreferences,
        notificationsPerDay,
        () => {
          const reminderAffirmation =
            selectRandomReminderAffirmation(eligibleReminderAffirmations) ??
            fallbackAffirmation;
          return {
            title: t('notifications.randomReminderTitle'),
            message: reminderAffirmation.text,
            affirmationId: reminderAffirmation.id,
          };
        },
      );
    },
    [eligibleReminderAffirmations, t],
  );

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const [
          storedPreferences,
          storedTopicIds,
          storedBackgroundPreference,
          storedLikedAffirmationKeys,
          randomReminderConfig,
        ] = await Promise.all([
          loadReminderPreferences(),
          loadSelectedAffirmationTopics(),
          loadAffirmationBackgroundPreference(),
          loadLikedAffirmationKeys(),
          loadRandomReminderConfig(),
        ]);

        if (!isMounted) {
          return;
        }

        setPreferences(storedPreferences);
        setSelectedTopicIds(storedTopicIds);
        setBackgroundPreference(storedBackgroundPreference);
        setLikedAffirmationKeys(storedLikedAffirmationKeys);
        setRandomRemindersPerDay(randomReminderConfig.notificationsPerDay);
        setHourInput(storedPreferences.hour.toString());
        setMinuteInput(storedPreferences.minute.toString());
        setRandomStartHourInput(storedPreferences.randomStartHour.toString());
        setRandomStartMinuteInput(
          storedPreferences.randomStartMinute.toString(),
        );
        setRandomEndHourInput(storedPreferences.randomEndHour.toString());
        setRandomEndMinuteInput(storedPreferences.randomEndMinute.toString());
      } catch {
        if (isMounted) {
          setStatusMessage(translationRef.current('status.settingsLoadError'));
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
    configureNotificationChannel(t('notifications.channelName'));
  }, [t]);

  useEffect(() => {
    refreshAffirmationContent();

    return () => {
      contentRequestIdRef.current += 1;
    };
  }, [refreshAffirmationContent]);

  useEffect(
    () =>
      subscribeToUserSettings(settings => {
        setPreferences(settings.reminderPreferences);
        setSelectedTopicIds(settings.selectedTopicIds);
        setBackgroundPreference(settings.backgroundPreference);
        setLikedAffirmationKeys(settings.likedAffirmationKeys);
        setHourInput(settings.reminderPreferences.hour.toString());
        setMinuteInput(settings.reminderPreferences.minute.toString());
        setRandomStartHourInput(
          settings.reminderPreferences.randomStartHour.toString(),
        );
        setRandomStartMinuteInput(
          settings.reminderPreferences.randomStartMinute.toString(),
        );
        setRandomEndHourInput(
          settings.reminderPreferences.randomEndHour.toString(),
        );
        setRandomEndMinuteInput(
          settings.reminderPreferences.randomEndMinute.toString(),
        );
        setIsLoading(false);
      }),
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') return;

      loadRandomReminderConfig()
        .then(config => {
          if (!isMounted) return;
          setRandomRemindersPerDay(config.notificationsPerDay);
          setRandomScheduleRevision(current => current + 1);
        })
        .catch(() => undefined);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (eligibleReminderAffirmations.length === 0) {
      cancelDailyReminder();
      cancelRandomReminders();
      setScheduledWidgetReminders([]);
      return;
    }

    let nextScheduledWidgetReminders: ScheduledReminder[] = [];
    if (preferences.enabled) {
      nextScheduledWidgetReminders = scheduleConfiguredReminder(preferences);
    } else {
      cancelDailyReminder();
    }

    if (!preferences.randomEnabled) {
      cancelRandomReminders();
      setScheduledWidgetReminders(nextScheduledWidgetReminders);
      return;
    }

    if (!isValidRandomReminderRange(preferences, randomRemindersPerDay)) {
      cancelRandomReminders();
      setStatusMessage(
        t('status.invalidRandomRange', { count: randomRemindersPerDay }),
      );
      setScheduledWidgetReminders(nextScheduledWidgetReminders);
      return;
    }

    nextScheduledWidgetReminders = scheduleConfiguredRandomReminders(
      preferences,
      randomRemindersPerDay,
    );
    setScheduledWidgetReminders(nextScheduledWidgetReminders);
  }, [
    eligibleReminderAffirmations,
    isLoading,
    preferences,
    randomRemindersPerDay,
    randomScheduleRevision,
    scheduleConfiguredRandomReminders,
    scheduleConfiguredReminder,
    t,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    publishAffirmationWidgetState({
      notificationsEnabled: preferences.enabled || preferences.randomEnabled,
      affirmations: eligibleReminderAffirmations,
      scheduledNotifications: scheduledWidgetReminders,
    }).catch(() => undefined);
  }, [
    eligibleReminderAffirmations,
    isLoading,
    preferences.enabled,
    preferences.randomEnabled,
    scheduledWidgetReminders,
  ]);

  useEffect(() => {
    if (contentStatus !== 'ready' || contentLanguageCode !== languageCode) {
      return;
    }

    const availableTopicIds = new Set(
      affirmationContent.topics.map(topic => topic.id),
    );
    const validSelectedTopicIds = selectedTopicIds.filter(topicId =>
      availableTopicIds.has(topicId),
    );
    const persistence: Promise<void>[] = [];
    if (
      validSelectedTopicIds.join('\u0000') !== selectedTopicIds.join('\u0000')
    ) {
      setSelectedTopicIds(validSelectedTopicIds);
      persistence.push(saveSelectedAffirmationTopics(validSelectedTopicIds));
    }

    const backgroundId = backgroundPreference.backgroundId;
    if (
      backgroundId !== null &&
      !affirmationContent.backgrounds.some(
        background => background.id === backgroundId,
      )
    ) {
      const nextBackgroundPreference = {
        mode: 'free' as const,
        backgroundId: null,
      };
      setBackgroundPreference(nextBackgroundPreference);
      persistence.push(
        saveAffirmationBackgroundPreference(nextBackgroundPreference),
      );
    }

    const affirmationIds = new Set<string>();
    const legacyKeys = new Map<string, string>();
    affirmationContent.topics.forEach(topic => {
      topic.affirmations.forEach(affirmation => {
        affirmationIds.add(affirmation.id);
        legacyKeys.set(
          `${topic.id}::${affirmation.text.trim()}`,
          affirmation.id,
        );
      });
    });
    const migratedLikeKeys = [
      ...new Set(
        likedAffirmationKeys.map(key =>
          affirmationIds.has(key) ? key : legacyKeys.get(key) ?? key,
        ),
      ),
    ];
    if (
      migratedLikeKeys.join('\u0000') !== likedAffirmationKeys.join('\u0000')
    ) {
      setLikedAffirmationKeys(migratedLikeKeys);
      persistence.push(saveLikedAffirmationKeys(migratedLikeKeys));
    }

    if (persistence.length > 0) {
      Promise.all(persistence)
        .then(syncCurrentDeviceSettingsToDatabase)
        .catch(() => undefined);
    }
  }, [
    affirmationContent.backgrounds,
    affirmationContent.topics,
    backgroundPreference.backgroundId,
    contentLanguageCode,
    contentStatus,
    languageCode,
    likedAffirmationKeys,
    selectedTopicIds,
  ]);

  const reminderTimeText = useMemo(
    () => formatTime(preferences.hour, preferences.minute),
    [preferences.hour, preferences.minute],
  );
  const randomReminderStartTimeText = useMemo(
    () =>
      formatTime(preferences.randomStartHour, preferences.randomStartMinute),
    [preferences.randomStartHour, preferences.randomStartMinute],
  );
  const randomReminderEndTimeText = useMemo(
    () => formatTime(preferences.randomEndHour, preferences.randomEndMinute),
    [preferences.randomEndHour, preferences.randomEndMinute],
  );

  const persistPreferences = useCallback(
    async (next: ReminderPreferences) => {
      setIsSaving(true);

      try {
        await saveReminderPreferences(next);
        await syncCurrentDeviceSettingsToDatabase();
        setPreferences(next);
        return true;
      } catch {
        setStatusMessage(t('status.reminderSaveError'));
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [t],
  );

  const handleToggle = useCallback(
    async (nextEnabled: boolean) => {
      try {
        setStatusMessage(null);

        if (!nextEnabled) {
          const nextPreferences = { ...preferences, enabled: false };
          const persisted = await persistPreferences(nextPreferences);
          if (persisted) {
            cancelDailyReminder();
            setStatusMessage(t('status.remindersOff'));
          }
          return;
        }

        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          setStatusMessage(t('status.permissionRequired'));
          return;
        }

        const nextPreferences = {
          ...preferences,
          enabled: true,
          randomEnabled: false,
        };
        const persisted = await persistPreferences(nextPreferences);
        if (persisted) {
          cancelRandomReminders();
          setStatusMessage(
            t('status.reminderEnabled', {
              time: formatTime(nextPreferences.hour, nextPreferences.minute),
            }),
          );
        }
      } catch {
        setStatusMessage(t('status.reminderUpdateError'));
      }
    },
    [persistPreferences, preferences, t],
  );

  const handleRandomToggle = useCallback(
    async (nextEnabled: boolean) => {
      try {
        setStatusMessage(null);

        if (!nextEnabled) {
          const nextPreferences = {
            ...preferences,
            randomEnabled: false,
          };
          const persisted = await persistPreferences(nextPreferences);
          if (persisted) {
            cancelRandomReminders();
            setStatusMessage(t('status.randomRemindersOff'));
          }
          return;
        }

        if (!isValidRandomReminderRange(preferences, randomRemindersPerDay)) {
          setStatusMessage(
            t('status.invalidRandomRange', { count: randomRemindersPerDay }),
          );
          return;
        }

        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          setStatusMessage(t('status.randomPermissionRequired'));
          return;
        }

        const nextPreferences = {
          ...preferences,
          enabled: false,
          randomEnabled: true,
        };
        const persisted = await persistPreferences(nextPreferences);
        if (persisted) {
          cancelDailyReminder();
          setStatusMessage(
            t('status.randomReminderEnabled', {
              count: randomRemindersPerDay,
              start: formatTime(
                nextPreferences.randomStartHour,
                nextPreferences.randomStartMinute,
              ),
              end: formatTime(
                nextPreferences.randomEndHour,
                nextPreferences.randomEndMinute,
              ),
            }),
          );
        }
      } catch {
        setStatusMessage(t('status.randomReminderUpdateError'));
      }
    },
    [persistPreferences, preferences, randomRemindersPerDay, t],
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
        setStatusMessage(t('status.invalidTime'));
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
        setStatusMessage(
          t('status.reminderTimeUpdated', {
            time: formatTime(nextPreferences.hour, nextPreferences.minute),
          }),
        );
        return;
      }

      setStatusMessage(
        t('status.reminderTimeSaved', {
          time: formatTime(nextPreferences.hour, nextPreferences.minute),
        }),
      );
    } catch {
      setStatusMessage(t('status.reminderTimeError'));
    }
  }, [hourInput, minuteInput, persistPreferences, preferences, t]);

  const handleSaveRandomRange = useCallback(async () => {
    try {
      setStatusMessage(null);

      const nextPreferences = {
        ...preferences,
        randomStartHour: Number(randomStartHourInput),
        randomStartMinute: Number(randomStartMinuteInput),
        randomEndHour: Number(randomEndHourInput),
        randomEndMinute: Number(randomEndMinuteInput),
      };
      if (!isValidRandomReminderRange(nextPreferences, randomRemindersPerDay)) {
        setStatusMessage(
          t('status.invalidRandomRange', { count: randomRemindersPerDay }),
        );
        return;
      }

      const persisted = await persistPreferences(nextPreferences);
      if (!persisted) return;

      const statusKey = nextPreferences.randomEnabled
        ? 'status.randomRangeUpdated'
        : 'status.randomRangeSaved';
      setStatusMessage(
        t(statusKey, {
          start: formatTime(
            nextPreferences.randomStartHour,
            nextPreferences.randomStartMinute,
          ),
          end: formatTime(
            nextPreferences.randomEndHour,
            nextPreferences.randomEndMinute,
          ),
        }),
      );
    } catch {
      setStatusMessage(t('status.randomRangeError'));
    }
  }, [
    persistPreferences,
    preferences,
    randomEndHourInput,
    randomEndMinuteInput,
    randomRemindersPerDay,
    randomStartHourInput,
    randomStartMinuteInput,
    t,
  ]);

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

  const handleOpenTopicSelection = useCallback(() => {
    handlePageSelect(0);
    setIsTopicSelectionVisible(true);
  }, [handlePageSelect]);

  useEffect(
    () =>
      subscribeToOpenedAffirmation(affirmation => {
        setOpenedAffirmation(affirmation);
        setIsTopicSelectionVisible(false);
        handlePageSelect(0);
      }),
    [handlePageSelect],
  );

  useEffect(() => subscribeToOpenedAffirmationLinks(), []);

  const handleTopicSelect = useCallback(
    async (topicIds: AffirmationTopicId[]) => {
      const previousTopicIds = selectedTopicIds;
      setStatusMessage(null);
      setSelectedTopicIds(topicIds);

      try {
        await saveSelectedAffirmationTopics(topicIds);
        await syncCurrentDeviceSettingsToDatabase();
      } catch {
        setSelectedTopicIds(previousTopicIds);
        setStatusMessage(t('status.topicSaveError'));
      }
    },
    [selectedTopicIds, t],
  );

  const handleBackgroundPreferenceChange = useCallback(
    async (nextPreference: AffirmationBackgroundPreference) => {
      const previousPreference = backgroundPreference;
      setStatusMessage(null);
      setBackgroundPreference(nextPreference);

      try {
        await saveAffirmationBackgroundPreference(nextPreference);
        await syncCurrentDeviceSettingsToDatabase();
      } catch {
        setBackgroundPreference(previousPreference);
        setStatusMessage(t('status.backgroundSaveError'));
      }
    },
    [backgroundPreference, t],
  );

  const handleToggleAffirmationLike = useCallback(
    async (affirmationId: string) => {
      const likeKey = buildAffirmationLikeKey(affirmationId);
      const previousLikeKeys = likedAffirmationKeys;
      const nextLikeKeys = previousLikeKeys.includes(likeKey)
        ? previousLikeKeys.filter(key => key !== likeKey)
        : [...previousLikeKeys, likeKey];
      setStatusMessage(null);
      setLikedAffirmationKeys(nextLikeKeys);

      try {
        await toggleLikedAffirmationKey(likeKey);
        await syncCurrentDeviceSettingsToDatabase();
      } catch {
        setLikedAffirmationKeys(previousLikeKeys);
        setStatusMessage(t('status.likeSaveError'));
      }
    },
    [likedAffirmationKeys, t],
  );

  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        barStyle={statusBarStyle}
        translucent={isMobileLayout}
      />
      <SafeAreaView
        edges={isMobileLayout ? ['left', 'right'] : undefined}
        style={styles.container}
        testID="screen-home"
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.pager}
          horizontal
          pagingEnabled
          scrollEnabled={HOME_PAGER_SWIPE_ENABLED}
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
              topics={visibleAffirmationContent.topics}
              backgrounds={visibleAffirmationContent.backgrounds}
              contentStatus={visibleContentStatus}
              onRetryContent={refreshAffirmationContent}
              selectedTopicIds={selectedTopicIds}
              onSelectTopics={handleTopicSelect}
              topicSelectionVisible={isTopicSelectionVisible}
              openedAffirmation={openedAffirmation}
              onCloseTopicSelection={() => {
                setIsTopicSelectionVisible(false);
              }}
              backgroundPreference={backgroundPreference}
              onBackgroundPreferenceChange={handleBackgroundPreferenceChange}
              likedAffirmationKeys={likedAffirmationKeys}
              onToggleAffirmationLike={handleToggleAffirmationLike}
            />
          </View>
          {CALENDAR_PAGE_VISIBLE ? (
            <View
              style={[
                styles.page,
                styles.calendarPage,
                isMobileLayout && styles.pageWithMobileNavigation,
                mobileSecondaryPageInsets,
                { width: pagerWidth },
              ]}
            >
              <CalendarPanel
                backgrounds={visibleAffirmationContent.backgrounds}
              />
            </View>
          ) : null}
          <View
            style={[
              styles.page,
              isMobileLayout && styles.pageWithMobileNavigation,
              mobileSecondaryPageInsets,
              { width: pagerWidth },
            ]}
          >
            <SettingsPanel
              isLoading={isLoading}
              isSaving={isSaving}
              preferences={preferences}
              hourInput={hourInput}
              minuteInput={minuteInput}
              setHourInput={setHourInput}
              setMinuteInput={setMinuteInput}
              randomStartHourInput={randomStartHourInput}
              randomStartMinuteInput={randomStartMinuteInput}
              randomEndHourInput={randomEndHourInput}
              randomEndMinuteInput={randomEndMinuteInput}
              setRandomStartHourInput={setRandomStartHourInput}
              setRandomStartMinuteInput={setRandomStartMinuteInput}
              setRandomEndHourInput={setRandomEndHourInput}
              setRandomEndMinuteInput={setRandomEndMinuteInput}
              onToggle={handleToggle}
              onSaveTime={handleSaveTime}
              onRandomToggle={handleRandomToggle}
              onSaveRandomRange={handleSaveRandomRange}
              statusMessage={statusMessage}
              reminderTimeText={reminderTimeText}
              randomReminderStartTimeText={randomReminderStartTimeText}
              randomReminderEndTimeText={randomReminderEndTimeText}
              randomRemindersPerDay={randomRemindersPerDay}
              onClose={() => {
                handlePageSelect(0);
              }}
            />
          </View>
        </ScrollView>
        {isMobileLayout ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.mobileFooter,
              { paddingBottom: safeAreaInsets.bottom },
            ]}
          >
            <HomeFooter
              activePage={activePage}
              onOpenTopicSelection={handleOpenTopicSelection}
              onSelectPage={handlePageSelect}
              variant={activePage === 0 ? 'onImage' : 'minimal'}
            />
          </View>
        ) : (
          <HomeFooter
            activePage={activePage}
            onOpenTopicSelection={handleOpenTopicSelection}
            onSelectPage={handlePageSelect}
          />
        )}
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;
