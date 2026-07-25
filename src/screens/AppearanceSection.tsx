import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type ThemePreference, useTheme } from '../theme';
import { useHomeScreenStyles } from './HomeScreen.styles';

const appearanceOptions: Array<{
  label: string;
  value: ThemePreference;
}> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
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
    <View style={styles.appearanceSection} testID="section-appearance">
      <View style={styles.appearanceHeader}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text
          style={styles.appearanceResolvedText}
          testID={`theme-resolved-${resolvedMode}`}
        >
          {resolvedMode === 'dark' ? 'Dark active' : 'Light active'}
        </Text>
      </View>
      <Text style={styles.subtitle}>
        Choose how Moodie looks on this device.
      </Text>
      <View accessibilityRole="radiogroup" style={styles.appearanceOptions}>
        {appearanceOptions.map(option => {
          const isSelected = preference === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => {
                selectPreference(option.value);
              }}
              style={[
                styles.appearanceOption,
                isSelected && styles.appearanceOptionSelected,
              ]}
              testID={`btn-theme-${option.value}`}
            >
              <Text
                style={[
                  styles.appearanceOptionText,
                  isSelected && styles.appearanceOptionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
};

export default AppearanceSection;
