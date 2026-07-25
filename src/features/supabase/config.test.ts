import {
  readSupabaseConfig,
  requireSupabaseConfig,
  SUPABASE_PROJECT_URL,
} from './config';

const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalPublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    originalPublishableKey;
});

test('returns null when Supabase is not configured', () => {
  delete process.env.EXPO_PUBLIC_SUPABASE_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  expect(readSupabaseConfig()).toBeNull();
});

test('reads a complete Supabase configuration', () => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = `${SUPABASE_PROJECT_URL}/`;
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-test-key';

  expect(requireSupabaseConfig()).toEqual({
    url: SUPABASE_PROJECT_URL,
    publishableKey: 'publishable-test-key',
  });
});

test('rejects a partially configured Supabase environment', () => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_PROJECT_URL;
  delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  expect(readSupabaseConfig).toThrow(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required',
  );
});

test('rejects the committed publishable-key placeholder', () => {
  process.env.EXPO_PUBLIC_SUPABASE_URL = SUPABASE_PROJECT_URL;
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
    'replace-with-project-publishable-key';

  expect(readSupabaseConfig).toThrow('Replace the Supabase publishable-key');
});
