import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Animated,
  PanResponder,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AffirmationBackground,
  AffirmationBackgroundPreference,
  AffirmationTopic,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { buildAffirmationLikeKey } from '../features/affirmations/storage';
import { resolveAffirmationBackground } from '../features/affirmations/background';
import {
  getAdjacentAffirmationImageUris,
  prefetchAffirmationImages,
} from '../features/affirmations/imagePrefetch';
import TopicSelectionModal from './TopicSelectionModal';
import BackgroundSelectionModal from './BackgroundSelectionModal';
import AffirmationBackgroundImage from './AffirmationBackgroundImage';
import { AppButton, AppText, IconButton } from '../components/ui';
import { MOBILE_LAYOUT_BREAKPOINT, useTheme } from '../theme';
import { useAffirmationPanelStyles } from './AffirmationPanel.styles';
import { useLocalization } from '../features/localization';
import type { OpenedAffirmation } from '../features/notifications/openedAffirmation';

type Props = {
  topics: AffirmationTopic[];
  backgrounds: AffirmationBackground[];
  contentStatus: 'loading' | 'ready' | 'error';
  onRetryContent: () => Promise<void> | void;
  selectedTopicIds: AffirmationTopicId[];
  onSelectTopics: (topicIds: AffirmationTopicId[]) => Promise<void> | void;
  topicSelectionVisible: boolean;
  onCloseTopicSelection: () => void;
  openedAffirmation: OpenedAffirmation | null;
  backgroundPreference: AffirmationBackgroundPreference;
  onBackgroundPreferenceChange: (
    preference: AffirmationBackgroundPreference,
  ) => Promise<void> | void;
  likedAffirmationKeys: string[];
  onToggleAffirmationLike: (affirmationId: string) => Promise<void> | void;
};

type TopicAffirmation = {
  id: string;
  topicId: AffirmationTopicId;
  imageUri: string;
  text: string;
};

const READY_BACKGROUND_URI_LIMIT = 3;

function getDailyIndex(length: number): number {
  if (length <= 0) {
    return 0;
  }

  return Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % length;
}

function buildAffirmationFeed(topics: AffirmationTopic[]): TopicAffirmation[] {
  const maxAffirmationCount = topics.reduce(
    (maxCount, topic) => Math.max(maxCount, topic.affirmations.length),
    0,
  );
  const feed: TopicAffirmation[] = [];

  for (let index = 0; index < maxAffirmationCount; index += 1) {
    topics.forEach(topic => {
      const affirmation = topic.affirmations[index];
      if (!affirmation) {
        return;
      }

      feed.push({
        id: affirmation.id,
        topicId: topic.id,
        imageUri: affirmation.imageUri,
        text: affirmation.text,
      });
    });
  }

  return feed;
}

