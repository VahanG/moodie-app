import { AffirmationContent } from './types';

export type AffirmationContentStatus = 'loading' | 'ready' | 'error';

export const EMPTY_AFFIRMATION_CONTENT: AffirmationContent = {
  topics: [],
  backgrounds: [],
};

export function getAffirmationContentForLanguage(
  content: AffirmationContent,
  contentLanguageCode: string | null,
  selectedLanguageCode: string,
): AffirmationContent {
  return contentLanguageCode === selectedLanguageCode
    ? content
    : EMPTY_AFFIRMATION_CONTENT;
}

export function getAffirmationContentStatusForLanguage(
  status: AffirmationContentStatus,
  statusLanguageCode: string | null,
  selectedLanguageCode: string,
): AffirmationContentStatus {
  return statusLanguageCode === selectedLanguageCode ? status : 'loading';
}
