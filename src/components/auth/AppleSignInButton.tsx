import React, { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../../theme';
import { appleSignInButtonStyles as styles } from './AppleSignInButton.styles';

type Props = {
  disabled?: boolean;
  onPress: () => void;
};

export const AppleSignInButton: React.FC<Props> = ({
  disabled = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AppleAuthentication.isAvailableAsync()
      .then(available => {
        if (isMounted) {
          setIsAvailable(available);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAvailable) {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      accessibilityState={{ disabled }}
      buttonStyle={
        theme.isDark
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      cornerRadius={theme.radii.md}
      onPress={disabled ? () => undefined : onPress}
      pointerEvents={disabled ? 'none' : 'auto'}
      style={[styles.button, disabled && styles.disabled]}
      testID="btn-sign-in-apple"
    />
  );
};
