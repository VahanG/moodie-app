import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_AFFIRMATION_TOPIC_ID,
  isAffirmationTopicId,
} from './data';
import { AffirmationTopicId } from './types';

const SELECTED_TOPIC_STORAGE_KEY = '@moodie/selected-affirmation-topic';

export const DEFAULT_SELECTED_AFFIRMATION_TOPIC = DEFAULT_AFFIRMATION_TOPIC_ID;

export async function loadSelectedAffirmationTopic(): Promise<AffirmationTopicId> {
  const storedValue = await AsyncStorage.getItem(SELECTED_TOPIC_STORAGE_KEY);

  if (storedValue === null) {
    return DEFAULT_SELECTED_AFFIRMATION_TOPIC;
  }

  const parsedValue: unknown = JSON.parse(storedValue);

  if (!isAffirmationTopicId(parsedValue)) {
    throw new Error('Invalid affirmation topic found in storage.');
  }

  return parsedValue;
}

export async function saveSelectedAffirmationTopic(
  topicId: AffirmationTopicId,
): Promise<void> {
  await AsyncStorage.setItem(SELECTED_TOPIC_STORAGE_KEY, JSON.stringify(topicId));
}
