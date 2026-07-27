import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  subscribeToUserSettings,
  syncCurrentDeviceSettingsToDatabase,
} from '../user-settings';
import {
  loadRemoteMessages,
  loadSupportedLanguages,
  translate,
} from './service';
import {
  DEFAULT_LANGUAGE_CODE,
  loadLanguageCode,
  saveLanguageCode,
} from './storage';
import {
  SupportedLanguage,
  TranslationFunction,
  TranslationParams,
} from './types';

type LocalizationContextValue = {
  languageCode: string;
  languages: SupportedLanguage[];
  isLoading: boolean;
  setLanguage: (languageCode: string) => Promise<void>;
  t: TranslationFunction;
};

const fallbackLanguage: SupportedLanguage = {
  code: DEFAULT_LANGUAGE_CODE,
  englishName: 'English',
  nativeName: 'English',
  textDirection: 'ltr',
  isDefault: true,
};

const fallbackContext: LocalizationContextValue = {
  languageCode: DEFAULT_LANGUAGE_CODE,
  languages: [fallbackLanguage],
  isLoading: false,
  setLanguage: async () => undefined,
  t: (key, params) => translate({}, key, params, DEFAULT_LANGUAGE_CODE),
};

const LocalizationContext =
  createContext<LocalizationContextValue>(fallbackContext);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [languageCode, setLanguageCode] = useState(DEFAULT_LANGUAGE_CODE);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([
    fallbackLanguage,
  ]);
  const [remoteMessages, setRemoteMessages] = useState<Record<string, string>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  const applyLanguage = useCallback(async (nextCode: string) => {
    setLanguageCode(nextCode);
    setRemoteMessages(await loadRemoteMessages(nextCode));
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([loadSupportedLanguages(), loadLanguageCode()])
      .then(async ([loadedLanguages, storedCode]) => {
        if (!active) return;
        const fallback =
          loadedLanguages.find(language => language.isDefault)?.code ??
          DEFAULT_LANGUAGE_CODE;
        const nextCode = loadedLanguages.some(
          language => language.code === storedCode,
        )
          ? storedCode
          : fallback;

        setLanguages(loadedLanguages);
        if (nextCode !== storedCode) {
          await saveLanguageCode(nextCode);
          await syncCurrentDeviceSettingsToDatabase();
        }
        if (active) await applyLanguage(nextCode);
      })
      .catch(async () => {
        if (!active) return;
        setLanguages([fallbackLanguage]);
        setLanguageCode(DEFAULT_LANGUAGE_CODE);
        setRemoteMessages({});
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [applyLanguage]);

  useEffect(
    () =>
      subscribeToUserSettings(settings => {
        if (isLoading) return;
        const isSupported = languages.some(
          language => language.code === settings.languageCode,
        );
        if (settings.languageCode !== languageCode && isSupported) {
          saveLanguageCode(settings.languageCode)
            .then(() => applyLanguage(settings.languageCode))
            .catch(() => undefined);
          return;
        }

        if (!isSupported) {
          const fallbackCode =
            languages.find(language => language.isDefault)?.code ??
            DEFAULT_LANGUAGE_CODE;
          saveLanguageCode(fallbackCode)
            .then(() => applyLanguage(fallbackCode))
            .then(syncCurrentDeviceSettingsToDatabase)
            .catch(() => undefined);
        }
      }),
    [applyLanguage, isLoading, languageCode, languages],
  );

  const setLanguage = useCallback(
    async (nextCode: string) => {
      if (!languages.some(language => language.code === nextCode)) {
        throw new Error('That language is not currently supported.');
      }

      await saveLanguageCode(nextCode);
      await applyLanguage(nextCode);
      await syncCurrentDeviceSettingsToDatabase();
    },
    [applyLanguage, languages],
  );

  const t = useCallback(
    (key: string, params?: TranslationParams) =>
      translate(remoteMessages, key, params, languageCode),
    [languageCode, remoteMessages],
  );

  const value = useMemo(
    () => ({ languageCode, languages, isLoading, setLanguage, t }),
    [isLoading, languageCode, languages, setLanguage, t],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationContextValue {
  return useContext(LocalizationContext);
}
