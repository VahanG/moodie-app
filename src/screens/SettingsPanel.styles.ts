import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { MoodieTheme, useTheme } from '../theme';

export function createSettingsPanelStyles(theme: MoodieTheme) {
  const { colors, radii, spacing } = theme;

  return StyleSheet.create({
    content: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
      paddingBottom: spacing.xs,
    },
    pageHeaderText: {
      flex: 1,
      gap: 2,
    },
    card: {
      gap: spacing.lg,
    },
    statusPill: {
      minHeight: 30,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.accentSoft,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: radii.pill,
      backgroundColor: colors.accent,
    },
    accountFields: {
      gap: spacing.md,
    },
    accountLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    authDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    authDividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    loadingContainer: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      gap: spacing.sm,
    },
    reminderRow: {
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.accentSoft,
    },
    notificationMode: {
      gap: spacing.md,
    },
    modeDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    timeInputs: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    inputBlock: {
      flex: 1,
      minWidth: 0,
    },
    statusBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.md,
      backgroundColor: colors.accentSoft,
    },
    statusMessage: {
      flex: 1,
    },
    languageList: {
      gap: spacing.sm,
      paddingTop: spacing.sm,
    },
  });
}

export function useSettingsPanelStyles() {
  const { theme } = useTheme();

  return useMemo(() => createSettingsPanelStyles(theme), [theme]);
}
