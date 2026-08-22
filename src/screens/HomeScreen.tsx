import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, StatusBar, useWindowDimensions, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
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
  saveLikedAffirmationKeys,
  saveSelectedAffirmationTopics,
  toggleLikedAffirmationKey,
} from '../features/affirmations/storage';
import { loadAffirmationContent } from '../features/affirmations/content';
import {
  AffirmationContent,
  AffirmationBackgroundPreference,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { useHomeScreenStyles } from './HomeScreen.styles';
import SettingsPanel from './SettingsPanel';
import AffirmationPanel from './AffirmationPanel';
import CalendarPanel from './CalendarPanel';
import HomeFooter from './HomeFooter';
import { getHomePageIndex, HOME_PAGE_COUNT } from './homePager';
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(0);
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
  const reminderNotificationContent = useMemo(
    () => ({
      title: t('notifications.reminderTitle'),
      message: t('notifications.reminderMessage'),
    }),
    [t],
  );

  const refreshAffirmationContent = useCallback(async () => {
    const requestedLanguageCode = languageCode;
    const requestId = contentRequestIdRef.current + 1;
    contentRequestIdRef.current = requestId;
    setContentStatusLanguageCode(requestedLanguageCode);
    setContentStatus('loading');

    try {
      const loaded = await loadAffirmationContent(requestedLanguageCode);
      if (contentRequestIdRef.current !== requestId) {
        return;
      }
      setAffirmationContent(loaded.content);
      setContentLanguageCode(requestedLanguageCode);
      setContentStatus('ready');
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

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        configureNotificationChannel(t('notifications.channelName'));
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
            reminderNotificationContent,
          );
        }
      } catch {
        if (isMounted) {
          setStatusMessage(t('status.settingsLoadError'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();
    refreshAffirmationContent();

    return () => {
      isMounted = false;
    };
  }, [refreshAffirmationContent, reminderNotificationContent, t]);

  useEffect(
    () =>
      subscribeToUserSettings(settings => {
        setPreferences(settings.reminderPreferences);
        setSelectedTopicIds(settings.selectedTopicIds);
        setBackgroundPreference(settings.backgroundPreference);
        setLikedAffirmationKeys(settings.likedAffirmationKeys);
        setHourInput(settings.reminderPreferences.hour.toString());
        setMinuteInput(settings.reminderPreferences.minute.toString());
        setIsLoading(false);

        if (settings.reminderPreferences.enabled) {
          scheduleDailyReminder(
            settings.reminderPreferences.hour,
            settings.reminderPreferences.minute,
            reminderNotificationContent,
          );
        } else {
          cancelDailyReminder();
        }
      }),
    [reminderNotificationContent],
  );

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

        const nextPreferences = { ...preferences, enabled: true };
        const persisted = await persistPreferences(nextPreferences);
        if (persisted) {
          scheduleDailyReminder(
            nextPreferences.hour,
            nextPreferences.minute,
            reminderNotificationContent,
          );
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
    [persistPreferences, preferences, reminderNotificationContent, t],
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
        scheduleDailyReminder(
          nextPreferences.hour,
          nextPreferences.minute,
          reminderNotificationContent,
        );
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
  }, [
    hourInput,
    minuteInput,
    persistPreferences,
    preferences,
    reminderNotificationContent,
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
              backgroundPreference={backgroundPreference}
              onBackgroundPreferenceChange={handleBackgroundPreferenceChange}
              likedAffirmationKeys={likedAffirmationKeys}
              onToggleAffirmationLike={handleToggleAffirmationLike}
            />
          </View>
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
              onToggle={handleToggle}
              onSaveTime={handleSaveTime}
              statusMessage={statusMessage}
              reminderTimeText={reminderTimeText}
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
              onSelectPage={handlePageSelect}
              variant={activePage === 0 ? 'onImage' : 'minimal'}
            />
          </View>
        ) : (
          <HomeFooter activePage={activePage} onSelectPage={handlePageSelect} />
        )}
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;
