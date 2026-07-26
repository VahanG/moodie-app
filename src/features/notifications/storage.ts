import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderPreferences } from './types';

const REMINDER_PREFERENCES_STORAGE_KEY = '@moodie/daily-reminder-preferences';

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  enabled: false,
  hour: 9,
  minute: 0,
};

function isValidReminderPreferences(
  value: unknown,
): value is ReminderPreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ReminderPreferences>;

  return (
    typeof candidate.enabled === 'boolean' &&
    typeof candidate.hour === 'number' &&
    typeof candidate.minute === 'number' &&
    Number.isInteger(candidate.hour) &&
    Number.isInteger(candidate.minute) &&
    candidate.hour >= 0 &&
    candidate.hour <= 23 &&
    candidate.minute >= 0 &&
    candidate.minute <= 59
  );
}

export async function loadReminderPreferences(): Promise<ReminderPreferences> {
  const storedValue = await AsyncStorage.getItem(REMINDER_PREFERENCES_STORAGE_KEY);

  if (storedValue === null) {
    return { ...DEFAULT_REMINDER_PREFERENCES };
  }

  const parsedValue: unknown = JSON.parse(storedValue);

  if (!isValidReminderPreferences(parsedValue)) {
    throw new Error('Invalid reminder preferences found in storage.');
  }

  return parsedValue;
}

export async function saveReminderPreferences(
  preferences: ReminderPreferences,
): Promise<void> {
  await AsyncStorage.setItem(
    REMINDER_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}
