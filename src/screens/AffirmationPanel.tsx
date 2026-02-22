import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  AFFIRMATION_TOPICS,
  getAffirmationTopicById,
} from '../features/affirmations/data';
import { AffirmationTopicId } from '../features/affirmations/types';
import styles from './HomeScreen.styles';

type Props = {
  selectedTopicIds: AffirmationTopicId[];
  onSelectTopics: (topicIds: AffirmationTopicId[]) => Promise<void> | void;
};

function getDailyIndex(length: number): number {
  if (length <= 0) {
    return 0;
  }

  return Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % length;
}

type TopicAffirmation = {
  topicName: string;
  imageUri: string;
  text: string;
};

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
        topicName: topic.name,
        imageUri: affirmation.imageUri,
        text: affirmation.text,
      });
    });
  }

  return feed;
}

const AffirmationPanel: React.FC<Props> = ({ selectedTopicIds, onSelectTopics }) => {
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const normalizedSelectedTopicIds = useMemo(
    () => [...new Set(selectedTopicIds)],
    [selectedTopicIds],
  );
  const activeTopicIds = useMemo(() => {
    if (normalizedSelectedTopicIds.length > 0) {
      return normalizedSelectedTopicIds;
    }

    return AFFIRMATION_TOPICS.map(topic => topic.id);
  }, [normalizedSelectedTopicIds]);
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

    setActiveAffirmationIndex(
      currentIndex => (currentIndex + 1) % totalAffirmations,
    );
  }, [totalAffirmations]);

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
            showNextAffirmation();
            return;
          }

          showPreviousAffirmation();
        },
      }),
    [showNextAffirmation, showPreviousAffirmation],
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

  if (!activeAffirmation) {
    return null;
  }

  return (
    <View style={styles.affirmationContent} {...panResponder.panHandlers}>
      <Image
        source={{ uri: activeAffirmation.imageUri }}
        style={styles.affirmationImage}
        resizeMode="cover"
      />
      <View style={styles.affirmationTextOverlay}>
        <Text style={styles.affirmationText}>{activeAffirmation.text}</Text>
      </View>
      <View style={styles.affirmationHeader}>
        <Pressable
          style={styles.topicPickerButton}
          onPress={() => {
            setIsTopicModalVisible(true);
          }}
        >
          <Text style={styles.topicPickerButtonText}>
            Topic: {activeAffirmation.topicName}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.affirmationSwipeHint}>
        Swipe up/down for next affirmation
      </Text>

      <Modal
        animationType="fade"
        transparent
        visible={isTopicModalVisible}
        onRequestClose={() => {
          setIsTopicModalVisible(false);
        }}
      >
        <View style={styles.topicModalBackdrop}>
          <View style={styles.topicModalSheet}>
            <View style={styles.topicModalHeader}>
              <Text style={styles.topicModalTitle}>Select topics</Text>
              <Pressable
                onPress={() => {
                  setIsTopicModalVisible(false);
                }}
              >
                <Text style={styles.topicModalCloseText}>Done</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.topicList}>
              {AFFIRMATION_TOPICS.map(topic => {
                const isSelected = normalizedSelectedTopicIds.includes(topic.id);

                return (
                  <Pressable
                    key={topic.id}
                    style={[styles.topicCard, isSelected && styles.topicCardSelected]}
                    onPress={() => {
                      const nextTopicIds = isSelected
                        ? normalizedSelectedTopicIds.filter(id => id !== topic.id)
                        : [...normalizedSelectedTopicIds, topic.id];

                      onSelectTopics(nextTopicIds);
                    }}
                  >
                    <Image
                      source={{ uri: topic.imageUri }}
                      style={styles.topicCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.topicCardOverlay}>
                      <Text style={styles.topicCardTitle}>{topic.name}</Text>
                      {isSelected ? (
                        <Text style={styles.topicCardSelectionText}>Selected</Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AffirmationPanel;
