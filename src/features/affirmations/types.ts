export type AffirmationTopicId = string; //'growth' | 'calm' | 'gratitude';
export type AffirmationBackgroundId = string;
export type AffirmationBackgroundMode = 'free' | 'fixed';

export type AffirmationCard = {
  id: string;
  imageUri: string;
  text: string;
};

export type AffirmationTopic = {
  id: AffirmationTopicId;
  name: string | null;
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

export type AffirmationContent = {
  topics: AffirmationTopic[];
  backgrounds: AffirmationBackground[];
};

export type AffirmationContentSource = 'remote' | 'cache';

export type LoadedAffirmationContent = {
  content: AffirmationContent;
  source: AffirmationContentSource;
};
