export type AffirmationTopicId = string;//'growth' | 'calm' | 'gratitude';
export type AffirmationBackgroundId = string;
export type AffirmationBackgroundMode = 'free' | 'fixed';

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

export type AffirmationBackground = {
  id: AffirmationBackgroundId;
  imageUri: string;
  tags: string[];
};

export type AffirmationBackgroundPreference = {
  mode: AffirmationBackgroundMode;
  backgroundId: AffirmationBackgroundId | null;
};
