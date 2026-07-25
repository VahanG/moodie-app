import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AccountSection from '../src/screens/AccountSection';
import { ThemeProvider } from '../src/theme';

const mockIsAuthConfigured = jest.fn(() => true);
const mockLoadAuthUser = jest.fn();
const mockSendEmailOtp = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignOut = jest.fn();
const mockSubscribeToAuthUser = jest.fn((_listener: unknown) => jest.fn());
const mockVerifyEmailOtp = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
}));

jest.mock('../src/features/auth', () => ({
  isAuthConfigured: () => mockIsAuthConfigured(),
  loadAuthUser: () => mockLoadAuthUser(),
  sendEmailOtp: (email: string) => mockSendEmailOtp(email),
  signInWithEmailAndPassword: (email: string, password: string) =>
    mockSignInWithEmailAndPassword(email, password),
  signInWithGoogle: () => mockSignInWithGoogle(),
  signOut: () => mockSignOut(),
  subscribeToAuthUser: (listener: unknown) => mockSubscribeToAuthUser(listener),
  verifyEmailOtp: (email: string, token: string) =>
    mockVerifyEmailOtp(email, token),
}));

const renderAccountSection = () => (
  <ThemeProvider>
    <AccountSection />
  </ThemeProvider>
);

describe('AccountSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthConfigured.mockReturnValue(true);
    mockLoadAuthUser.mockResolvedValue(null);
    mockSendEmailOtp.mockResolvedValue(undefined);
    mockSignInWithGoogle.mockResolvedValue(null);
    mockSignOut.mockResolvedValue(undefined);
  });

  test('signs in from the inline account section', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({
      id: 'user-1',
      email: 'person@example.com',
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderAccountSection());
    });

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root
        .findByProps({ testID: 'input-auth-email' })
        .props.onChangeText(' person@example.com ');
      root
        .findByProps({ testID: 'input-auth-password' })
        .props.onChangeText('secret-password');
    });

    await ReactTestRenderer.act(async () => {
      await root.findByProps({ testID: 'btn-sign-in' }).props.onPress();
    });

    expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
      'person@example.com',
      'secret-password',
    );
    expect(root.findByProps({ testID: 'btn-sign-out' })).toBeTruthy();
  });

  test('shows validation without submitting empty credentials', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderAccountSection());
    });

    await ReactTestRenderer.act(async () => {
      await renderer!.root
        .findByProps({ testID: 'btn-sign-in' })
        .props.onPress();
    });

    expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(
      renderer!.root.findByProps({ testID: 'text-auth-status' }).props.children,
    ).toBe('Enter both your email and password.');
  });

  test('loads an existing session and signs out inline', async () => {
    mockLoadAuthUser.mockResolvedValue({
      id: 'user-1',
      email: 'person@example.com',
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderAccountSection());
    });

    await ReactTestRenderer.act(async () => {
      await renderer!.root
        .findByProps({ testID: 'btn-sign-out' })
        .props.onPress();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(renderer!.root.findByProps({ testID: 'btn-sign-in' })).toBeTruthy();
  });

  test('sends and verifies an email one-time code', async () => {
    mockVerifyEmailOtp.mockResolvedValue({
      id: 'user-1',
      email: 'person@example.com',
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderAccountSection());
    });

    const root = renderer!.root;

    await ReactTestRenderer.act(async () => {
      root
        .findByProps({ testID: 'input-auth-email' })
        .props.onChangeText('person@example.com');
      root.findByProps({ testID: 'btn-use-email-otp' }).props.onPress();
    });

    await ReactTestRenderer.act(async () => {
      await root.findByProps({ testID: 'btn-send-email-otp' }).props.onPress();
    });

    expect(mockSendEmailOtp).toHaveBeenCalledWith('person@example.com');

    await ReactTestRenderer.act(async () => {
      root
        .findByProps({ testID: 'input-auth-otp' })
        .props.onChangeText('123456');
    });

    await ReactTestRenderer.act(async () => {
      await root
        .findByProps({ testID: 'btn-verify-email-otp' })
        .props.onPress();
    });

    expect(mockVerifyEmailOtp).toHaveBeenCalledWith(
      'person@example.com',
      '123456',
    );
    expect(root.findByProps({ testID: 'btn-sign-out' })).toBeTruthy();
  });

  test('signs in with Google from the same inline section', async () => {
    mockSignInWithGoogle.mockResolvedValue({
      id: 'google-user',
      email: 'google@example.com',
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderAccountSection());
    });

    await ReactTestRenderer.act(async () => {
      await renderer!.root
        .findByProps({ testID: 'btn-sign-in-google' })
        .props.onPress();
    });

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    expect(renderer!.root.findByProps({ testID: 'btn-sign-out' })).toBeTruthy();
  });

  test('shows an inline unavailable state without Supabase configuration', async () => {
    mockIsAuthConfigured.mockReturnValue(false);
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(renderAccountSection());
    });

    expect(
      renderer!.root.findByProps({ testID: 'section-account' }),
    ).toBeTruthy();
    expect(
      renderer!.root.findByProps({ testID: 'text-auth-status' }).props.children,
    ).toBe('Sign-in is unavailable until Supabase is configured.');
    expect(mockLoadAuthUser).not.toHaveBeenCalled();
  });
});
