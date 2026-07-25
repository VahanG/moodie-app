export const SUPABASE_PROJECT_REF = 'vwougnsbyqqeessdkbae';
export const SUPABASE_PROJECT_URL =
  'https://vwougnsbyqqeessdkbae.supabase.co';

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

function readEnvironmentValue(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

function validateSupabaseUrl(value: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL must be a valid absolute URL.',
    );
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL must use the http or https protocol.',
    );
  }

  return parsedUrl.toString().replace(/\/$/, '');
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const url = readEnvironmentValue(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  );
  const publishableKey = readEnvironmentValue(
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!url && !publishableKey) {
    return null;
  }

  if (!url) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL is required when Supabase is configured.',
    );
  }

  if (!publishableKey) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required when Supabase is configured.',
    );
  }

  if (publishableKey === 'replace-with-project-publishable-key') {
    throw new Error(
      'Replace the Supabase publishable-key placeholder before starting the app.',
    );
  }

  return {
    url: validateSupabaseUrl(url),
    publishableKey,
  };
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = readSupabaseConfig();

  if (!config) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set the project publishable key.',
    );
  }

  return config;
}
