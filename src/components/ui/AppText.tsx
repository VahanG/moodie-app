import React, { useMemo } from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '../../theme';
import { createAppTextStyles } from './AppText.styles';

export type AppTextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption';

export type AppTextTone =
  | 'default'
  | 'muted'
  | 'accent'
  | 'danger'
  | 'onImage'
  | 'onAccent';

type Props = TextProps & {
  variant?: AppTextVariant;
  tone?: AppTextTone;
};

export const AppText: React.FC<Props> = ({
  variant = 'body',
  tone = 'default',
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createAppTextStyles(theme), [theme]);

  return (
    <Text
      {...props}
      style={[
        styles.base,
        styles[variant],
        tone !== 'default' && styles[tone],
        style,
      ]}
    />
  );
};
