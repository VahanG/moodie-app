import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createCardStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    base: {
      padding: spacing.lg,
      borderRadius: radii.lg,
      gap: spacing.md,
      backgroundColor: colors.surface,
    },
    default: {
      borderWidth: 0,
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 3,
    },
    outlined: {
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
