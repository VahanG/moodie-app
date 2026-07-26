import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createSegmentedControlStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radii.md,
      backgroundColor: colors.surfaceElevated,
    },
    option: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.sm,
    },
    optionSelected: {
      backgroundColor: colors.accent,
    },
    optionPressed: {
      opacity: 0.72,
    },
    optionDisabled: {
      opacity: 0.42,
    },
  });
}
