import { StyleSheet } from 'react-native';
import { MoodieTheme } from '../../theme';

export function createIconButtonStyles(theme: MoodieTheme) {
  const { colors, radii } = theme;

  return StyleSheet.create({
    base: {
      width: 48,
      height: 48,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    compact: {
      width: 44,
      height: 44,
    },
    surface: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
    },
    onImage: {
      backgroundColor: colors.imageControl,
      borderColor: colors.imageControlBorder,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    pressed: {
      opacity: 0.72,
      transform: [{ scale: 0.96 }],
    },
    disabled: {
      opacity: 0.42,
    },
  });
}
