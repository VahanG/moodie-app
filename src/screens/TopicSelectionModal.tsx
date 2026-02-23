import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { AFFIRMATION_TOPICS } from '../features/affirmations/data';
import { AffirmationTopicId } from '../features/affirmations/types';
import styles from './HomeScreen.styles';

type Props = {
  visible: boolean;
  selectedTopicIds: AffirmationTopicId[];
  onClose: () => void;
  onSelectTopics: (topicIds: AffirmationTopicId[]) => Promise<void> | void;
};

const TopicSelectionModal: React.FC<Props> = ({
  visible,
  selectedTopicIds,
  onClose,
  onSelectTopics,
}) => (
  <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
    <View style={styles.topicModalBackdrop}>
      <View style={styles.topicModalSheet}>
        <View style={styles.topicModalHeader}>
          <Text style={styles.topicModalTitle}>Select topics</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.topicModalCloseText}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.topicList}>
          {AFFIRMATION_TOPICS.map(topic => {
            const isSelected = selectedTopicIds.includes(topic.id);

            return (
              <Pressable
                key={topic.id}
                style={[styles.topicCard, isSelected && styles.topicCardSelected]}
                onPress={() => {
                  const nextTopicIds = isSelected
                    ? selectedTopicIds.filter(id => id !== topic.id)
                    : [...selectedTopicIds, topic.id];

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
);

export default TopicSelectionModal;
