import React from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import {
  AffirmationTopic,
  AffirmationTopicId,
} from '../features/affirmations/types';
import { useHomeScreenStyles } from './HomeScreen.styles';
import { AppText, ModalSheet } from '../components/ui';
import { useLocalization } from '../features/localization';

type Props = {
  visible: boolean;
  topics: AffirmationTopic[];
  selectedTopicIds: AffirmationTopicId[];
  onClose: () => void;
  onSelectTopics: (topicIds: AffirmationTopicId[]) => Promise<void> | void;
};

const TopicSelectionModal: React.FC<Props> = ({
  visible,
  topics,
  selectedTopicIds,
  onClose,
  onSelectTopics,
}) => {
  const styles = useHomeScreenStyles();
  const { t } = useLocalization();

  return (
    <ModalSheet
      closeTestID="btn-close-topic-selection"
      onClose={onClose}
      testID="modal-topic-selection"
      title={t('topics.title')}
      visible={visible}
    >
      <ScrollView contentContainerStyle={styles.topicList} testID="list-topics">
        {topics.map(topic => {
          const isSelected = selectedTopicIds.includes(topic.id);

          return (
            <Pressable
              key={topic.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={[styles.topicCard, isSelected && styles.topicCardSelected]}
              onPress={() => {
                const nextTopicIds = isSelected
                  ? selectedTopicIds.filter(id => id !== topic.id)
                  : [...selectedTopicIds, topic.id];

                onSelectTopics(nextTopicIds);
              }}
              testID={`item-topic-${topic.id}`}
            >
              <Image
                source={{ uri: topic.imageUri }}
                style={styles.topicCardImage}
                resizeMode="cover"
              />
              <View style={styles.topicCardOverlay}>
                <AppText tone="onImage" variant="heading">
                  {topic.name}
                </AppText>
                {isSelected ? (
                  <AppText tone="onImage" variant="caption">
                    {t('common.selected')}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ModalSheet>
  );
};

export default TopicSelectionModal;
