import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { loadThemePreference, saveThemePreference } from './storage';
import {
  subscribeToUserSettings,
  syncCurrentDeviceSettingsToDatabase,
} from '../features/user-settings/service';
import {
  getTheme,
  MoodieTheme,
  ResolvedThemeMode,
  ThemePreference,
} from './tokens';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedMode: ResolvedThemeMode;
  theme: MoodieTheme;
  isThemeReady: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isThemeReady, setIsThemeReady] = useState(false);
  const hasSelectedPreference = useRef(false);

  useEffect(() => {
    let isMounted = true;

    loadThemePreference()
      .then(storedPreference => {
        if (isMounted && !hasSelectedPreference.current) {
          setPreferenceState(storedPreference);
        }
      })
      .catch(() => {
        // Keep the safe System default when device storage is unavailable.
      })
      .finally(() => {
        if (isMounted) {
          setIsThemeReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(
    () =>
      subscribeToUserSettings(settings => {
        setPreferenceState(settings.themePreference);
        setIsThemeReady(true);
      }),
    [],
  );

  const resolvedMode: ResolvedThemeMode =
    preference === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const setPreference = useCallback(
    async (nextPreference: ThemePreference) => {
      const previousPreference = preference;
      hasSelectedPreference.current = true;
      setPreferenceState(nextPreference);

      try {
        await saveThemePreference(nextPreference);
        await syncCurrentDeviceSettingsToDatabase();
      } catch (error) {
        setPreferenceState(previousPreference);
        throw error;
      }
    },
    [preference],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedMode,
      theme: getTheme(resolvedMode),
      isThemeReady,
      setPreference,
    }),
    [isThemeReady, preference, resolvedMode, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider.');
  }

  return context;
}
