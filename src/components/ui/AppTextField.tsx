import React, { forwardRef, useMemo } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { createAppTextFieldStyles } from './AppTextField.styles';

type Props = TextInputProps & {
  label?: string;
  helperText?: string;
  errorMessage?: string;
};

export const AppTextField = forwardRef<TextInput, Props>(
  (
    {
      label,
      helperText,
      errorMessage,
      editable = true,
      accessibilityLabel,
      style,
      ...props
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createAppTextFieldStyles(theme), [theme]);
    const feedbackText = errorMessage ?? helperText;

    return (
      <View style={styles.container}>
        {label ? <AppText variant="label">{label}</AppText> : null}
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityState={{ disabled: !editable }}
          editable={editable}
          placeholderTextColor={theme.colors.placeholder}
          selectionColor={theme.colors.accent}
          style={[
            styles.input,
            errorMessage && styles.inputError,
            !editable && styles.inputDisabled,
            style,
          ]}
        />
        {feedbackText ? (
          <AppText variant="caption" tone={errorMessage ? 'danger' : 'muted'}>
            {feedbackText}
          </AppText>
        ) : null}
      </View>
    );
  },
);

AppTextField.displayName = 'AppTextField';
