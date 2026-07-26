import React, { ReactNode, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { createAppButtonStyles } from './AppButton.styles';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: AppButtonVariant;
  compact?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  leadingAccessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const AppButton: React.FC<Props> = ({
  label,
  variant = 'primary',
  compact = false,
  fullWidth = true,
  loading = false,
  leadingAccessory,
  disabled = false,
  accessibilityState,
  onPress,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createAppButtonStyles(theme), [theme]);
  const isDisabled = disabled || loading;
  const indicatorColor =
    variant === 'danger'
      ? theme.colors.onDanger
      : variant === 'primary'
      ? theme.colors.onAccent
      : theme.colors.accent;

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityState={{
        ...accessibilityState,
        busy: loading,
        disabled: isDisabled,
      }}
      disabled={isDisabled}
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        compact && styles.compact,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={indicatorColor} />
      ) : (
        leadingAccessory
      )}
      <AppText variant="label" style={styles[`${variant}Text`]}>
        {label}
      </AppText>
    </Pressable>
  );
};
