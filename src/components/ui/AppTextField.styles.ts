import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createAppTextFieldStyles(theme: MoodieTheme) {
  const { colors, radii, spacing, typography } = theme;

  return StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      ...typography.body,
    },
    inputError: {
      borderColor: colors.danger,
    },
    inputDisabled: {
      opacity: 0.5,
    },
  });
}
