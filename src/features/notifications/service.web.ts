export {
  getEligibleReminderAffirmations,
  selectRandomReminderAffirmation,
} from './content';

export function configureNotificationChannel(_channelName?: string): void {
  // Notification channels are an Android-only concept.
}

export async function requestNotificationPermission(): Promise<boolean> {
  // Daily background scheduling needs a service worker and push backend on web.
  return false;
}

export function scheduleDailyReminder(
  _hour?: number,
  _minute?: number,
  _content?: ReminderNotificationContent,
): ScheduledReminder | null {
  // Daily background scheduling is not configured for the web app.
  return null;
}

export function cancelDailyReminder(): void {
  // Daily background scheduling is not configured for the web app.
}

export function scheduleRandomReminders(): ScheduledReminder[] {
  // Random background scheduling is not configured for the web app.
  return [];
}

export function cancelRandomReminders(): void {
  // Random background scheduling is not configured for the web app.
}
import type { ReminderNotificationContent, ScheduledReminder } from './types';
