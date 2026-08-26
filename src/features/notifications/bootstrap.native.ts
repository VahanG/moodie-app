import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import { handleNotificationInteraction } from './openedAffirmation';

export function configureNotifications(): void {
  PushNotification.configure({
    onNotification(notification) {
      handleNotificationInteraction(notification);

      if (typeof notification.finish === 'function') {
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      }
    },
    popInitialNotification: true,
    requestPermissions: false,
  });
}
