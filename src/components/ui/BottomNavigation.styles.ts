import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createBottomNavigationStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    shell: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background,
    },
    shellMinimal: {
      paddingTop: spacing.xs,
      backgroundColor: 'transparent',
    },
    navigation: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 5,
    },
    navigationMinimal: {
      minHeight: 60,
      padding: 0,
      borderWidth: 0,
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    item: {
      flex: 1,
      minHeight: 56,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      borderRadius: radii.md,
    },
    itemSelected: {
      backgroundColor: colors.accentSoft,
    },
    itemMinimal: {
      minHeight: 52,
      gap: 0,
      backgroundColor: 'transparent',
    },
    itemPressed: {
      opacity: 0.72,
      transform: [{ scale: 0.97 }],
    },
    label: {
      fontSize: 11,
      lineHeight: 14,
    },
  });
}
