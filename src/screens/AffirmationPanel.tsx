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
  AFFIRMATION_TOPICS,
  getAffirmationTopicById,
} from '../features/affirmations/data';
import { getAffirmationBackgroundById } from '../features/affirmations/backgrounds';
import {
  AffirmationBackgroundPreference,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { buildAffirmationLikeKey } from '../features/affirmations/storage';
import TopicSelectionModal from './TopicSelectionModal';
import BackgroundSelectionModal from './BackgroundSelectionModal';
import { AppText, IconButton } from '../components/ui';
import { useTheme } from '../theme';
import { useAffirmationPanelStyles } from './AffirmationPanel.styles';

type Props = {
  selectedTopicIds: AffirmationTopicId[];
  onSelectTopics: (topicIds: AffirmationTopicId[]) => Promise<void> | void;
  backgroundPreference: AffirmationBackgroundPreference;
  onBackgroundPreferenceChange: (
    preference: AffirmationBackgroundPreference,
  ) => Promise<void> | void;
  likedAffirmationKeys: string[];
  onToggleAffirmationLike: (
    topicId: AffirmationTopicId,
    affirmationText: string,
  ) => Promise<void> | void;
};

type TopicAffirmation = {
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

function buildAffirmationFeed(
  topicIds: AffirmationTopicId[],
): TopicAffirmation[] {
  const topics = topicIds.map(getAffirmationTopicById);
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
  selectedTopicIds,
  onSelectTopics,
  backgroundPreference,
  onBackgroundPreferenceChange,
  likedAffirmationKeys,
  onToggleAffirmationLike,
}) => {
  const styles = useAffirmationPanelStyles();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const isCompactLayout = windowHeight < 700;
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const [isBackgroundModalVisible, setIsBackgroundModalVisible] =
    useState(false);
  const normalizedSelectedTopicIds = useMemo(
    () => [...new Set(selectedTopicIds)],
    [selectedTopicIds],
  );
  const activeTopicIds = useMemo(
    () =>
      normalizedSelectedTopicIds.length > 0
        ? normalizedSelectedTopicIds
        : AFFIRMATION_TOPICS.map(topic => topic.id),
    [normalizedSelectedTopicIds],
  );
  const affirmationFeed = useMemo(
    () => buildAffirmationFeed(activeTopicIds),
    [activeTopicIds],
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
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(new Date()),
    [],
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

    return getAffirmationBackgroundById(backgroundPreference.backgroundId);
  }, [backgroundPreference.backgroundId]);

  const activeAffirmationLikeKey = useMemo(() => {
    if (!activeAffirmation) {
      return null;
    }

    return buildAffirmationLikeKey(
      activeAffirmation.topicId,
      activeAffirmation.text,
    );
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
    return null;
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
                Today
              </AppText>
              <AppText style={styles.date} tone="onImage" variant="caption">
                {todayLabel}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel="Choose affirmation background"
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
              accessibilityLabel={`Choose affirmation topic. Current topic ${activeAffirmation.topicName}`}
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
                    ? 'Unlike affirmation'
                    : 'Like affirmation'
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
                  onToggleAffirmationLike(
                    activeAffirmation.topicId,
                    activeAffirmation.text,
                  );
                }}
                style={styles.actionButton}
                testID="btn-like-affirmation"
                variant="ghost"
              />
              <View style={styles.actionDivider} />
              <IconButton
                accessibilityLabel="Share affirmation"
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
                Swipe for another
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
        visible={isTopicModalVisible}
        selectedTopicIds={normalizedSelectedTopicIds}
        onClose={() => {
          setIsTopicModalVisible(false);
        }}
        onSelectTopics={onSelectTopics}
      />
      <BackgroundSelectionModal
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
