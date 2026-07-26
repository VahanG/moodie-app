import { getSupabaseClient } from '../supabase';

export async function loadAdminStatus(): Promise<boolean> {
  const { data, error } = await getSupabaseClient().rpc('is_admin');

  if (error) {
    throw error;
  }

  return data === true;
}
