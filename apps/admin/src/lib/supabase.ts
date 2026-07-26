import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readPublicSupabaseConfig } from "./config";

let adminClient: SupabaseClient | null = null;

export function getAdminSupabaseClient(): SupabaseClient {
  if (!adminClient) {
    const config = readPublicSupabaseConfig();

    adminClient = createClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    });
  }

  return adminClient;
}
