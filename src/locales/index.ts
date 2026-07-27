import englishMessages from './en.json';

export type BundledMessages = Record<string, string>;

// Local AI translation workflows add a JSON file and register it here.
const bundledLocales: Record<string, BundledMessages> = {
  en: englishMessages,
};

export function getBundledMessages(languageCode: string): BundledMessages {
  return (
    bundledLocales[languageCode] ??
    bundledLocales[languageCode.split('-')[0]] ??
    {}
  );
}

export const bundledEnglishMessages: BundledMessages = englishMessages;
