import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
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
import { useHomeScreenStyles } from './HomeScreen.styles';
import { useTheme } from '../theme';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const AccountSection: React.FC = () => {
  const styles = useHomeScreenStyles();
  const { theme } = useTheme();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
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
    <View style={styles.accountSection} testID="section-account">
      <Text style={styles.sectionTitle}>Account</Text>

      {!isConfigured ? (
        <Text style={styles.value} testID="text-auth-status">
          Sign-in is unavailable until Supabase is configured.
        </Text>
      ) : isLoading ? (
        <View style={styles.accountLoading}>
          <ActivityIndicator color={theme.colors.accent} />
          <Text style={styles.loadingText} testID="text-auth-status">
            Loading account...
          </Text>
        </View>
      ) : user ? (
        <View style={styles.accountFields}>
          <Text
            style={styles.value}
            testID={statusMessage ? undefined : 'text-auth-status'}
          >
            Signed in as {user.email ?? 'Moodie user'}
          </Text>
          <Button
            title={isSubmitting ? 'Signing out...' : 'Sign out'}
            onPress={handleSignOut}
            disabled={isSubmitting}
            testID="btn-sign-out"
            color={theme.colors.accent}
          />
        </View>
      ) : (
        <View style={styles.accountFields}>
          <TextInput
            value={email}
            onChangeText={handleEmailChange}
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            style={styles.input}
            placeholderTextColor={theme.colors.placeholder}
            selectionColor={theme.colors.accent}
            editable={!isSubmitting}
            testID="input-auth-email"
          />

          {authMode === 'password' ? (
            <>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                textContentType="password"
                style={styles.input}
                placeholderTextColor={theme.colors.placeholder}
                selectionColor={theme.colors.accent}
                editable={!isSubmitting}
                onSubmitEditing={handleSignIn}
                testID="input-auth-password"
              />
              <Button
                title={isSubmitting ? 'Signing in...' : 'Sign in with password'}
                onPress={handleSignIn}
                disabled={isSubmitting}
                testID="btn-sign-in"
                color={theme.colors.accent}
              />
              <Button
                title="Use a one-time code"
                onPress={() => selectAuthMode('otp')}
                disabled={isSubmitting}
                testID="btn-use-email-otp"
                color={theme.colors.accent}
              />
            </>
          ) : (
            <>
              {isOtpSent ? (
                <>
                  <TextInput
                    value={otp}
                    onChangeText={value => setOtp(value.replace(/[^0-9]/g, ''))}
                    placeholder="Six-digit code"
                    autoComplete="one-time-code"
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.input}
                    placeholderTextColor={theme.colors.placeholder}
                    selectionColor={theme.colors.accent}
                    editable={!isSubmitting}
                    onSubmitEditing={handleVerifyOtp}
                    testID="input-auth-otp"
                  />
                  <Button
                    title={isSubmitting ? 'Verifying...' : 'Verify code'}
                    onPress={handleVerifyOtp}
                    disabled={isSubmitting}
                    testID="btn-verify-email-otp"
                    color={theme.colors.accent}
                  />
                  <Button
                    title="Send a new code"
                    onPress={handleSendOtp}
                    disabled={isSubmitting}
                    testID="btn-send-email-otp"
                    color={theme.colors.accent}
                  />
                </>
              ) : (
                <Button
                  title={isSubmitting ? 'Sending...' : 'Send one-time code'}
                  onPress={handleSendOtp}
                  disabled={isSubmitting}
                  testID="btn-send-email-otp"
                  color={theme.colors.accent}
                />
              )}
              <Button
                title="Use password instead"
                onPress={() => selectAuthMode('password')}
                disabled={isSubmitting}
                testID="btn-use-password"
                color={theme.colors.accent}
              />
            </>
          )}

          <View style={styles.authDivider}>
            <View style={styles.authDividerLine} />
            <Text style={styles.authDividerText}>or</Text>
            <View style={styles.authDividerLine} />
          </View>
          <Button
            title={isSubmitting ? 'Opening Google...' : 'Continue with Google'}
            onPress={handleGoogleSignIn}
            disabled={isSubmitting}
            testID="btn-sign-in-google"
            color={theme.colors.accent}
          />
        </View>
      )}

      {statusMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          style={styles.status}
          testID="text-auth-status"
        >
          {statusMessage}
        </Text>
      ) : null}
    </View>
  );
};

export default AccountSection;
