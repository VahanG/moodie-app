/**
 * @format
 */

import { registerRootComponent } from 'expo';
import App from './App';
import { configureNotifications } from './src/features/notifications/bootstrap';

configureNotifications();

registerRootComponent(App);
