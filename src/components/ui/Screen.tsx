import React, { ReactNode, useMemo } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { createScreenStyles } from './Screen.styles';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  testID?: string;
};

export const Screen: React.FC<Props> = ({
  children,
  scroll = false,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  testID,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createScreenStyles(theme), [theme]);

  if (scroll) {
    return (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        style={[styles.root, style]}
        testID={testID}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.root, style]} testID={testID}>
      {children}
    </View>
  );
};
