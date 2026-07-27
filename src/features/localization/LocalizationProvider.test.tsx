import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { UserSettingsSnapshot } from '../user-settings/types';
import { LocalizationProvider, useLocalization } from './LocalizationProvider';

const mockLoadRemoteMessages = jest.fn();
const mockLoadSupportedLanguages = jest.fn();
const mockLoadLanguageCode = jest.fn();
const mockSaveLanguageCode = jest.fn();
const mockSyncCurrentDeviceSettingsToDatabase = jest.fn();
const mockUnsubscribe = jest.fn();
let mockSettingsListener: ((settings: UserSettingsSnapshot) => void) | null =
  null;

jest.mock('./service', () => ({
  loadRemoteMessages: (languageCode: string) =>
    mockLoadRemoteMessages(languageCode),
  loadSupportedLanguages: () => mockLoadSupportedLanguages(),
  translate: (
    messages: Record<string, string>,
    key: string,
    _params: Record<string, unknown>,
    languageCode: string,
  ) => messages[key] ?? `${languageCode}:${key}`,
}));

jest.mock('./storage', () => ({
  DEFAULT_LANGUAGE_CODE: 'en',
  loadLanguageCode: () => mockLoadLanguageCode(),
  saveLanguageCode: (languageCode: string) =>
    mockSaveLanguageCode(languageCode),
}));

jest.mock('../user-settings', () => ({
  subscribeToUserSettings: (
    listener: (settings: UserSettingsSnapshot) => void,
  ) => {
    mockSettingsListener = listener;
    return mockUnsubscribe;
  },
  syncCurrentDeviceSettingsToDatabase: () =>
    mockSyncCurrentDeviceSettingsToDatabase(),
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function makeSettings(languageCode: string): UserSettingsSnapshot {
  return {
    languageCode,
    themePreference: 'system',
    reminderPreferences: { enabled: false, hour: 9, minute: 0 },
    selectedTopicIds: [],
    backgroundPreference: { mode: 'free', backgroundId: null },
    likedAffirmationKeys: [],
  };
}

describe('LocalizationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettingsListener = null;
    mockLoadLanguageCode.mockResolvedValue('en');
    mockLoadSupportedLanguages.mockResolvedValue([
      {
        code: 'en',
        englishName: 'English',
        nativeName: 'English',
        textDirection: 'ltr',
        isDefault: true,
      },
      {
        code: 'hy',
        englishName: 'Armenian',
        nativeName: 'Հայերեն',
        textDirection: 'ltr',
        isDefault: false,
      },
      {
        code: 'ru',
        englishName: 'Russian',
        nativeName: 'Русский',
        textDirection: 'ltr',
        isDefault: false,
      },
    ]);
    mockLoadRemoteMessages.mockResolvedValue({ sample: 'English' });
    mockSaveLanguageCode.mockResolvedValue(undefined);
    mockSyncCurrentDeviceSettingsToDatabase.mockResolvedValue(undefined);
  });

  test('keeps an explicit language selection coherent when stale settings publish', async () => {
    const armenianMessages = createDeferred<Record<string, string>>();
    mockLoadRemoteMessages.mockImplementation((languageCode: string) =>
      languageCode === 'hy'
        ? armenianMessages.promise
        : Promise.resolve({ sample: 'English' }),
    );
    const observed: Array<[string, string]> = [];
    let latestLocalization: ReturnType<typeof useLocalization> | null = null;

    function Probe() {
      latestLocalization = useLocalization();
      observed.push([
        latestLocalization.languageCode,
        latestLocalization.t('sample'),
      ]);
      return null;
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <LocalizationProvider>
          <Probe />
        </LocalizationProvider>,
      );
    });

    let selection!: Promise<void>;
    await ReactTestRenderer.act(async () => {
      selection = latestLocalization!.setLanguage('hy');
      await Promise.resolve();
    });
    expect(mockLoadRemoteMessages).toHaveBeenCalledWith('hy');

    mockSettingsListener?.(makeSettings('en'));
    await ReactTestRenderer.act(async () => {
      armenianMessages.resolve({ sample: 'Հայերեն' });
      await selection;
    });

    mockSettingsListener?.(makeSettings('en'));
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });

    expect(latestLocalization!.languageCode).toBe('hy');
    expect(latestLocalization!.t('sample')).toBe('Հայերեն');
    expect(observed).not.toContainEqual(['en', 'Հայերեն']);

    await ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
  });

  test('ignores a slower message response for an obsolete language request', async () => {
    const armenianMessages = createDeferred<Record<string, string>>();
    const russianMessages = createDeferred<Record<string, string>>();
    mockLoadRemoteMessages.mockImplementation((languageCode: string) => {
      if (languageCode === 'hy') return armenianMessages.promise;
      if (languageCode === 'ru') return russianMessages.promise;
      return Promise.resolve({ sample: 'English' });
    });
    let latestLocalization: ReturnType<typeof useLocalization> | null = null;

    function Probe() {
      latestLocalization = useLocalization();
      return null;
    }

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <LocalizationProvider>
          <Probe />
        </LocalizationProvider>,
      );
    });

    await ReactTestRenderer.act(async () => {
      mockSettingsListener?.(makeSettings('hy'));
      await Promise.resolve();
      await Promise.resolve();
      mockSettingsListener?.(makeSettings('ru'));
      await Promise.resolve();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      russianMessages.resolve({ sample: 'Русский' });
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => {
      armenianMessages.resolve({ sample: 'Հայերեն' });
      await Promise.resolve();
    });

    expect(latestLocalization!.languageCode).toBe('ru');
    expect(latestLocalization!.t('sample')).toBe('Русский');

    await ReactTestRenderer.act(() => {
      renderer!.unmount();
    });
  });
});
