import type {
  AffirmationTopic,
  AffirmationTopicId,
} from '../affirmations/types';

export function getEligibleReminderAffirmations(
  topics: AffirmationTopic[],
  selectedTopicIds: AffirmationTopicId[],
): ReminderAffirmation[] {
  const selectedTopicIdSet = new Set(selectedTopicIds);
  const eligibleTopics =
    selectedTopicIdSet.size > 0
      ? topics.filter(topic => selectedTopicIdSet.has(topic.id))
      : topics;

  return eligibleTopics.flatMap(topic =>
    topic.affirmations.flatMap(affirmation => {
      const id = affirmation.id.trim();
      const text = affirmation.text.trim();
      return id && text ? [{ id, text }] : [];
    }),
  );
}

export type ReminderAffirmation = {
  id: string;
  text: string;
};

export function selectRandomReminderAffirmation(
  affirmations: ReminderAffirmation[],
  random: () => number = Math.random,
): ReminderAffirmation | null {
  const availableAffirmations = affirmations
    .map(affirmation => ({
      ...affirmation,
      text: affirmation.text.trim(),
    }))
    .filter(
      affirmation => affirmation.id.length > 0 && affirmation.text.length > 0,
    );

  if (availableAffirmations.length === 0) {
    return null;
  }

  const randomValue = random();
  const normalizedRandomValue = Number.isFinite(randomValue)
    ? Math.min(Math.max(randomValue, 0), 1)
    : 0;
  const selectedIndex = Math.min(
    availableAffirmations.length - 1,
    Math.floor(normalizedRandomValue * availableAffirmations.length),
  );

  return availableAffirmations[selectedIndex];
}
