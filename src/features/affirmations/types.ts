export type AffirmationTopicId = 'growth' | 'calm' | 'gratitude';

export type AffirmationCard = {
  imageUri: string;
  text: string;
};

export type AffirmationTopic = {
  id: AffirmationTopicId;
  name: string;
  imageUri: string;
  affirmations: AffirmationCard[];
};
