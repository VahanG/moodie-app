import React, { useState } from 'react';
import { View } from 'react-native';
import { type ThemePreference, useTheme } from '../theme';
import { useHomeScreenStyles } from './HomeScreen.styles';
import {
  AppText,
  Card,
  SegmentedControl,
  type SegmentedControlOption,
} from '../components/ui';

const appearanceOptions: SegmentedControlOption[] = [
  { label: 'System', value: 'system', testID: 'btn-theme-system' },
  { label: 'Light', value: 'light', testID: 'btn-theme-light' },
  { label: 'Dark', value: 'dark', testID: 'btn-theme-dark' },
];

const AppearanceSection: React.FC = () => {
  const styles = useHomeScreenStyles();
  const { preference, resolvedMode, setPreference } = useTheme();
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
    <Card variant="outlined" testID="section-appearance">
      <View style={styles.appearanceHeader}>
        <AppText variant="heading">Appearance</AppText>
        <AppText
          tone="muted"
          variant="caption"
          testID={`theme-resolved-${resolvedMode}`}
        >
          {resolvedMode === 'dark' ? 'Dark active' : 'Light active'}
        </AppText>
      </View>
      <AppText tone="muted">Choose how Moodie looks on this device.</AppText>
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
