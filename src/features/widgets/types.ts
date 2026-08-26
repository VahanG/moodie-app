export type WidgetAffirmation = {
  id: string;
  text: string;
};

export type WidgetScheduledAffirmation = WidgetAffirmation & {
  deliveryAt: number;
  repeatsDaily?: boolean;
};

export type AffirmationWidgetPayload = {
  version: 1;
  notificationsEnabled: boolean;
  affirmations: WidgetAffirmation[];
  scheduledNotifications: WidgetScheduledAffirmation[];
  lastNotification: WidgetScheduledAffirmation | null;
  updatedAt: number;
};
