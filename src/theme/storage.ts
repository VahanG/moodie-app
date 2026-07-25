import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePreference } from './tokens';

export const THEME_PREFERENCE_STORAGE_KEY = '@moodie/theme-preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export async function loadThemePreference(): Promise<ThemePreference> {
  const storedPreference = await AsyncStorage.getItem(
    THEME_PREFERENCE_STORAGE_KEY,
  );

  return isThemePreference(storedPreference) ? storedPreference : 'system';
}

export async function saveThemePreference(
  preference: ThemePreference,
): Promise<void> {
  await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, preference);
}
