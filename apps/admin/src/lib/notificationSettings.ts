import { getAdminSupabaseClient } from './supabase';

export const MIN_RANDOM_REMINDERS_PER_DAY = 1;
export const MAX_RANDOM_REMINDERS_PER_DAY = 8;

export type AdminNotificationSettings = {
  randomRemindersPerDay: number;
  updatedAt: string;
};

type NotificationSettingsRow = {
  random_reminders_per_day: unknown;
  updated_at: unknown;
};

export function parseRandomRemindersPerDay(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < MIN_RANDOM_REMINDERS_PER_DAY ||
    (value as number) > MAX_RANDOM_REMINDERS_PER_DAY
  ) {
    throw new Error(
      `Random reminders per day must be an integer from ${MIN_RANDOM_REMINDERS_PER_DAY} through ${MAX_RANDOM_REMINDERS_PER_DAY}.`,
    );
  }

  return value as number;
}

function parseNotificationSettingsRow(
  row: NotificationSettingsRow,
): AdminNotificationSettings {
  if (typeof row.updated_at !== 'string') {
    throw new Error('Notification settings have an invalid update time.');
  }

  return {
    randomRemindersPerDay: parseRandomRemindersPerDay(
      row.random_reminders_per_day,
    ),
    updatedAt: row.updated_at,
  };
}

export async function loadAdminNotificationSettings(): Promise<AdminNotificationSettings> {
  const { data, error } = await getAdminSupabaseClient()
    .from('notification_delivery_settings')
    .select('random_reminders_per_day,updated_at')
    .eq('id', 'global')
    .single();

  if (error) throw new Error(error.message);
  return parseNotificationSettingsRow(data as NotificationSettingsRow);
}

export async function saveAdminNotificationSettings(
  randomRemindersPerDay: number,
): Promise<AdminNotificationSettings> {
  const validatedCount = parseRandomRemindersPerDay(randomRemindersPerDay);
  const { data, error } = await getAdminSupabaseClient()
    .from('notification_delivery_settings')
    .update({ random_reminders_per_day: validatedCount })
    .eq('id', 'global')
    .select('random_reminders_per_day,updated_at')
    .single();

  if (error) throw new Error(error.message);
  return parseNotificationSettingsRow(data as NotificationSettingsRow);
}
