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
  Pressable,
  Share,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AffirmationBackground,
  AffirmationBackgroundPreference,
  AffirmationTopic,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { buildAffirmationLikeKey } from '../features/affirmations/storage';
import TopicSelectionModal from './TopicSelectionModal';
import BackgroundSelectionModal from './BackgroundSelectionModal';
import { AppButton, AppText, IconButton } from '../components/ui';
import { useTheme } from '../theme';
import { useAffirmationPanelStyles } from './AffirmationPanel.styles';
import { useLocalization } from '../features/localization';

type Props = {
  topics: AffirmationTopic[];
  backgrounds: AffirmationBackground[];
  contentStatus: 'loading' | 'ready' | 'error';
  onRetryContent: () => Promise<void> | void;
  selectedTopicIds: AffirmationTopicId[];
  onSelectTopics: (topicIds: AffirmationTopicId[]) => Promise<void> | void;
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
  topicName: string;
  imageUri: string;
  text: string;
};

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
        topicName: topic.name,
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
  backgroundPreference,
  onBackgroundPreferenceChange,
  likedAffirmationKeys,
  onToggleAffirmationLike,
}) => {
  const styles = useAffirmationPanelStyles();
  const { theme } = useTheme();
  const { languageCode, t } = useLocalization();
  const { height: windowHeight } = useWindowDimensions();
  const isCompactLayout = windowHeight < 700;
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
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
  const affirmationFeed = useMemo(
    () => buildAffirmationFeed(activeTopics),
    [activeTopics],
  );
  const dailyAffirmationIndex = useMemo(
    () => getDailyIndex(affirmationFeed.length),
    [affirmationFeed.length],
  );
  const [activeAffirmationIndex, setActiveAffirmationIndex] = useState(
    dailyAffirmationIndex,
  );
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
    setActiveAffirmationIndex(dailyAffirmationIndex);
  }, [dailyAffirmationIndex]);

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

  const selectedFixedBackground = useMemo(() => {
    if (backgroundPreference.backgroundId === null) {
      return undefined;
    }

    return backgrounds.find(
      background => background.id === backgroundPreference.backgroundId,
    );
  }, [backgroundPreference.backgroundId, backgrounds]);

  const activeAffirmationLikeKey = useMemo(() => {
    if (!activeAffirmation) {
      return null;
    }

    return buildAffirmationLikeKey(activeAffirmation.id);
  }, [activeAffirmation]);
  const isActiveAffirmationLiked =
    activeAffirmationLikeKey !== null &&
    likedAffirmationKeys.includes(activeAffirmationLikeKey);

  const activeImageUri =
    backgroundPreference.mode === 'fixed' && selectedFixedBackground
      ? selectedFixedBackground.imageUri
      : activeAffirmation?.imageUri;
  const shouldAnimateImage = backgroundPreference.mode !== 'fixed';
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

  if (!activeAffirmation || !activeImageUri) {
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
      style={styles.screen}
      testID="screen-affirmations"
      {...panResponder.panHandlers}
    >
      <View style={styles.mediaCard}>
        <Animated.Image
          source={{ uri: activeImageUri }}
          style={[
            styles.image,
            shouldAnimateImage && {
              transform: [{ translateY: affirmationTranslateY }],
              opacity: affirmationOpacity,
            },
          ]}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          testID="image-affirmation-background"
        />
        <View pointerEvents="none" style={styles.imageOverlay} />
        <View
          style={[styles.content, isCompactLayout && styles.contentCompact]}
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
              variant="onImage"
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
            <Pressable
              accessibilityLabel={t('affirmations.chooseTopic', {
                topic: activeAffirmation.topicName,
              })}
              accessibilityRole="button"
              onPress={() => {
                setIsTopicModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.topicChip,
                pressed && { opacity: 0.72 },
              ]}
              testID="btn-open-topic-selection"
            >
              <Ionicons
                color={theme.colors.onImage}
                name="sparkles-outline"
                size={16}
              />
              <AppText
                style={styles.topicText}
                testID="text-current-topic"
                variant="label"
              >
                {activeAffirmation.topicName}
              </AppText>
              <Ionicons
                color={theme.colors.onImageMuted}
                name="chevron-down"
                size={15}
              />
            </Pressable>

            <AppText
              style={[
                styles.quoteMark,
                isCompactLayout && styles.quoteMarkCompact,
              ]}
              tone="onImage"
            >
              “
            </AppText>
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
              <View style={styles.actionDivider} />
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

          <View style={styles.footer}>
            <View style={styles.swipeHint} testID="hint-affirmation-swipe">
              <Ionicons
                color={theme.colors.onImageMuted}
                name="swap-vertical-outline"
                size={18}
              />
              <AppText
                style={styles.swipeHintText}
                tone="onImage"
                variant="caption"
              >
                {t('affirmations.swipe')}
              </AppText>
            </View>
            <AppText
              style={styles.position}
              testID="text-affirmation-position"
              tone="onImage"
              variant="caption"
            >
              {safeActiveAffirmationIndex + 1} / {totalAffirmations}
            </AppText>
          </View>
        </View>
      </View>
      <TopicSelectionModal
        topics={topics}
        visible={isTopicModalVisible}
        selectedTopicIds={normalizedSelectedTopicIds}
        onClose={() => {
          setIsTopicModalVisible(false);
        }}
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