const AffirmationPanel: React.FC<Props> = ({
  topics,
  backgrounds,
  contentStatus,
  onRetryContent,
  selectedTopicIds,
  onSelectTopics,
  topicSelectionVisible,
  onCloseTopicSelection,
  openedAffirmation,
  backgroundPreference,
  onBackgroundPreferenceChange,
  likedAffirmationKeys,
  onToggleAffirmationLike,
}) => {
  const styles = useAffirmationPanelStyles();
  const { theme } = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { languageCode, t } = useLocalization();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isCompactLayout = windowHeight < 700;
  const isMobileLayout = windowWidth < MOBILE_LAYOUT_BREAKPOINT;
  const [isBackgroundModalVisible, setIsBackgroundModalVisible] =
    useState(false);
  const normalizedSelectedTopicIds = useMemo(
    () => [...new Set(selectedTopicIds)],
    [selectedTopicIds],
  );
  const activeTopics = useMemo(
    () =>
      normalizedSelectedTopicIds.length > 0
        ? topics.filter(topic => normalizedSelectedTopicIds.includes(topic.id))
        : topics,
    [normalizedSelectedTopicIds, topics],
  );
  const affirmationFeed = useMemo(() => {
    const feed = buildAffirmationFeed(activeTopics);
    if (!openedAffirmation) {
      return feed;
    }

    const existingAffirmation = feed.find(
      affirmation => affirmation.id === openedAffirmation.id,
    );
    if (existingAffirmation) {
      return feed.map(affirmation =>
        affirmation.id === openedAffirmation.id
          ? { ...affirmation, text: openedAffirmation.text }
          : affirmation,
      );
    }

    const catalogAffirmation = buildAffirmationFeed(topics).find(
      affirmation => affirmation.id === openedAffirmation.id,
    );
    const visualFallback = catalogAffirmation ?? feed[0];
    return [
      ...feed,
      {
        id: openedAffirmation.id,
        topicId: visualFallback?.topicId ?? '',
        imageUri: visualFallback?.imageUri ?? '',
        text: openedAffirmation.text,
      },
    ];
  }, [activeTopics, openedAffirmation, topics]);
  const dailyAffirmationIndex = useMemo(
    () => getDailyIndex(affirmationFeed.length),
    [affirmationFeed.length],
  );
  const [activeAffirmationIndex, setActiveAffirmationIndex] = useState(
    dailyAffirmationIndex,
  );
  const [readyBackgroundUris, setReadyBackgroundUris] = useState<string[]>([]);
  const totalAffirmations = affirmationFeed.length;
  const affirmationTranslateY = useRef(new Animated.Value(0)).current;
  const affirmationOpacity = useRef(new Animated.Value(1)).current;
  const isAffirmationAnimating = useRef(false);
  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(languageCode, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [languageCode],
  );

  useEffect(() => {
    const openedAffirmationIndex = openedAffirmation
      ? affirmationFeed.findIndex(
          affirmation => affirmation.id === openedAffirmation.id,
        )
      : -1;

    setActiveAffirmationIndex(
      openedAffirmationIndex >= 0
        ? openedAffirmationIndex
        : dailyAffirmationIndex,
    );
  }, [affirmationFeed, dailyAffirmationIndex, openedAffirmation]);

  const showPreviousAffirmation = useCallback(() => {
    if (totalAffirmations === 0) {
      return;
    }

    setActiveAffirmationIndex(
      currentIndex =>
        (currentIndex - 1 + totalAffirmations) % totalAffirmations,
    );
  }, [totalAffirmations]);

  const showNextAffirmation = useCallback(() => {
    if (totalAffirmations === 0) {
      return;
    }

    setActiveAffirmationIndex(
      currentIndex => (currentIndex + 1) % totalAffirmations,
    );
  }, [totalAffirmations]);

  const animateAffirmationChange = useCallback(
    (direction: 'up' | 'down') => {
      if (isAffirmationAnimating.current || totalAffirmations === 0) {
        return;
      }

      isAffirmationAnimating.current = true;
      const outgoingOffset = direction === 'up' ? -28 : 28;

      Animated.parallel([
        Animated.timing(affirmationTranslateY, {
          toValue: outgoingOffset,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(affirmationOpacity, {
          toValue: 0,
          duration: 170,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (direction === 'up') {
          showNextAffirmation();
        } else {
          showPreviousAffirmation();
        }

        affirmationTranslateY.setValue(-outgoingOffset);
        Animated.parallel([
          Animated.timing(affirmationTranslateY, {
            toValue: 0,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.timing(affirmationOpacity, {
            toValue: 1,
            duration: 170,
            useNativeDriver: true,
          }),
        ]).start(() => {
          isAffirmationAnimating.current = false;
        });
      });
    },
    [
      affirmationOpacity,
      affirmationTranslateY,
      showNextAffirmation,
      showPreviousAffirmation,
      totalAffirmations,
    ],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 12,
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dy) < 30) {
            return;
          }

          if (gestureState.dy < 0) {
            animateAffirmationChange('up');
            return;
          }

          animateAffirmationChange('down');
        },
      }),
    [animateAffirmationChange],
  );

  const safeActiveAffirmationIndex = useMemo(() => {
    if (affirmationFeed.length === 0) {
      return 0;
    }

    return (
      ((activeAffirmationIndex % affirmationFeed.length) +
        affirmationFeed.length) %
      affirmationFeed.length
    );
  }, [activeAffirmationIndex, affirmationFeed]);
  const activeAffirmation = affirmationFeed[safeActiveAffirmationIndex];
  const resolvedBackgrounds = useMemo(
    () =>
      affirmationFeed.map(affirmation =>
        resolveAffirmationBackground({
          affirmationImageUri: affirmation.imageUri,
          backgrounds,
          preference: backgroundPreference,
        }),
      ),
    [affirmationFeed, backgroundPreference, backgrounds],
  );

  const activeAffirmationLikeKey = useMemo(() => {
    if (!activeAffirmation) {
      return null;
    }

    return buildAffirmationLikeKey(activeAffirmation.id);
  }, [activeAffirmation]);
  const isActiveAffirmationLiked =
    activeAffirmationLikeKey !== null &&
    likedAffirmationKeys.includes(activeAffirmationLikeKey);

  const activeBackground =
    resolvedBackgrounds[safeActiveAffirmationIndex] ?? null;
  const markBackgroundUrisReady = useCallback((imageUris: string[]) => {
    setReadyBackgroundUris(currentImageUris =>
      [
        ...currentImageUris.filter(imageUri => !imageUris.includes(imageUri)),
        ...imageUris,
      ].slice(-READY_BACKGROUND_URI_LIMIT),
    );
  }, []);

  useEffect(() => {
    if (backgroundPreference.mode === 'fixed') {
      return;
    }

    let isActive = true;

    const adjacentImageUris = getAdjacentAffirmationImageUris(
      resolvedBackgrounds.map(background => background?.imageUri ?? ''),
      safeActiveAffirmationIndex,
    );

    prefetchAffirmationImages(adjacentImageUris).then(prefetchedImageUris => {
      if (isActive && prefetchedImageUris.length > 0) {
        markBackgroundUrisReady(prefetchedImageUris);
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    backgroundPreference.mode,
    markBackgroundUrisReady,
    resolvedBackgrounds,
    safeActiveAffirmationIndex,
  ]);

  const handleShareAffirmation = useCallback(async () => {
    if (!activeAffirmation) {
      return;
    }

    try {
      await Share.share({
        message: `${activeAffirmation.text}\n\n— Moodie`,
      });
    } catch {
      // Native share cancellation and unavailable share targets are non-fatal.
    }
  }, [activeAffirmation]);

  if (!activeAffirmation) {
    return (
      <View style={styles.screen} testID="screen-affirmations">
        <View style={styles.emptyState} testID="state-affirmation-content">
          <AppText variant="heading">
            {contentStatus === 'loading'
              ? t('affirmations.loadingTitle')
              : t('affirmations.unavailableTitle')}
          </AppText>
          <AppText tone="muted">
            {contentStatus === 'loading'
              ? t('affirmations.loadingDescription')
              : t('affirmations.unavailableDescription')}
          </AppText>
          {contentStatus === 'error' ? (
            <AppButton
              compact
              fullWidth={false}
              label={t('common.tryAgain')}
              onPress={onRetryContent}
              testID="btn-retry-affirmation-content"
            />
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, isMobileLayout && styles.screenMobile]}
      testID="screen-affirmations"
      {...panResponder.panHandlers}
    >
      <View
        style={[styles.mediaCard, isMobileLayout && styles.mediaCardMobile]}
        testID="card-affirmation-media"
      >
        {activeBackground ? (
          <AffirmationBackgroundImage
            imageUri={activeBackground.imageUri}
            onImageLoad={imageUri => {
              markBackgroundUrisReady([imageUri]);
            }}
            readyImageUris={readyBackgroundUris}
            style={styles.image}
          />
        ) : null}
        <View pointerEvents="none" style={styles.imageOverlay} />
        <View
          style={[
            styles.content,
            isCompactLayout && styles.contentCompact,
            isMobileLayout && styles.contentMobile,
            isMobileLayout && {
              paddingTop: safeAreaInsets.top + theme.spacing.lg,
              paddingBottom: safeAreaInsets.bottom + 76,
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headingBlock}>
              <AppText style={styles.eyebrow} testID="text-today-heading">
                {t('affirmations.today')}
              </AppText>
              <AppText style={styles.date} tone="onImage" variant="caption">
                {todayLabel}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel={t('affirmations.chooseBackground')}
              compact
              icon={
                <Ionicons
                  color={theme.colors.onImage}
                  name="images-outline"
                  size={21}
                />
              }
              onPress={() => {
                setIsBackgroundModalVisible(true);
              }}
              testID="btn-open-background-selection"
              variant={isMobileLayout ? 'ghost' : 'onImage'}
            />
          </View>

          <Animated.View
            style={[
              styles.body,
              isCompactLayout && styles.bodyCompact,
              {
                transform: [{ translateY: affirmationTranslateY }],
                opacity: affirmationOpacity,
              },
            ]}
          >
            <AppText
              style={[
                styles.affirmationText,
                isCompactLayout && styles.affirmationTextCompact,
              ]}
              testID="text-affirmation"
              tone="onImage"
            >
              {activeAffirmation.text}
            </AppText>

            <View
              style={[
                styles.actionDock,
                isCompactLayout && styles.actionDockCompact,
                isMobileLayout && styles.actionDockMobile,
              ]}
            >
              <IconButton
                accessibilityLabel={
                  isActiveAffirmationLiked
                    ? t('affirmations.unlike')
                    : t('affirmations.like')
                }
                accessibilityState={{ selected: isActiveAffirmationLiked }}
                compact
                icon={
                  <Ionicons
                    color={theme.colors.onImage}
                    name={isActiveAffirmationLiked ? 'heart' : 'heart-outline'}
                    size={23}
                  />
                }
                onPress={() => {
                  onToggleAffirmationLike(activeAffirmation.id);
                }}
                style={styles.actionButton}
                testID="btn-like-affirmation"
                variant="ghost"
              />
              <View
                style={[
                  styles.actionDivider,
                  isMobileLayout && styles.actionDividerMobile,
                ]}
              />
              <IconButton
                accessibilityLabel={t('affirmations.share')}
                compact
                icon={
                  <Ionicons
                    color={theme.colors.onImage}
                    name="share-outline"
                    size={23}
                  />
                }
                onPress={handleShareAffirmation}
                style={styles.actionButton}
                testID="btn-share-affirmation"
                variant="ghost"
              />
            </View>
          </Animated.View>
        </View>
      </View>
      <TopicSelectionModal
        topics={topics}
        visible={topicSelectionVisible}
        selectedTopicIds={normalizedSelectedTopicIds}
        onClose={onCloseTopicSelection}
        onSelectTopics={onSelectTopics}
      />
      <BackgroundSelectionModal
        backgrounds={backgrounds}
        visible={isBackgroundModalVisible}
        backgroundPreference={backgroundPreference}
        onBackgroundPreferenceChange={onBackgroundPreferenceChange}
        onClose={() => {
          setIsBackgroundModalVisible(false);
        }}
      />
    </View>
  );
};

export default AffirmationPanel;
