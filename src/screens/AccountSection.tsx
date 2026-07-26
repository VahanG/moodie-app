import React, { useCallback, useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, View } from 'react-native';
import {
  AuthUser,
  isAuthConfigured,
  loadAuthUser,
  sendEmailOtp,
  signInWithEmailAndPassword,
  signInWithGoogle,
  signOut,
  subscribeToAuthUser,
  verifyEmailOtp,
} from '../features/auth';
import { loadAdminStatus } from '../features/admin';
import {
  AppButton,
  AppText,
  AppTextField,
  Card,
  SettingsSectionHeader,
} from '../components/ui';
import { useTheme } from '../theme';
import { useSettingsPanelStyles } from './SettingsPanel.styles';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const AccountSection: React.FC = () => {
  const styles = useSettingsPanelStyles();
  const { theme } = useTheme();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConfigured] = useState(() => {
    try {
      return isAuthConfigured();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;
    const unsubscribe = subscribeToAuthUser(nextUser => {
      if (isMounted) {
        setUser(nextUser);
        setIsLoading(false);
      }
    });

    loadAuthUser()
      .then(nextUser => {
        if (isMounted) {
          setUser(nextUser);
        }
      })
      .catch(error => {
        if (isMounted) {
          setStatusMessage(
            getErrorMessage(error, 'Could not load your account session.'),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isConfigured]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return undefined;
    }

    let isMounted = true;
    setIsAdmin(false);
    setIsAdminLoading(true);

    loadAdminStatus()
      .then(nextIsAdmin => {
        if (isMounted) {
          setIsAdmin(nextIsAdmin);
        }
      })
      .catch(error => {
        if (isMounted) {
          setIsAdmin(false);
          setStatusMessage(
            getErrorMessage(error, 'Could not verify admin access.'),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsAdminLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSignIn = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setStatusMessage('Enter both your email and password.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const nextUser = await signInWithEmailAndPassword(
        normalizedEmail,
        password,
      );
      setUser(nextUser);
      setPassword('');
    } catch (error) {
      setStatusMessage(getErrorMessage(error, 'Could not sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password]);

  const handleSendOtp = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setStatusMessage('Enter your email to receive a sign-in code.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await sendEmailOtp(normalizedEmail);
      setIsOtpSent(true);
      setOtp('');
      setStatusMessage('Check your email for the six-digit sign-in code.');
    } catch (error) {
      setStatusMessage(
        getErrorMessage(error, 'Could not send a sign-in code.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  const handleVerifyOtp = useCallback(async () => {
    const normalizedEmail = email.trim();
    const normalizedOtp = otp.trim();

    if (!normalizedEmail || normalizedOtp.length !== 6) {
      setStatusMessage('Enter the six-digit code from your email.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const nextUser = await verifyEmailOtp(normalizedEmail, normalizedOtp);
      setUser(nextUser);
      setOtp('');
      setIsOtpSent(false);
    } catch (error) {
      setStatusMessage(getErrorMessage(error, 'Could not verify the code.'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, otp]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const nextUser = await signInWithGoogle();

      if (!nextUser) {
        setStatusMessage('Google sign-in was canceled.');
        return;
      }

      setUser(nextUser);
    } catch (error) {
      setStatusMessage(
        getErrorMessage(error, 'Could not sign in with Google.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setIsOtpSent(false);
    setOtp('');
    setStatusMessage(null);
  }, []);

  const selectAuthMode = useCallback((mode: 'password' | 'otp') => {
    setAuthMode(mode);
    setPassword('');
    setOtp('');
    setIsOtpSent(false);
    setStatusMessage(null);
  }, []);

  const handleSignOut = useCallback(async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await signOut();
      setUser(null);
      setEmail('');
      setPassword('');
      setOtp('');
      setIsOtpSent(false);
    } catch (error) {
      setStatusMessage(getErrorMessage(error, 'Could not sign out.'));
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return (
    <Card style={styles.card} variant="elevated" testID="section-account">
      <SettingsSectionHeader
        description="Sign in and manage your Moodie identity."
        icon={
          <Ionicons
            color={theme.colors.accent}
            name="person-outline"
            size={22}
          />
        }
        title="Account"
      />

      {!isConfigured ? (
        <AppText tone="muted" testID="text-auth-status">
          Sign-in is unavailable until Supabase is configured.
        </AppText>
      ) : isLoading ? (
        <View style={styles.accountLoading}>
          <ActivityIndicator color={theme.colors.accent} />
          <AppText tone="muted" testID="text-auth-status">
            Loading account...
          </AppText>
        </View>
      ) : user ? (
        <View style={styles.accountFields}>
          <AppText
            tone="muted"
            testID={statusMessage ? undefined : 'text-auth-status'}
          >
            Signed in as {user.email ?? 'Moodie user'}
          </AppText>
          {isAdminLoading ? (
            <AppText tone="muted" testID="text-admin-status">
              Checking admin access...
            </AppText>
          ) : isAdmin ? (
            <AppText tone="accent" variant="label" testID="text-admin-status">
              Administrator
            </AppText>
          ) : null}
          <AppButton
            label={isSubmitting ? 'Signing out...' : 'Sign out'}
            loading={isSubmitting}
            onPress={handleSignOut}
            testID="btn-sign-out"
            variant="danger"
          />
        </View>
      ) : (
        <View style={styles.accountFields}>
          <AppTextField
            value={email}
            onChangeText={handleEmailChange}
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            editable={!isSubmitting}
            testID="input-auth-email"
          />

          {authMode === 'password' ? (
            <>
              <AppTextField
                value={password}
                onChangeText={setPassword}
                label="Password"
                placeholder="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                textContentType="password"
                editable={!isSubmitting}
                onSubmitEditing={handleSignIn}
                testID="input-auth-password"
              />
              <AppButton
                label={isSubmitting ? 'Signing in...' : 'Sign in with password'}
                loading={isSubmitting}
                onPress={handleSignIn}
                testID="btn-sign-in"
              />
              <AppButton
                label="Use a one-time code"
                onPress={() => selectAuthMode('otp')}
                disabled={isSubmitting}
                testID="btn-use-email-otp"
                variant="ghost"
              />
            </>
          ) : (
            <>
              {isOtpSent ? (
                <>
                  <AppTextField
                    value={otp}
                    onChangeText={value => setOtp(value.replace(/[^0-9]/g, ''))}
                    label="Verification code"
                    placeholder="Six-digit code"
                    autoComplete="one-time-code"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isSubmitting}
                    onSubmitEditing={handleVerifyOtp}
                    testID="input-auth-otp"
                  />
                  <AppButton
                    label={isSubmitting ? 'Verifying...' : 'Verify code'}
                    loading={isSubmitting}
                    onPress={handleVerifyOtp}
                    testID="btn-verify-email-otp"
                  />
                  <AppButton
                    label="Send a new code"
                    onPress={handleSendOtp}
                    disabled={isSubmitting}
                    testID="btn-send-email-otp"
                    variant="secondary"
                  />
                </>
              ) : (
                <AppButton
                  label={isSubmitting ? 'Sending...' : 'Send one-time code'}
                  loading={isSubmitting}
                  onPress={handleSendOtp}
                  testID="btn-send-email-otp"
                />
              )}
              <AppButton
                label="Use password instead"
                onPress={() => selectAuthMode('password')}
                disabled={isSubmitting}
                testID="btn-use-password"
                variant="ghost"
              />
            </>
          )}

          <View style={styles.authDivider}>
            <View style={styles.authDividerLine} />
            <AppText tone="muted" variant="caption">
              or
            </AppText>
            <View style={styles.authDividerLine} />
          </View>
          <AppButton
            label={isSubmitting ? 'Opening Google...' : 'Continue with Google'}
            loading={isSubmitting}
            onPress={handleGoogleSignIn}
            testID="btn-sign-in-google"
            variant="secondary"
          />
        </View>
      )}

      {statusMessage ? (
        <AppText
          accessibilityLiveRegion="polite"
          tone="accent"
          testID="text-auth-status"
        >
          {statusMessage}
        </AppText>
      ) : null}
    </Card>
  );
};

export default AccountSection;
