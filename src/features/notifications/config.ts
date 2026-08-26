import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient, readSupabaseConfig } from '../supabase';

const RANDOM_REMINDER_CONFIG_CACHE_KEY = '@moodie/random-reminder-config-v1';

export const MIN_RANDOM_REMINDERS_PER_DAY = 1;
export const MAX_RANDOM_REMINDERS_PER_DAY = 8;

export type RandomReminderConfig = {
  notificationsPerDay: number;
};

export const DEFAULT_RANDOM_REMINDER_CONFIG: RandomReminderConfig = {
  notificationsPerDay: 3,
};

type NotificationSettingsRow = {
  random_reminders_per_day: unknown;
};

export function parseRandomReminderConfig(
  value: unknown,
): RandomReminderConfig {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid random reminder configuration.');
  }

  const count = (value as Partial<RandomReminderConfig>).notificationsPerDay;
  if (
    !Number.isInteger(count) ||
    (count as number) < MIN_RANDOM_REMINDERS_PER_DAY ||
    (count as number) > MAX_RANDOM_REMINDERS_PER_DAY
  ) {
    throw new Error('Invalid random reminder configuration.');
  }

  return { notificationsPerDay: count as number };
}

function parseNotificationSettingsRow(
  row: NotificationSettingsRow,
): RandomReminderConfig {
  return parseRandomReminderConfig({
    notificationsPerDay: row.random_reminders_per_day,
  });
}

async function loadCachedConfig(): Promise<RandomReminderConfig> {
  const cached = await AsyncStorage.getItem(RANDOM_REMINDER_CONFIG_CACHE_KEY);
  return cached
    ? parseRandomReminderConfig(JSON.parse(cached) as unknown)
    : { ...DEFAULT_RANDOM_REMINDER_CONFIG };
}

export async function loadRandomReminderConfig(): Promise<RandomReminderConfig> {
  try {
    if (!readSupabaseConfig()) {
      return await loadCachedConfig();
    }

    const { data, error } = await getSupabaseClient()
      .from('notification_delivery_settings')
      .select('random_reminders_per_day')
      .eq('id', 'global')
      .single();
    if (error) throw error;

    const config = parseNotificationSettingsRow(
      data as NotificationSettingsRow,
    );
    await AsyncStorage.setItem(
      RANDOM_REMINDER_CONFIG_CACHE_KEY,
      JSON.stringify(config),
    ).catch(() => undefined);
    return config;
  } catch {
    try {
      return await loadCachedConfig();
    } catch {
      return { ...DEFAULT_RANDOM_REMINDER_CONFIG };
    }
  }
}
