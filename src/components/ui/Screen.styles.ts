import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createScreenStyles(theme: MoodieTheme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
  });
}
