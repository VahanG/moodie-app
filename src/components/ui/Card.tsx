import React, { useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../theme';
import { createCardStyles } from './Card.styles';

type Props = ViewProps & {
  variant?: 'default' | 'elevated' | 'outlined';
};

export const Card: React.FC<Props> = ({
  variant = 'default',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createCardStyles(theme), [theme]);

  return <View {...props} style={[styles.base, styles[variant], style]} />;
};
