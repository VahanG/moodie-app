export function configureNotificationChannel(): void {
  // Notification channels are an Android-only concept.
}

export async function requestNotificationPermission(): Promise<boolean> {
  // Daily background scheduling needs a service worker and push backend on web.
  return false;
}

export function scheduleDailyReminder(): void {
  // Daily background scheduling is not configured for the web app.
}

export function cancelDailyReminder(): void {
  // Daily background scheduling is not configured for the web app.
}
