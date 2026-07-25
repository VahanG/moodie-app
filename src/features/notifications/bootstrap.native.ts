import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';

export function configureNotifications(): void {
  PushNotification.configure({
    onNotification(notification) {
      if (typeof notification.finish === 'function') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },
    popInitialNotification: true,
    requestPermissions: false,
  });
}
