import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '../supabase';
import {
  bundledEnglishMessages,
  getBundledMessages,
} from '../../locales';
import { DEFAULT_LANGUAGE_CODE } from './storage';
import {
  SupportedLanguage,
  TranslationParams,
  type TextDirection,
} from './types';

const LANGUAGE_CACHE_KEY = '@moodie/languages-v1';
const MESSAGE_CACHE_PREFIX = '@moodie/app-text-v1:';

type LanguageRow = {
  code: unknown;
  english_name: unknown;
  native_name: unknown;
  text_direction: unknown;
  is_default: unknown;
};

type AppTextRow = {
  text_key: unknown;
  text_value: unknown;
};

const defaultLanguage: SupportedLanguage = {
  code: DEFAULT_LANGUAGE_CODE,
  englishName: 'English',
  nativeName: 'English',
  textDirection: 'ltr',
  isDefault: true,
};

function parseLanguageRows(rows: LanguageRow[]): SupportedLanguage[] {
  const parsed = rows.map(row => {
    if (
      typeof row.code !== 'string' ||
      typeof row.english_name !== 'string' ||
      typeof row.native_name !== 'string' ||
      (row.text_direction !== 'ltr' && row.text_direction !== 'rtl') ||
      typeof row.is_default !== 'boolean'
    ) {
      throw new Error('Invalid supported language.');
    }

    return {
      code: row.code,
      englishName: row.english_name,
      nativeName: row.native_name,
      textDirection: row.text_direction as TextDirection,
      isDefault: row.is_default,
    };
  });

  return parsed.length > 0 ? parsed : [defaultLanguage];
}

function parseMessageRows(rows: AppTextRow[]): Record<string, string> {
  return Object.fromEntries(
    rows.map(row => {
      if (
        typeof row.text_key !== 'string' ||
        typeof row.text_value !== 'string' ||
        row.text_value.trim().length === 0
      ) {
        throw new Error('Invalid application text translation.');
      }
      return [row.text_key, row.text_value];
    }),
  );
}

function parseCachedLanguages(value: string): SupportedLanguage[] {
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid cached language catalog.');
  }

  return parsed.map(item => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as SupportedLanguage).code !== 'string' ||
      typeof (item as SupportedLanguage).englishName !== 'string' ||
      typeof (item as SupportedLanguage).nativeName !== 'string' ||
      !['ltr', 'rtl'].includes((item as SupportedLanguage).textDirection) ||
      typeof (item as SupportedLanguage).isDefault !== 'boolean'
    ) {
      throw new Error('Invalid cached language catalog.');
    }
    return item as SupportedLanguage;
  });
}

export async function loadSupportedLanguages(): Promise<SupportedLanguage[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('supported_languages')
      .select(
        'code,english_name,native_name,text_direction,is_default,sort_order',
      )
      .eq('is_enabled', true)
      .order('sort_order')
      .order('code');
    if (error) throw error;

    const languages = parseLanguageRows((data ?? []) as LanguageRow[]);
    await AsyncStorage.setItem(
      LANGUAGE_CACHE_KEY,
      JSON.stringify(languages),
    ).catch(() => undefined);
    return languages;
  } catch {
    try {
      const cached = await AsyncStorage.getItem(LANGUAGE_CACHE_KEY);
      if (!cached) return [defaultLanguage];
      return parseCachedLanguages(cached);
    } catch {
      return [defaultLanguage];
    }
  }
}

export async function loadRemoteMessages(
  languageCode: string,
): Promise<Record<string, string>> {
  const cacheKey = `${MESSAGE_CACHE_PREFIX}${languageCode}`;

  try {
    const { data, error } = await getSupabaseClient()
      .from('app_text_translations')
      .select('text_key,text_value')
      .eq('language_code', languageCode)
      .order('text_key');
    if (error) throw error;

    const messages = parseMessageRows((data ?? []) as AppTextRow[]);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(messages)).catch(
      () => undefined,
    );
    return messages;
  } catch {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (!cached) return {};
      return parseMessageRows(
        Object.entries(JSON.parse(cached) as Record<string, unknown>).map(
          ([text_key, text_value]) => ({ text_key, text_value }),
        ),
      );
    } catch {
      return {};
    }
  }
}

export function translate(
  remoteMessages: Record<string, string>,
  key: string,
  params: TranslationParams = {},
  languageCode = DEFAULT_LANGUAGE_CODE,
): string {
  const template =
    remoteMessages[key] ??
    getBundledMessages(languageCode)[key] ??
    bundledEnglishMessages[key] ??
    key;

  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name)
      ? String(params[name])
      : match,
  );
}
