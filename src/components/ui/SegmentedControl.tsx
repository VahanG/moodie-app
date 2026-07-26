import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { createSegmentedControlStyles } from './SegmentedControl.styles';

export type SegmentedControlOption = {
  label: string;
  value: string;
  testID?: string;
};

type Props = {
  value: string;
  options: SegmentedControlOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export const SegmentedControl: React.FC<Props> = ({
  value,
  options,
  onChange,
  disabled = false,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createSegmentedControlStyles(theme), [theme]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={styles.container}
      testID={testID}
    >
      {options.map(option => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              disabled && styles.optionDisabled,
              pressed && styles.optionPressed,
            ]}
            testID={option.testID}
          >
            <AppText variant="label" tone={isSelected ? 'onAccent' : 'muted'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};
