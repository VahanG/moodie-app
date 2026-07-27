import {
  clearPendingUserSettings,
  loadDeviceUserSettings,
  loadPendingUserSettings,
  saveDeviceUserSettings,
  savePendingUserSettings,
} from './device';
import {
  getCurrentUserId,
  loadDatabaseUserSettings,
  upsertDatabaseUserSettings,
} from './remote';
import { SynchronizedUserSettings, UserSettingsSnapshot } from './types';

type SettingsListener = (settings: UserSettingsSnapshot) => void;

const listeners = new Set<SettingsListener>();
let latestSettings: UserSettingsSnapshot | null = null;
let synchronization: Promise<SynchronizedUserSettings> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function publish(settings: UserSettingsSnapshot): void {
  latestSettings = settings;
  listeners.forEach(listener => listener(settings));
}

export function subscribeToUserSettings(
  listener: SettingsListener,
): () => void {
  listeners.add(listener);
  if (latestSettings) {
    listener(latestSettings);
  }

  return () => {
    listeners.delete(listener);
  };
}

async function synchronize(): Promise<SynchronizedUserSettings> {
  const deviceSettings = await loadDeviceUserSettings();
  let userId: string | null;

  try {
    userId = await getCurrentUserId();
  } catch {
    publish(deviceSettings);
    return { settings: deviceSettings, source: 'device', userId: null };
  }

  if (!userId) {
    publish(deviceSettings);
    return { settings: deviceSettings, source: 'device', userId: null };
  }

  const pending = await loadPendingUserSettings();
  if (pending?.userId === userId) {
    try {
      await upsertDatabaseUserSettings(userId, pending.settings);
      await clearPendingUserSettings();
    } catch {
      // Keep the current user's pending snapshot for the next retry.
    }
    await saveDeviceUserSettings(pending.settings);
    publish(pending.settings);
    return { settings: pending.settings, source: 'pending', userId };
  }

  try {
    const databaseSettings = await loadDatabaseUserSettings(userId);
    if (databaseSettings) {
      await saveDeviceUserSettings(databaseSettings);
      publish(databaseSettings);
      return { settings: databaseSettings, source: 'database', userId };
    }

    await upsertDatabaseUserSettings(userId, deviceSettings);
  } catch {
    publish(deviceSettings);
    return { settings: deviceSettings, source: 'device', userId };
  }

  publish(deviceSettings);
  return { settings: deviceSettings, source: 'device', userId };
}

export function synchronizeCurrentUserSettings(): Promise<SynchronizedUserSettings> {
  if (!synchronization) {
    synchronization = synchronize().finally(() => {
      synchronization = null;
    });
  }

  return synchronization;
}

async function writeCurrentDeviceSettingsToDatabase(): Promise<void> {
  const settings = await loadDeviceUserSettings();
  publish(settings);

  let userId: string | null;
  try {
    userId = await getCurrentUserId();
  } catch {
    return;
  }

  if (!userId) {
    return;
  }

  await savePendingUserSettings({ userId, settings });
  try {
    await upsertDatabaseUserSettings(userId, settings);
    await clearPendingUserSettings();
  } catch {
    // Local state remains active and the user-scoped snapshot will retry.
  }
}

export function syncCurrentDeviceSettingsToDatabase(): Promise<void> {
  const write = writeQueue.then(writeCurrentDeviceSettingsToDatabase);
  writeQueue = write.catch(() => undefined);
  return write;
}
