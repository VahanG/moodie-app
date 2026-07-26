import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { MoodieTheme, useTheme } from '../theme';

export function createCalendarPanelStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
    },
    screenCompact: {
      paddingTop: spacing.sm,
    },
    pageHeader: {
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.md,
      gap: 2,
    },
    pageHeaderCompact: {
      paddingBottom: spacing.sm,
    },
    mediaCard: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.imageControlBorder,
      borderRadius: radii.xl,
      backgroundColor: colors.surfaceElevated,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 6,
    },
    image: {
      ...StyleSheet.absoluteFill,
      width: undefined,
      height: undefined,
    },
    imageOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: colors.imageOverlay,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    contentCompact: {
      padding: spacing.md,
    },
    todayPill: {
      alignSelf: 'flex-start',
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.imageControlBorder,
      borderRadius: radii.pill,
      backgroundColor: colors.imageControl,
    },
    todayText: {
      color: colors.onImage,
    },
    dateBlock: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    weekday: {
      color: colors.onImageMuted,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    day: {
      color: colors.onImage,
      fontSize: 86,
      lineHeight: 92,
      fontWeight: '700',
      letterSpacing: -3,
      textShadowColor: colors.scrim,
      textShadowOffset: { width: 0, height: 3 },
      textShadowRadius: 10,
    },
    dayCompact: {
      fontSize: 64,
      lineHeight: 68,
    },
    monthYear: {
      color: colors.onImage,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    reflectionCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.imageControlBorder,
      borderRadius: radii.lg,
      backgroundColor: colors.imageControl,
    },
    reflectionCardCompact: {
      padding: spacing.sm,
    },
    reflectionIcon: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.pill,
      backgroundColor: colors.imageControl,
    },
    reflectionCopy: {
      flex: 1,
      gap: 2,
    },
    reflectionEyebrow: {
      color: colors.onImageMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    reflectionMessage: {
      color: colors.onImage,
    },
  });
}

export function useCalendarPanelStyles() {
  const { theme } = useTheme();

  return useMemo(() => createCalendarPanelStyles(theme), [theme]);
}
