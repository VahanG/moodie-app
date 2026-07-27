export type TextDirection = 'ltr' | 'rtl';

export type SupportedLanguage = {
  code: string;
  englishName: string;
  nativeName: string;
  textDirection: TextDirection;
  isDefault: boolean;
};

export type TranslationParams = Record<string, string | number>;

export type TranslationFunction = (
  key: string,
  params?: TranslationParams,
) => string;
