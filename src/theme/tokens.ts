export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  inputBackground: string;
  placeholder: string;
  scrim: string;
  imageOverlay: string;
  imageControl: string;
  imageControlBorder: string;
  onImage: string;
  onImageMuted: string;
};

export type MoodieTheme = {
  mode: ResolvedThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
    pill: number;
  };
};

const sharedThemeValues = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 20,
    xl: 28,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 18,
    pill: 999,
  },
};

export const lightTheme: MoodieTheme = {
  ...sharedThemeValues,
  mode: 'light',
  isDark: false,
  colors: {
    background: '#F7F5F2',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFCFA',
    text: '#24212B',
    textMuted: '#6F6976',
    border: '#DED7DD',
    accent: '#7357C7',
    accentSoft: '#EEE9FF',
    onAccent: '#FFFFFF',
    inputBackground: '#FFFFFF',
    placeholder: '#918A96',
    scrim: 'rgba(20, 17, 26, 0.58)',
    imageOverlay: 'rgba(12, 10, 16, 0.38)',
    imageControl: 'rgba(12, 10, 16, 0.48)',
    imageControlBorder: 'rgba(255, 255, 255, 0.58)',
    onImage: '#FFFFFF',
    onImageMuted: '#EDE9F0',
  },
};

export const darkTheme: MoodieTheme = {
  ...sharedThemeValues,
  mode: 'dark',
  isDark: true,
  colors: {
    background: '#101116',
    surface: '#191A22',
    surfaceElevated: '#22242E',
    text: '#F5F1F7',
    textMuted: '#BBB4C1',
    border: '#383A45',
    accent: '#866CE0',
    accentSoft: '#302A4D',
    onAccent: '#FFFFFF',
    inputBackground: '#22242E',
    placeholder: '#8E8894',
    scrim: 'rgba(3, 3, 6, 0.72)',
    imageOverlay: 'rgba(3, 3, 6, 0.44)',
    imageControl: 'rgba(3, 3, 6, 0.56)',
    imageControlBorder: 'rgba(255, 255, 255, 0.48)',
    onImage: '#FFFFFF',
    onImageMuted: '#E5E0E8',
  },
};

export function getTheme(mode: ResolvedThemeMode): MoodieTheme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
