import type { Session, User } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "./supabase";

export type AdminIdentity = {
  email: string;
  id: string;
};

export function toAdminIdentity(user: User): AdminIdentity {
  return {
    email: user.email ?? "Unknown account",
    id: user.id,
  };
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getAdminSupabaseClient().auth.getSession();

  if (error) {
    throw error;
  }
  return data.session;
}

export async function verifyCurrentAdmin(): Promise<boolean> {
  const { data, error } = await getAdminSupabaseClient().rpc("is_admin");

  if (error) {
    throw error;
  }
  return data === true;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const { error } = await getAdminSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await getAdminSupabaseClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getAdminSupabaseClient().auth.signOut();
  if (error) {
    throw error;
  }
}
