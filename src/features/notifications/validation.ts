import { RandomReminderRange } from './types';

export const MIN_RANDOM_REMINDER_SPACING_MINUTES = 60;

export function isValidReminderTime(hour: number, minute: number): boolean {
  return (
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

export function reminderTimeToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function getRandomReminderRangeDurationMinutes(
  range: RandomReminderRange,
): number {
  return (
    reminderTimeToMinutes(range.randomEndHour, range.randomEndMinute) -
    reminderTimeToMinutes(range.randomStartHour, range.randomStartMinute)
  );
}

export function getMinimumRandomReminderRangeMinutes(
  notificationsPerDay: number,
): number {
  return notificationsPerDay * MIN_RANDOM_REMINDER_SPACING_MINUTES;
}

export function isValidRandomReminderRange(
  range: RandomReminderRange,
  notificationsPerDay: number,
): boolean {
  return (
    Number.isInteger(notificationsPerDay) &&
    notificationsPerDay > 0 &&
    isValidReminderTime(range.randomStartHour, range.randomStartMinute) &&
    isValidReminderTime(range.randomEndHour, range.randomEndMinute) &&
    getRandomReminderRangeDurationMinutes(range) >=
      getMinimumRandomReminderRangeMinutes(notificationsPerDay)
  );
}
