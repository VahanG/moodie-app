import type { Session } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseClient, readSupabaseConfig } from '../supabase';

WebBrowser.maybeCompleteAuthSession();

export type AuthUser = {
  id: string;
  email: string | null;
};

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email ?? null,
  };
}

function requireAuthUser(session: Session | null, method: string): AuthUser {
  const user = toAuthUser(session);

  if (!user) {
    throw new Error(`${method} completed without creating a session.`);
  }

  return user;
}

function readOAuthParameter(url: URL, name: string): string | null {
  const queryValue = url.searchParams.get(name);

  if (queryValue) {
    return queryValue;
  }

  return new URLSearchParams(url.hash.replace(/^#/, '')).get(name);
}

async function createSessionFromOAuthUrl(url: string): Promise<AuthUser> {
  const callbackUrl = new URL(url);
  const errorDescription = readOAuthParameter(callbackUrl, 'error_description');
  const errorCode =
    readOAuthParameter(callbackUrl, 'error_code') ??
    readOAuthParameter(callbackUrl, 'error');

  if (errorDescription || errorCode) {
    throw new Error(errorDescription ?? errorCode ?? 'Google sign-in failed.');
  }

  const code = readOAuthParameter(callbackUrl, 'code');

  if (code) {
    const { data, error } =
      await getSupabaseClient().auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    return requireAuthUser(data.session, 'Google sign-in');
  }

  const accessToken = readOAuthParameter(callbackUrl, 'access_token');
  const refreshToken = readOAuthParameter(callbackUrl, 'refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error('Google sign-in returned an invalid callback.');
  }

  const { data, error } = await getSupabaseClient().auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw error;
  }

  return requireAuthUser(data.session, 'Google sign-in');
}

export function isAuthConfigured(): boolean {
  return readSupabaseConfig() !== null;
}

export async function loadAuthUser(): Promise<AuthUser | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw error;
  }

  return toAuthUser(data.session);
}

export function subscribeToAuthUser(
  listener: (user: AuthUser | null) => void,
): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange(
    (_event, session) => listener(toAuthUser(session)),
  );

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string,
): Promise<AuthUser> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return requireAuthUser(data.session, 'Sign-in');
}

export async function sendEmailOtp(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    throw error;
  }
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<AuthUser> {
  const { data, error } = await getSupabaseClient().auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: 'email',
  });

  if (error) {
    throw error;
  }

  return requireAuthUser(data.session, 'Code verification');
}

export async function signInWithGoogle(): Promise<AuthUser | null> {
  const redirectTo = makeRedirectUri({
    scheme: 'moodie-app',
    path: 'auth/callback',
  });
  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error('Google sign-in could not be started.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success') {
    return null;
  }

  return createSessionFromOAuthUrl(result.url);
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();

  if (error) {
    throw error;
  }
}
