import { useEffect } from 'react';
import { readSupabaseConfig } from '../supabase';
import { subscribeToAuthUser } from '../auth';
import { synchronizeCurrentUserSettings } from './service';

export function UserSettingsSynchronizer() {
  useEffect(() => {
    synchronizeCurrentUserSettings().catch(() => undefined);

    let isConfigured = false;
    try {
      isConfigured = readSupabaseConfig() !== null;
    } catch {
      return undefined;
    }

    if (!isConfigured) {
      return undefined;
    }

    return subscribeToAuthUser(() => {
      synchronizeCurrentUserSettings().catch(() => undefined);
    });
  }, []);

  return null;
}
