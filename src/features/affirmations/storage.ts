import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_AFFIRMATION_TOPIC_ID,
  isAffirmationTopicId,
} from './data';
import { AffirmationTopicId } from './types';

const SELECTED_TOPICS_STORAGE_KEY = '@moodie/selected-affirmation-topic';

export const DEFAULT_SELECTED_AFFIRMATION_TOPICS: AffirmationTopicId[] = [
  DEFAULT_AFFIRMATION_TOPIC_ID,
];

function getUniqueTopicIds(topicIds: AffirmationTopicId[]): AffirmationTopicId[] {
  return [...new Set(topicIds)];
}

export async function loadSelectedAffirmationTopics(): Promise<AffirmationTopicId[]> {
  const storedValue = await AsyncStorage.getItem(SELECTED_TOPICS_STORAGE_KEY);

  if (storedValue === null) {
    return DEFAULT_SELECTED_AFFIRMATION_TOPICS;
  }

  const parsedValue: unknown = JSON.parse(storedValue);

  if (isAffirmationTopicId(parsedValue)) {
    return [parsedValue];
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error('Invalid affirmation topic found in storage.');
  }

  const validTopicIds = getUniqueTopicIds(parsedValue.filter(isAffirmationTopicId));
  return validTopicIds;
}

export async function saveSelectedAffirmationTopics(
  topicIds: AffirmationTopicId[],
): Promise<void> {
  const uniqueTopicIds = getUniqueTopicIds(topicIds);

  await AsyncStorage.setItem(
    SELECTED_TOPICS_STORAGE_KEY,
    JSON.stringify(uniqueTopicIds),
  );
}
