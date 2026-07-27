import React, { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import { type ThemePreference, useTheme } from '../theme';
import {
  AppText,
  Card,
  SegmentedControl,
  type SegmentedControlOption,
  SettingsSectionHeader,
} from '../components/ui';
import { useSettingsPanelStyles } from './SettingsPanel.styles';
import { useLocalization } from '../features/localization';

const AppearanceSection: React.FC = () => {
  const styles = useSettingsPanelStyles();
  const { preference, resolvedMode, setPreference, theme } = useTheme();
  const { t } = useLocalization();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const appearanceOptions: SegmentedControlOption[] = [
    {
      label: t('appearance.system'),
      value: 'system',
      testID: 'btn-theme-system',
    },
    {
      label: t('appearance.light'),
      value: 'light',
      testID: 'btn-theme-light',
    },
    {
      label: t('appearance.dark'),
      value: 'dark',
      testID: 'btn-theme-dark',
    },
  ];

  const selectPreference = async (nextPreference: ThemePreference) => {
    setErrorMessage(null);

    try {
      await setPreference(nextPreference);
    } catch {
      setErrorMessage(t('appearance.saveError'));
    }
  };

  return (
    <Card style={styles.card} variant="elevated" testID="section-appearance">
      <SettingsSectionHeader
        description={t('appearance.description')}
        icon={
          <Ionicons
            color={theme.colors.accent}
            name="contrast-outline"
            size={22}
          />
        }
        title={t('appearance.title')}
        trailing={
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <AppText
              tone="accent"
              variant="caption"
              testID={`theme-resolved-${resolvedMode}`}
            >
              {resolvedMode === 'dark'
                ? t('appearance.dark')
                : t('appearance.light')}
            </AppText>
          </View>
        }
      />
      <SegmentedControl
        accessibilityLabel={t('appearance.accessibility')}
        onChange={value => selectPreference(value as ThemePreference)}
        options={appearanceOptions}
        value={preference}
      />
      {errorMessage ? (
        <AppText accessibilityLiveRegion="polite" tone="danger">
          {errorMessage}
        </AppText>
      ) : null}
    </Card>
  );
};

export default AppearanceSection;
