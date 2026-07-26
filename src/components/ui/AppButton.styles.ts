import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createAppButtonStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    base: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    compact: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    primary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    pressed: {
      opacity: 0.78,
    },
    disabled: {
      opacity: 0.46,
    },
    primaryText: {
      color: colors.onAccent,
    },
    secondaryText: {
      color: colors.accent,
    },
    ghostText: {
      color: colors.accent,
    },
    dangerText: {
      color: colors.onDanger,
    },
  });
}
