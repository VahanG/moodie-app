import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LANGUAGE_CODE,
  loadLanguageCode,
  normalizeLanguageCode,
  saveLanguageCode,
} from './storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

describe('language preference storage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('normalizes codes and defaults to English', async () => {
    mockGetItem.mockResolvedValue(null);
    expect(normalizeLanguageCode(' PT-BR ')).toBe('pt-br');
    await expect(loadLanguageCode()).resolves.toBe(DEFAULT_LANGUAGE_CODE);
  });

  test('persists valid normalized language codes', async () => {
    mockSetItem.mockResolvedValue();
    await saveLanguageCode(' HY ');
    expect(mockSetItem).toHaveBeenCalledWith('@moodie/language-v1', 'hy');
  });

  test('rejects invalid language codes', async () => {
    await expect(saveLanguageCode('../hy')).rejects.toThrow(
      'Invalid language code',
    );
  });
});
