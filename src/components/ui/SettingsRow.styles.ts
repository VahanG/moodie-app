import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createSettingsRowStyles(theme: MoodieTheme) {
  return StyleSheet.create({
    container: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    copy: {
      flex: 1,
      gap: theme.spacing.xs,
    },
  });
}
