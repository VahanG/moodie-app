/**
 * @format
 */

import { AppRegistry } from 'react-native';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import App from './App';
import { name as appName } from './app.json';

PushNotification.configure({
  onNotification(notification) {
    if (typeof notification.finish === 'function') {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  },
  popInitialNotification: true,
  requestPermissions: false,
});

AppRegistry.registerComponent(appName, () => App);
