import React, { useCallback, useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, View } from 'react-native';
import {
  AuthUser,
  isAuthConfigured,
  loadAuthUser,
  sendEmailOtp,
  signInWithApple,
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
import { useLocalization } from '../features/localization';
import { AppleSignInButton } from '../components/auth/AppleSignInButton';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

const AccountSection: React.FC = () => {
  const styles = useSettingsPanelStyles();
  const { theme } = useTheme();
  const { t } = useLocalization();
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
            getErrorMessage(error, t('auth.sessionLoadError')),
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
  }, [isConfigured, t]);

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
            getErrorMessage(error, t('auth.adminCheckError')),
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
  }, [t, user]);

  const handleSignIn = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setStatusMessage(t('auth.enterCredentials'));
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
      setStatusMessage(getErrorMessage(error, t('auth.signInError')));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, t]);

  const handleSendOtp = useCallback(async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setStatusMessage(t('auth.enterEmail'));
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await sendEmailOtp(normalizedEmail);
      setIsOtpSent(true);
      setOtp('');
      setStatusMessage(t('auth.codeSent'));
    } catch (error) {
      setStatusMessage(
        getErrorMessage(error, t('auth.sendCodeError')),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [email, t]);

  const handleVerifyOtp = useCallback(async () => {
    const normalizedEmail = email.trim();
    const normalizedOtp = otp.trim();

    if (!normalizedEmail || normalizedOtp.length !== 6) {
      setStatusMessage(t('auth.enterCode'));
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
      setStatusMessage(getErrorMessage(error, t('auth.verifyError')));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, otp, t]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const nextUser = await signInWithGoogle();

      if (!nextUser) {
        setStatusMessage(t('auth.googleCanceled'));
        return;
      }

      setUser(nextUser);
    } catch (error) {
      setStatusMessage(
        getErrorMessage(error, t('auth.googleError')),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [t]);

  const handleAppleSignIn = useCallback(async () => {
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const nextUser = await signInWithApple();

      if (!nextUser) {
        setStatusMessage(t('auth.appleCanceled'));
        return;
      }

      setUser(nextUser);
    } catch (error) {
      setStatusMessage(getErrorMessage(error, t('auth.appleError')));
    } finally {
      setIsSubmitting(false);
    }
  }, [t]);

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
      setStatusMessage(getErrorMessage(error, t('auth.signOutError')));
    } finally {
      setIsSubmitting(false);
    }
  }, [t]);

  return (
    <Card style={styles.card} variant="elevated" testID="section-account">
      <SettingsSectionHeader
        description={t('account.description')}
        icon={
          <Ionicons
            color={theme.colors.accent}
            name="person-outline"
            size={22}
          />
        }
        title={t('account.title')}
      />

      {!isConfigured ? (
        <AppText tone="muted" testID="text-auth-status">
          {t('account.unconfigured')}
        </AppText>
      ) : isLoading ? (
        <View style={styles.accountLoading}>
          <ActivityIndicator color={theme.colors.accent} />
          <AppText tone="muted" testID="text-auth-status">
            {t('account.loading')}
          </AppText>
        </View>
      ) : user ? (
        <View style={styles.accountFields}>
          <AppText
            tone="muted"
            testID={statusMessage ? undefined : 'text-auth-status'}
          >
            {t('account.signedIn', {
              email: user.email ?? t('account.defaultUser'),
            })}
          </AppText>
          {isAdminLoading ? (
            <AppText tone="muted" testID="text-admin-status">
              {t('account.checkingAdmin')}
            </AppText>
          ) : isAdmin ? (
            <AppText tone="accent" variant="label" testID="text-admin-status">
              {t('account.administrator')}
            </AppText>
          ) : null}
          <AppButton
            label={
              isSubmitting ? t('account.signingOut') : t('account.signOut')
            }
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
            label={t('account.email')}
            placeholder={t('account.emailPlaceholder')}
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
                label={t('account.password')}
                placeholder={t('account.password')}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                textContentType="password"
                editable={!isSubmitting}
                onSubmitEditing={handleSignIn}
                testID="input-auth-password"
              />
              <AppButton
                label={
                  isSubmitting
                    ? t('account.signingIn')
                    : t('account.signInPassword')
                }
                loading={isSubmitting}
                onPress={handleSignIn}
                testID="btn-sign-in"
              />
              <AppButton
                label={t('account.useCode')}
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
                    label={t('account.verificationCode')}
                    placeholder={t('account.sixDigitCode')}
                    autoComplete="one-time-code"
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isSubmitting}
                    onSubmitEditing={handleVerifyOtp}
                    testID="input-auth-otp"
                  />
                  <AppButton
                    label={
                      isSubmitting
                        ? t('account.verifying')
                        : t('account.verifyCode')
                    }
                    loading={isSubmitting}
                    onPress={handleVerifyOtp}
                    testID="btn-verify-email-otp"
                  />
                  <AppButton
                    label={t('account.sendNewCode')}
                    onPress={handleSendOtp}
                    disabled={isSubmitting}
                    testID="btn-send-email-otp"
                    variant="secondary"
                  />
                </>
              ) : (
                <AppButton
                  label={
                    isSubmitting ? t('account.sending') : t('account.sendCode')
                  }
                  loading={isSubmitting}
                  onPress={handleSendOtp}
                  testID="btn-send-email-otp"
                />
              )}
              <AppButton
                label={t('account.usePassword')}
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
              {t('account.or')}
            </AppText>
            <View style={styles.authDividerLine} />
          </View>
          <AppleSignInButton
            disabled={isSubmitting}
            onPress={handleAppleSignIn}
          />
          <AppButton
            label={
              isSubmitting ? t('account.openingGoogle') : t('account.google')
            }
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
