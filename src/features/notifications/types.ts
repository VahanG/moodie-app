export type ReminderPreferences = {
  enabled: boolean;
  hour: number;
  minute: number;
  randomEnabled: boolean;
  randomStartHour: number;
  randomStartMinute: number;
  randomEndHour: number;
  randomEndMinute: number;
};

export type RandomReminderRange = Pick<
  ReminderPreferences,
  'randomStartHour' | 'randomStartMinute' | 'randomEndHour' | 'randomEndMinute'
>;

export type ReminderNotificationContent = {
  title: string;
  message: string;
  affirmationId?: string;
};

export type ScheduledReminder = {
  affirmationId: string;
  text: string;
  deliveryAt: number;
  repeatsDaily?: boolean;
};
