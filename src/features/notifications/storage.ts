import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderPreferences } from './types';

const REMINDER_PREFERENCES_STORAGE_KEY = '@moodie/daily-reminder-preferences';

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: false,
  hour: 9,
  minute: 0,
  randomEnabled: false,
  randomStartHour: 9,
  randomStartMinute: 0,
  randomEndHour: 17,
  randomEndMinute: 0,
};

const RANDOM_PREFERENCE_FIELDS = [
  'randomEnabled',
  'randomStartHour',
  'randomStartMinute',
  'randomEndHour',
  'randomEndMinute',
] as const;

export function parseReminderPreferences(
  value: unknown,
): ReminderPreferences | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const candidate = value as Partial<ReminderPreferences>;
  const hasValidFixedPreference =
    typeof candidate.enabled === 'boolean' &&
    typeof candidate.hour === 'number' &&
    typeof candidate.minute === 'number' &&
    Number.isInteger(candidate.hour) &&
    Number.isInteger(candidate.minute) &&
    candidate.hour >= 0 &&
    candidate.hour <= 23 &&
    candidate.minute >= 0 &&
    candidate.minute <= 59;

  if (!hasValidFixedPreference) {
    return null;
  }

  const missingRandomFieldCount = RANDOM_PREFERENCE_FIELDS.filter(
    field => candidate[field] === undefined,
  ).length;
  if (missingRandomFieldCount === RANDOM_PREFERENCE_FIELDS.length) {
    return {
      enabled: candidate.enabled as boolean,
      hour: candidate.hour as number,
      minute: candidate.minute as number,
      randomEnabled: DEFAULT_REMINDER_PREFERENCES.randomEnabled,
      randomStartHour: DEFAULT_REMINDER_PREFERENCES.randomStartHour,
      randomStartMinute: DEFAULT_REMINDER_PREFERENCES.randomStartMinute,
      randomEndHour: DEFAULT_REMINDER_PREFERENCES.randomEndHour,
      randomEndMinute: DEFAULT_REMINDER_PREFERENCES.randomEndMinute,
    };
  }

  if (missingRandomFieldCount > 0) {
    return null;
  }

  const complete = candidate as ReminderPreferences;
  const startMinutes =
    complete.randomStartHour * 60 + complete.randomStartMinute;
  const endMinutes = complete.randomEndHour * 60 + complete.randomEndMinute;
  const hasValidRandomPreference =
    typeof complete.randomEnabled === 'boolean' &&
    Number.isInteger(complete.randomStartHour) &&
    Number.isInteger(complete.randomStartMinute) &&
    Number.isInteger(complete.randomEndHour) &&
    Number.isInteger(complete.randomEndMinute) &&
    complete.randomStartHour >= 0 &&
    complete.randomStartHour <= 23 &&
    complete.randomStartMinute >= 0 &&
    complete.randomStartMinute <= 59 &&
    complete.randomEndHour >= 0 &&
    complete.randomEndHour <= 23 &&
    complete.randomEndMinute >= 0 &&
    complete.randomEndMinute <= 59 &&
    endMinutes > startMinutes &&
    !(complete.enabled && complete.randomEnabled);

  return hasValidRandomPreference ? complete : null;
}

export async function loadReminderPreferences(): Promise<ReminderPreferences> {
  const storedValue = await AsyncStorage.getItem(
    REMINDER_PREFERENCES_STORAGE_KEY,
  );

  if (storedValue === null) {
    return { ...DEFAULT_REMINDER_PREFERENCES };
  }

  const parsedValue: unknown = JSON.parse(storedValue);

  const preferences = parseReminderPreferences(parsedValue);
  if (!preferences) {
    throw new Error('Invalid reminder preferences found in storage.');
  }

  return preferences;
}

export async function saveReminderPreferences(
  preferences: ReminderPreferences,
): Promise<void> {
  await AsyncStorage.setItem(
    REMINDER_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}
