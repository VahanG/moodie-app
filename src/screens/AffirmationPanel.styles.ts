import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { MoodieTheme, useTheme } from '../theme';

export function createAffirmationPanelStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    screen: {
      flex: 1,
      paddingTop: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background,
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
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headingBlock: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      color: colors.onImage,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: '700',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    date: {
      color: colors.onImageMuted,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.lg,
    },
    bodyCompact: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
    },
    topicChip: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.imageControlBorder,
      borderRadius: radii.pill,
      backgroundColor: colors.imageControl,
    },
    topicText: {
      color: colors.onImage,
    },
    quoteMark: {
      marginTop: spacing.lg,
      marginBottom: -spacing.md,
      color: colors.onImageMuted,
      fontSize: 54,
      lineHeight: 58,
      fontWeight: '700',
      opacity: 0.9,
    },
    quoteMarkCompact: {
      marginTop: spacing.sm,
      marginBottom: -spacing.sm,
      fontSize: 42,
      lineHeight: 46,
    },
    affirmationText: {
      maxWidth: 440,
      color: colors.onImage,
      fontSize: 30,
      lineHeight: 39,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: -0.5,
      textShadowColor: colors.scrim,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 8,
    },
    affirmationTextCompact: {
      fontSize: 26,
      lineHeight: 34,
    },
    actionDock: {
      marginTop: spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.xs,
      borderWidth: 1,
      borderColor: colors.imageControlBorder,
      borderRadius: radii.pill,
      backgroundColor: colors.imageControl,
    },
    actionDockCompact: {
      marginTop: spacing.md,
    },
    actionButton: {
      borderColor: 'transparent',
      backgroundColor: 'transparent',
    },
    actionDivider: {
      width: StyleSheet.hairlineWidth,
      height: 24,
      backgroundColor: colors.imageControlBorder,
    },
    footer: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    swipeHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    swipeHintText: {
      color: colors.onImageMuted,
    },
    position: {
      color: colors.onImage,
      fontVariant: ['tabular-nums'],
    },
  });
}

export function useAffirmationPanelStyles() {
  const { theme } = useTheme();

  return useMemo(() => createAffirmationPanelStyles(theme), [theme]);
}
