import { getSupabaseClient, readSupabaseConfig } from '../supabase';
import { UserSettingsSnapshot } from './types';

type SettingsRow = {
  user_id: unknown;
  language_code: unknown;
  theme_preference: unknown;
  reminder_enabled: unknown;
  reminder_hour: unknown;
  reminder_minute: unknown;
  selected_topic_ids: unknown;
  background_mode: unknown;
  background_id: unknown;
  liked_affirmation_keys: unknown;
};

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
    throw new Error(`Invalid ${field} in database user settings.`);
  }

  return [...new Set(value)];
}

export function parseUserSettingsRow(row: SettingsRow): UserSettingsSnapshot {
  if (
    typeof row.language_code !== 'string' ||
    !/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(row.language_code)
  ) {
    throw new Error('Invalid language in database user settings.');
  }
  const themePreference = row.theme_preference;
  const backgroundMode = row.background_mode;

  if (
    themePreference !== 'system' &&
    themePreference !== 'light' &&
    themePreference !== 'dark'
  ) {
    throw new Error('Invalid theme preference in database user settings.');
  }
  if (backgroundMode !== 'free' && backgroundMode !== 'fixed') {
    throw new Error('Invalid background mode in database user settings.');
  }
  if (
    typeof row.reminder_enabled !== 'boolean' ||
    !Number.isInteger(row.reminder_hour) ||
    !Number.isInteger(row.reminder_minute) ||
    (row.reminder_hour as number) < 0 ||
    (row.reminder_hour as number) > 23 ||
    (row.reminder_minute as number) < 0 ||
    (row.reminder_minute as number) > 59
  ) {
    throw new Error('Invalid reminder preferences in database user settings.');
  }
  if (
    row.background_id !== null &&
    (typeof row.background_id !== 'string' ||
      row.background_id.trim().length === 0)
  ) {
    throw new Error('Invalid background in database user settings.');
  }
  if (backgroundMode === 'fixed' && row.background_id === null) {
    throw new Error(
      'A fixed background is missing from database user settings.',
    );
  }

  return {
    languageCode: row.language_code,
    themePreference,
    reminderPreferences: {
      enabled: row.reminder_enabled,
      hour: row.reminder_hour as number,
      minute: row.reminder_minute as number,
    },
    selectedTopicIds: parseStringArray(
      row.selected_topic_ids,
      'selected topics',
    ),
    backgroundPreference: {
      mode: backgroundMode,
      backgroundId: row.background_id as string | null,
    },
    likedAffirmationKeys: parseStringArray(
      row.liked_affirmation_keys,
      'liked affirmations',
    ),
  };
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!readSupabaseConfig()) {
    return null;
  }

  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) {
    throw error;
  }

  return data.session?.user.id ?? null;
}

export async function loadDatabaseUserSettings(
  userId: string,
): Promise<UserSettingsSnapshot | null> {
  const { data, error } = await getSupabaseClient()
    .from('user_settings')
    .select(
      'user_id,language_code,theme_preference,reminder_enabled,reminder_hour,reminder_minute,selected_topic_ids,background_mode,background_id,liked_affirmation_keys',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? parseUserSettingsRow(data as SettingsRow) : null;
}

export async function upsertDatabaseUserSettings(
  userId: string,
  settings: UserSettingsSnapshot,
): Promise<void> {
  const { error } = await getSupabaseClient().from('user_settings').upsert(
    {
      user_id: userId,
      language_code: settings.languageCode,
      theme_preference: settings.themePreference,
      reminder_enabled: settings.reminderPreferences.enabled,
      reminder_hour: settings.reminderPreferences.hour,
      reminder_minute: settings.reminderPreferences.minute,
      selected_topic_ids: settings.selectedTopicIds,
      background_mode: settings.backgroundPreference.mode,
      background_id: settings.backgroundPreference.backgroundId,
      liked_affirmation_keys: settings.likedAffirmationKeys,
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw error;
  }
}
