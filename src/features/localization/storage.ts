import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_LANGUAGE_CODE = 'en';
const LANGUAGE_STORAGE_KEY = '@moodie/language-v1';

export function normalizeLanguageCode(value: string): string {
  return value.trim().toLowerCase();
}

export async function loadLanguageCode(): Promise<string> {
  const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored ? normalizeLanguageCode(stored) : DEFAULT_LANGUAGE_CODE;
}

export async function saveLanguageCode(languageCode: string): Promise<void> {
  const normalized = normalizeLanguageCode(languageCode);
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(normalized)) {
    throw new Error('Invalid language code.');
  }

  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
}
