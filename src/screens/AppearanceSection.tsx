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

const appearanceOptions: SegmentedControlOption[] = [
  { label: 'System', value: 'system', testID: 'btn-theme-system' },
  { label: 'Light', value: 'light', testID: 'btn-theme-light' },
  { label: 'Dark', value: 'dark', testID: 'btn-theme-dark' },
];

const AppearanceSection: React.FC = () => {
  const styles = useSettingsPanelStyles();
  const { preference, resolvedMode, setPreference, theme } = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectPreference = async (nextPreference: ThemePreference) => {
    setErrorMessage(null);

    try {
      await setPreference(nextPreference);
    } catch {
      setErrorMessage('Could not save your appearance preference.');
    }
  };

  return (
    <Card style={styles.card} variant="elevated" testID="section-appearance">
      <SettingsSectionHeader
        description="Choose how Moodie looks on this device."
        icon={
          <Ionicons
            color={theme.colors.accent}
            name="contrast-outline"
            size={22}
          />
        }
        title="Appearance"
        trailing={
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <AppText
              tone="accent"
              variant="caption"
              testID={`theme-resolved-${resolvedMode}`}
            >
              {resolvedMode === 'dark' ? 'Dark' : 'Light'}
            </AppText>
          </View>
        }
      />
      <SegmentedControl
        accessibilityLabel="Application appearance"
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
