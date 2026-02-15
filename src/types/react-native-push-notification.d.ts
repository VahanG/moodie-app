declare module 'react-native-push-notification' {
  export type NotificationPermissions = {
    alert?: boolean;
    badge?: boolean;
    sound?: boolean;
  };

  export type PushNotificationObject = {
    finish?: (result: string) => void;
  };

  export type PushNotificationConfigureOptions = {
    onNotification: (notification: PushNotificationObject) => void;
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  };

  export type PushNotificationChannel = {
    channelId: string;
    channelName: string;
    importance: number;
    vibrate?: boolean;
  };

  export type PushNotificationSchedule = {
    id?: string;
    channelId?: string;
    title?: string;
    message: string;
    date: Date;
    repeatType?: 'day';
    allowWhileIdle?: boolean;
  };

  export type PushNotificationModule = {
    Importance: {
      HIGH: number;
    };
    configure: (options: PushNotificationConfigureOptions) => void;
    requestPermissions: () => Promise<NotificationPermissions>;
    createChannel: (
      channel: PushNotificationChannel,
      callback: (created: boolean) => void,
    ) => void;
    localNotificationSchedule: (notification: PushNotificationSchedule) => void;
    cancelLocalNotification: (id: string) => void;
  };

  const PushNotification: PushNotificationModule;

  export default PushNotification;
}
