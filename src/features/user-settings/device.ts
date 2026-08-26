import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadAffirmationBackgroundPreference,
  loadLikedAffirmationKeys,
  loadSelectedAffirmationTopics,
  saveAffirmationBackgroundPreference,
  saveLikedAffirmationKeys,
  saveSelectedAffirmationTopics,
} from '../affirmations/storage';
import {
  loadReminderPreferences,
  parseReminderPreferences,
  saveReminderPreferences,
} from '../notifications/storage';
import { loadThemePreference, saveThemePreference } from '../../theme/storage';
import { loadLanguageCode, saveLanguageCode } from '../localization/storage';
import { UserSettingsSnapshot } from './types';

const PENDING_USER_SETTINGS_KEY = '@moodie/pending-user-settings-v1';

type PendingUserSettings = {
  userId: string;
  settings: UserSettingsSnapshot;
};

export async function loadDeviceUserSettings(): Promise<UserSettingsSnapshot> {
  const [
    languageCode,
    themePreference,
    reminderPreferences,
    selectedTopicIds,
    backgroundPreference,
    likedAffirmationKeys,
  ] = await Promise.all([
    loadLanguageCode(),
    loadThemePreference(),
    loadReminderPreferences(),
    loadSelectedAffirmationTopics(),
    loadAffirmationBackgroundPreference(),
    loadLikedAffirmationKeys(),
  ]);

  return {
    languageCode,
    themePreference,
    reminderPreferences,
    selectedTopicIds,
    backgroundPreference,
    likedAffirmationKeys,
  };
}

export async function saveDeviceUserSettings(
  settings: UserSettingsSnapshot,
): Promise<void> {
  await Promise.all([
    saveLanguageCode(settings.languageCode),
    saveThemePreference(settings.themePreference),
    saveReminderPreferences(settings.reminderPreferences),
    saveSelectedAffirmationTopics(settings.selectedTopicIds),
    saveAffirmationBackgroundPreference(settings.backgroundPreference),
    saveLikedAffirmationKeys(settings.likedAffirmationKeys),
  ]);
}

export async function loadPendingUserSettings(): Promise<PendingUserSettings | null> {
  const storedValue = await AsyncStorage.getItem(PENDING_USER_SETTINGS_KEY);
  if (storedValue === null) {
    return null;
  }

  const parsed: unknown = JSON.parse(storedValue);
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const candidate = parsed as {
    userId?: unknown;
    settings?: unknown;
  };
  if (
    typeof candidate.userId !== 'string' ||
    typeof candidate.settings !== 'object' ||
    candidate.settings === null
  ) {
    return null;
  }

  const pendingSettings = candidate.settings as Partial<UserSettingsSnapshot>;
  const reminderPreferences = parseReminderPreferences(
    pendingSettings.reminderPreferences,
  );
  if (!reminderPreferences) {
    return null;
  }

  return {
    userId: candidate.userId,
    settings: {
      ...pendingSettings,
      reminderPreferences,
    } as UserSettingsSnapshot,
  };
}

export async function savePendingUserSettings(
  pending: PendingUserSettings,
): Promise<void> {
  await AsyncStorage.setItem(
    PENDING_USER_SETTINGS_KEY,
    JSON.stringify(pending),
  );
}

export async function clearPendingUserSettings(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_USER_SETTINGS_KEY);
}
