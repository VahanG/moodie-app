import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, Text, View } from 'react-native';
import { AFFIRMATION_TOPICS, getAffirmationTopicById } from '../features/affirmations/data';
import { getAffirmationBackgroundById } from '../features/affirmations/backgrounds';
import {
  AffirmationBackgroundPreference,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { buildAffirmationLikeKey } from '../features/affirmations/storage';
import { useHomeScreenStyles } from './HomeScreen.styles';
import TopicSelectionModal from './TopicSelectionModal';
import BackgroundSelectionModal from './BackgroundSelectionModal';

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

function buildAffirmationFeed(topicIds: AffirmationTopicId[]): TopicAffirmation[] {
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
  const styles = useHomeScreenStyles();
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const [isBackgroundModalVisible, setIsBackgroundModalVisible] = useState(false);
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

  useEffect(() => {
    setActiveAffirmationIndex(dailyAffirmationIndex);
  }, [dailyAffirmationIndex]);

  const showPreviousAffirmation = useCallback(() => {
    if (totalAffirmations === 0) {
      return;
    }

    setActiveAffirmationIndex(
      currentIndex => (currentIndex - 1 + totalAffirmations) % totalAffirmations,
    );
  }, [totalAffirmations]);

  const showNextAffirmation = useCallback(() => {
    if (totalAffirmations === 0) {
      return;
    }

    setActiveAffirmationIndex(currentIndex => (currentIndex + 1) % totalAffirmations);
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

  const activeAffirmation = useMemo(() => {
    if (affirmationFeed.length === 0) {
      return undefined;
    }

    const safeIndex =
      ((activeAffirmationIndex % affirmationFeed.length) + affirmationFeed.length) %
      affirmationFeed.length;
    return affirmationFeed[safeIndex];
  }, [activeAffirmationIndex, affirmationFeed]);

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

    return buildAffirmationLikeKey(activeAffirmation.topicId, activeAffirmation.text);
  }, [activeAffirmation]);
  const isActiveAffirmationLiked =
    activeAffirmationLikeKey !== null &&
    likedAffirmationKeys.includes(activeAffirmationLikeKey);

  const activeImageUri =
    backgroundPreference.mode === 'fixed' && selectedFixedBackground
      ? selectedFixedBackground.imageUri
      : activeAffirmation?.imageUri;
  const shouldAnimateImage = backgroundPreference.mode !== 'fixed';

  if (!activeAffirmation || !activeImageUri) {
    return null;
  }

  return (
    <View style={styles.affirmationContent} {...panResponder.panHandlers}>
      <Animated.Image
        source={{ uri: activeImageUri }}
        style={[
          styles.affirmationImage,
          shouldAnimateImage && {
            transform: [{ translateY: affirmationTranslateY }],
            opacity: affirmationOpacity,
          },
        ]}
        resizeMode="cover"
      />
      <Animated.View
        style={[
          styles.affirmationTextOverlay,
          {
            transform: [{ translateY: affirmationTranslateY }],
            opacity: affirmationOpacity,
          },
        ]}
      >
        <Text style={styles.affirmationText}>{activeAffirmation.text}</Text>
        <View style={styles.affirmationActionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isActiveAffirmationLiked ? 'Unlike affirmation' : 'Like affirmation'
            }
            style={styles.affirmationActionButton}
            onPress={() => {
              onToggleAffirmationLike(
                activeAffirmation.topicId,
                activeAffirmation.text,
              );
            }}
          >
            <Text style={styles.affirmationActionIcon}>
              {isActiveAffirmationLiked ? '♥' : '♡'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share affirmation"
            style={styles.affirmationActionButton}
            onPress={() => {}}
          >
            <Text style={styles.affirmationActionIcon}>↗</Text>
          </Pressable>
        </View>
      </Animated.View>
      <View style={styles.affirmationHeader}>
        <Pressable
          style={styles.topicPickerButton}
          accessibilityLabel="Select affirmation background"
          onPress={() => {
            setIsBackgroundModalVisible(true);
          }}
        >
          <Text style={styles.topicPickerButtonIcon}>🖼</Text>
        </Pressable>
        <Pressable
          style={styles.topicPickerButton}
          onPress={() => {
            setIsTopicModalVisible(true);
          }}
        >
          <Text style={styles.topicPickerButtonText}>Topic: {activeAffirmation.topicName}</Text>
        </Pressable>
      </View>
      <Text style={styles.affirmationSwipeHint}>Swipe up/down for next affirmation</Text>
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
