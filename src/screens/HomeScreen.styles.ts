import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { MoodieTheme, useTheme } from '../theme';

export function createHomeScreenStyles(theme: MoodieTheme) {
  const { colors } = theme;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pager: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
    },
    page: {
      flex: 1,
      backgroundColor: colors.background,
    },
    settingsContent: {
      flexGrow: 1,
      padding: 20,
      gap: 20,
    },
    accountFields: {
      gap: 12,
    },
    accountLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    authDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    authDividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    affirmationPage: {
      overflow: 'hidden',
    },
    calendarPage: {
      overflow: 'hidden',
    },
    affirmationContent: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    affirmationImage: {
      width: '100%',
      height: '100%',
    },
    affirmationTextOverlay: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    affirmationText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.onImage,
      textAlign: 'center',
      textShadowColor: colors.scrim,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    affirmationActionRow: {
      marginTop: 216,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 72,
    },
    affirmationActionIcon: {
      fontSize: 22,
      color: colors.onImage,
      lineHeight: 24,
    },
    affirmationHeader: {
      position: 'absolute',
      top: 18,
      right: 16,
      alignItems: 'flex-end',
      gap: 8,
    },
    topicPickerButton: {
      backgroundColor: colors.imageControl,
      borderWidth: 1,
      borderColor: colors.imageControlBorder,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    topicPickerButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.onImage,
    },
    topicPickerButtonIcon: {
      fontSize: 16,
      lineHeight: 18,
      color: colors.onImage,
    },
    affirmationSwipeHint: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 7,
      fontSize: 12,
      fontWeight: '600',
      color: colors.onImage,
      backgroundColor: colors.imageControl,
      textShadowColor: colors.scrim,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    topicList: {
      gap: 12,
      paddingBottom: 12,
    },
    topicCard: {
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    topicCardSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    topicCardImage: {
      ...StyleSheet.absoluteFill,
    },
    topicCardOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.imageOverlay,
      gap: 4,
    },
    backgroundSections: {
      gap: 14,
      paddingBottom: 12,
    },
    backgroundTagSection: {
      gap: 8,
    },
    backgroundTagGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    backgroundTagCard: {
      width: '48%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
    },
    backgroundTagPreviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
      height: '100%',
    },
    backgroundTagPreviewImage: {
      width: '33.33%',
      height: '50%',
    },
    backgroundTagCardOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.imageOverlay,
    },
    backgroundDetailsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    backgroundDetailCard: {
      width: '48%',
      minHeight: 120,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    backgroundCardSelected: {
      borderWidth: 2,
      borderColor: colors.accent,
    },
    backgroundCardImage: {
      ...StyleSheet.absoluteFill,
    },
    backgroundCardOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.imageOverlay,
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 4,
    },
    calendarContent: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    calendarImage: {
      width: '100%',
      height: '100%',
    },
    calendarTextOverlay: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    calendarText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.onImage,
      textAlign: 'center',
      textShadowColor: colors.scrim,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 6,
    },
    calendarDateRow: {
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    calendarDateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.onImage,
      textShadowColor: colors.scrim,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    calendarLogo: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.imageControl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarLogoText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.onImage,
    },
    loadingContainer: {
      paddingVertical: 16,
      alignItems: 'center',
      gap: 8,
    },
    timeInputs: {
      flexDirection: 'row',
      gap: 12,
    },
    inputBlock: {
      flex: 1,
      gap: 6,
    },
    appearanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
  });
}

export function useHomeScreenStyles() {
  const { theme } = useTheme();

  return useMemo(() => createHomeScreenStyles(theme), [theme]);
}
