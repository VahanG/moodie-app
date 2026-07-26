export type PublicSupabaseConfig = {
  publishableKey: string;
  url: string;
};

function readValue(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function validateUrl(value: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("VITE_SUPABASE_URL must be a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("VITE_SUPABASE_URL must use http or https.");
  }

  return url.toString().replace(/\/$/, "");
}

export function readPublicSupabaseConfig(): PublicSupabaseConfig {
  const url =
    readValue(import.meta.env.VITE_SUPABASE_URL) ??
    readValue(import.meta.env.EXPO_PUBLIC_SUPABASE_URL);
  const publishableKey =
    readValue(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) ??
    readValue(import.meta.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!url || !publishableKey) {
    throw new Error(
      "Admin authentication is not configured. Add the public Supabase URL and publishable key.",
    );
  }

  if (publishableKey === "replace-with-project-publishable-key") {
    throw new Error(
      "Replace the Supabase publishable-key placeholder before starting the admin app.",
    );
  }

  return {
    url: validateUrl(url),
    publishableKey,
  };
}
