import { AffirmationBackgroundPreference } from '../affirmations/types';
import { ReminderPreferences } from '../notifications/types';
import { ThemePreference } from '../../theme/tokens';

export type UserSettingsSnapshot = {
  languageCode: string;
  themePreference: ThemePreference;
  reminderPreferences: ReminderPreferences;
  selectedTopicIds: string[];
  backgroundPreference: AffirmationBackgroundPreference;
  likedAffirmationKeys: string[];
};

export type UserSettingsSource = 'device' | 'database' | 'pending';

export type SynchronizedUserSettings = {
  settings: UserSettingsSnapshot;
  source: UserSettingsSource;
  userId: string | null;
};
