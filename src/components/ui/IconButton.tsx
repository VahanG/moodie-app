import React, { ReactNode, useMemo } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { createIconButtonStyles } from './IconButton.styles';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  accessibilityLabel: string;
  icon: ReactNode;
  variant?: 'surface' | 'onImage' | 'ghost';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const IconButton: React.FC<Props> = ({
  accessibilityLabel,
  icon,
  variant = 'surface',
  compact = false,
  disabled = false,
  accessibilityState,
  onPress,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createIconButtonStyles(theme), [theme]);
  const isDisabled = disabled === true;

  return (
    <Pressable
      {...props}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ ...accessibilityState, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        compact && styles.compact,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon}
    </Pressable>
  );
};
