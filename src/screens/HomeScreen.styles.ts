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
    pageWithMobileNavigation: {
      paddingBottom: 72,
    },
    affirmationPage: {
      overflow: 'hidden',
    },
    calendarPage: {
      overflow: 'hidden',
    },
    mobileFooter: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 10,
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
  });
}

export function useHomeScreenStyles() {
  const { theme } = useTheme();

  return useMemo(() => createHomeScreenStyles(theme), [theme]);
}
