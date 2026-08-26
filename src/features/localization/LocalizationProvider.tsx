import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

type LocaleState = {
  languageCode: string;
  remoteMessages: Record<string, string>;
};

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<LocaleState>({
    languageCode: DEFAULT_LANGUAGE_CODE,
    remoteMessages: {},
  });
  const [languages, setLanguages] = useState<SupportedLanguage[]>([
    fallbackLanguage,
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const activeLanguageCodeRef = useRef(DEFAULT_LANGUAGE_CODE);
  const languageRequestIdRef = useRef(0);
  const isSelectingLanguageRef = useRef(false);
  const explicitlySelectedLanguageCodeRef = useRef<string | null>(null);
  const { languageCode, remoteMessages } = locale;

  const applyLanguage = useCallback(async (nextCode: string) => {
    const requestId = languageRequestIdRef.current + 1;
    languageRequestIdRef.current = requestId;
    const messages = await loadRemoteMessages(nextCode);
    if (languageRequestIdRef.current !== requestId) {
      return;
    }

    activeLanguageCodeRef.current = nextCode;
    setLocale({ languageCode: nextCode, remoteMessages: messages });
  }, []);

  useEffect(() => {
    let active = true;
    const storedLanguageCodePromise = loadLanguageCode();

    storedLanguageCodePromise
      .then(storedCode => {
        if (!active) return;
        activeLanguageCodeRef.current = storedCode;
        setLocale({ languageCode: storedCode, remoteMessages: {} });
      })
      .catch(() => undefined);

    Promise.all([loadSupportedLanguages(), storedLanguageCodePromise])
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
        languageRequestIdRef.current += 1;
        activeLanguageCodeRef.current = DEFAULT_LANGUAGE_CODE;
        setLanguages([fallbackLanguage]);
        setLocale({
          languageCode: DEFAULT_LANGUAGE_CODE,
          remoteMessages: {},
        });
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
        if (isLoading || isSelectingLanguageRef.current) return;
        if (
          explicitlySelectedLanguageCodeRef.current !== null &&
          settings.languageCode !== explicitlySelectedLanguageCodeRef.current
        ) {
          return;
        }
        const isSupported = languages.some(
          language => language.code === settings.languageCode,
        );
        if (
          settings.languageCode !== activeLanguageCodeRef.current &&
          isSupported
        ) {
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
    [applyLanguage, isLoading, languages],
  );

  const setLanguage = useCallback(
    async (nextCode: string) => {
      if (!languages.some(language => language.code === nextCode)) {
        throw new Error('That language is not currently supported.');
      }

      explicitlySelectedLanguageCodeRef.current = nextCode;
      isSelectingLanguageRef.current = true;
      try {
        await saveLanguageCode(nextCode);
        await applyLanguage(nextCode);
        await syncCurrentDeviceSettingsToDatabase();
      } catch (error) {
        explicitlySelectedLanguageCodeRef.current = null;
        throw error;
      } finally {
        isSelectingLanguageRef.current = false;
      }
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
