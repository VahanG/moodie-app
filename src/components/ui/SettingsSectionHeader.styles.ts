import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createSettingsSectionHeaderStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    icon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.md,
      backgroundColor: colors.accentSoft,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
  });
}
