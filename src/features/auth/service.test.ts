import {
  sendEmailOtp,
  signInWithApple,
  signInWithGoogle,
  verifyEmailOtp,
} from './service';

const mockAppleSignInAsync = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockSignInWithOAuth = jest.fn();
const mockSignInWithIdToken = jest.fn();
const mockExchangeCodeForSession = jest.fn();
const mockSetSession = jest.fn();
const mockOpenAuthSessionAsync = jest.fn();

jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { EMAIL: 0 },
  signInAsync: (...args: unknown[]) => mockAppleSignInAsync(...args),
}));

jest.mock('../supabase', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      signInWithOAuth: mockSignInWithOAuth,
      signInWithIdToken: mockSignInWithIdToken,
      exchangeCodeForSession: mockExchangeCodeForSession,
      setSession: mockSetSession,
    },
  }),
  readSupabaseConfig: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: () => 'moodie-app://auth/callback',
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: (...args: unknown[]) =>
    mockOpenAuthSessionAsync(...args),
}));

describe('auth service passwordless methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
  });

  test('requests an OTP without creating an email user', async () => {
    await sendEmailOtp(' person@example.com ');

    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: 'person@example.com',
      options: { shouldCreateUser: false },
    });
  });

  test('verifies an email OTP and returns its user', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-1', email: 'person@example.com' },
        },
      },
      error: null,
    });

    await expect(
      verifyEmailOtp('person@example.com', '123456'),
    ).resolves.toEqual({ id: 'user-1', email: 'person@example.com' });
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'person@example.com',
      token: '123456',
      type: 'email',
    });
  });

  test('creates a session from a successful Google OAuth callback', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://example.supabase.co/google' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'moodie-app://auth/callback#access_token=access&refresh_token=refresh',
    });
    mockSetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'google-user', email: 'google@example.com' },
        },
      },
      error: null,
    });

    await expect(signInWithGoogle()).resolves.toEqual({
      id: 'google-user',
      email: 'google@example.com',
    });
    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'moodie-app://auth/callback',
        skipBrowserRedirect: true,
      },
    });
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    });
  });

  test('exchanges a PKCE code from a Google OAuth callback', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://example.supabase.co/google' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'moodie-app://auth/callback?code=pkce-code',
    });
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'google-user', email: 'google@example.com' },
        },
      },
      error: null,
    });

    await expect(signInWithGoogle()).resolves.toEqual({
      id: 'google-user',
      email: 'google@example.com',
    });
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(mockSetSession).not.toHaveBeenCalled();
  });

  test('surfaces an OAuth callback error code', async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://example.supabase.co/google' },
      error: null,
    });
    mockOpenAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'moodie-app://auth/callback?error_code=access_denied&error_description=Access%20denied',
    });

    await expect(signInWithGoogle()).rejects.toThrow('Access denied');
  });

  test('creates a Supabase session from an Apple identity token', async () => {
    mockAppleSignInAsync.mockResolvedValue({ identityToken: 'apple-token' });
    mockSignInWithIdToken.mockResolvedValue({
      data: {
        session: {
          user: { id: 'apple-user', email: 'apple@example.com' },
        },
      },
      error: null,
    });

    await expect(signInWithApple()).resolves.toEqual({
      id: 'apple-user',
      email: 'apple@example.com',
    });
    expect(mockAppleSignInAsync).toHaveBeenCalledWith({
      requestedScopes: [0],
    });
    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'apple-token',
    });
  });

  test('treats a canceled Apple request as a canceled sign-in', async () => {
    mockAppleSignInAsync.mockRejectedValue({
      code: 'ERR_REQUEST_CANCELED',
    });

    await expect(signInWithApple()).resolves.toBeNull();
    expect(mockSignInWithIdToken).not.toHaveBeenCalled();
  });
});
