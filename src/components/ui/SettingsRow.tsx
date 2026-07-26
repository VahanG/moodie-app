import React, { ReactNode, useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { createSettingsRowStyles } from './SettingsRow.styles';

type Props = ViewProps & {
  label: string;
  description?: string;
  trailing: ReactNode;
};

export const SettingsRow: React.FC<Props> = ({
  label,
  description,
  trailing,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createSettingsRowStyles(theme), [theme]);

  return (
    <View {...props} style={[styles.container, style]}>
      <View style={styles.copy}>
        <AppText variant="label">{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
};
