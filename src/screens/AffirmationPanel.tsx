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
  selectedTopicId: AffirmationTopicId;
  onSelectTopic: (topicId: AffirmationTopicId) => Promise<void> | void;
};

function getDailyIndex(length: number): number {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % length;
}

const AffirmationPanel: React.FC<Props> = ({ selectedTopicId, onSelectTopic }) => {
  const [isTopicModalVisible, setIsTopicModalVisible] = useState(false);
  const activeTopic = useMemo(
    () => getAffirmationTopicById(selectedTopicId),
    [selectedTopicId],
  );
  const dailyAffirmationIndex = useMemo(
    () => getDailyIndex(activeTopic.affirmations.length),
    [activeTopic],
  );
  const [activeAffirmationIndex, setActiveAffirmationIndex] = useState(
    dailyAffirmationIndex,
  );
  const totalAffirmations = activeTopic.affirmations.length;

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
    const cards = activeTopic.affirmations;
    if (cards.length === 0) {
      return undefined;
    }

    const safeIndex =
      ((activeAffirmationIndex % cards.length) + cards.length) % cards.length;
    return cards[safeIndex];
  }, [activeAffirmationIndex, activeTopic]);

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
          <Text style={styles.topicPickerButtonText}>Topic: {activeTopic.name}</Text>
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
              <Text style={styles.topicModalTitle}>Select topic</Text>
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
                const isSelected = topic.id === selectedTopicId;

                return (
                  <Pressable
                    key={topic.id}
                    style={[styles.topicCard, isSelected && styles.topicCardSelected]}
                    onPress={() => {
                      onSelectTopic(topic.id);
                      setIsTopicModalVisible(false);
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
