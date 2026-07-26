import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createAppTextStyles(theme: MoodieTheme) {
  const { colors, typography } = theme;

  return StyleSheet.create({
    base: {
      color: colors.text,
    },
    display: typography.display,
    title: typography.title,
    heading: typography.heading,
    body: typography.body,
    label: typography.label,
    caption: typography.caption,
    muted: {
      color: colors.textMuted,
    },
    accent: {
      color: colors.accent,
    },
    danger: {
      color: colors.danger,
    },
    onImage: {
      color: colors.onImage,
    },
    onAccent: {
      color: colors.onAccent,
    },
  });
}
