import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  processLock,
  SupabaseClient,
} from '@supabase/supabase-js';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  readSupabaseConfig,
  requireSupabaseConfig,
  SupabaseConfig,
} from './config';

let client: SupabaseClient | null = null;

function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      lock: processLock,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(requireSupabaseConfig());
  }

  return client;
}

export function initializeSupabase(): () => void {
  const config = readSupabaseConfig();

  if (!config) {
    return () => {};
  }

  const supabase = getSupabaseClient();

  if (Platform.OS === 'web') {
    return () => {};
  }

  const updateAutoRefresh = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
      return;
    }

    supabase.auth.stopAutoRefresh();
  };

  updateAutoRefresh(AppState.currentState);
  const subscription = AppState.addEventListener(
    'change',
    updateAutoRefresh,
  );

  return () => {
    subscription.remove();
    supabase.auth.stopAutoRefresh();
  };
}

export async function verifySupabaseConnection(): Promise<void> {
  const config = requireSupabaseConfig();
  const response = await fetch(`${config.url}/auth/v1/settings`, {
    headers: {
      apikey: config.publishableKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase connectivity check failed with status ${response.status}.`,
    );
  }
}
