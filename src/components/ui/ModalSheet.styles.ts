import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createModalSheetStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.scrim,
    },
    dismissArea: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      maxHeight: '92%',
      minHeight: 240,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      width: 38,
      height: 4,
      borderRadius: radii.pill,
      alignSelf: 'center',
      backgroundColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
  });
}
