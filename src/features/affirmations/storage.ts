import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_AFFIRMATION_TOPIC_ID,
  isAffirmationTopicId,
} from './data';
import {
  DEFAULT_AFFIRMATION_BACKGROUND_MODE,
  isAffirmationBackgroundId,
  isAffirmationBackgroundMode,
} from './backgrounds';
import {
  AffirmationBackgroundPreference,
  AffirmationTopicId,
} from './types';

const SELECTED_TOPICS_STORAGE_KEY = '@moodie/selected-affirmation-topic';
const BACKGROUND_PREFERENCE_STORAGE_KEY = '@moodie/affirmation-background-preference';

export const DEFAULT_SELECTED_AFFIRMATION_TOPICS: AffirmationTopicId[] = [
  DEFAULT_AFFIRMATION_TOPIC_ID,
];
export const DEFAULT_AFFIRMATION_BACKGROUND_PREFERENCE: AffirmationBackgroundPreference =
  {
    mode: DEFAULT_AFFIRMATION_BACKGROUND_MODE,
    backgroundId: null,
  };

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

export async function loadAffirmationBackgroundPreference(): Promise<AffirmationBackgroundPreference> {
  const storedValue = await AsyncStorage.getItem(BACKGROUND_PREFERENCE_STORAGE_KEY);

  if (storedValue === null) {
    return DEFAULT_AFFIRMATION_BACKGROUND_PREFERENCE;
  }

  const parsedValue: unknown = JSON.parse(storedValue);
  if (typeof parsedValue !== 'object' || parsedValue === null) {
    throw new Error('Invalid affirmation background preference in storage.');
  }

  const candidate = parsedValue as {
    mode?: unknown;
    backgroundId?: unknown;
  };
  const isValidMode = isAffirmationBackgroundMode(candidate.mode);
  const hasValidBackgroundId =
    candidate.backgroundId === null || isAffirmationBackgroundId(candidate.backgroundId);

  if (!isValidMode || !hasValidBackgroundId) {
    throw new Error('Invalid affirmation background preference in storage.');
  }

  return {
    mode: candidate.mode,
    backgroundId: candidate.backgroundId,
  };
}

export async function saveAffirmationBackgroundPreference(
  preference: AffirmationBackgroundPreference,
): Promise<void> {
  const hasValidBackgroundId =
    preference.backgroundId === null || isAffirmationBackgroundId(preference.backgroundId);

  if (!isAffirmationBackgroundMode(preference.mode) || !hasValidBackgroundId) {
    throw new Error('Invalid affirmation background preference.');
  }

  await AsyncStorage.setItem(
    BACKGROUND_PREFERENCE_STORAGE_KEY,
    JSON.stringify(preference),
  );
}
