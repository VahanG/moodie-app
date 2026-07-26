import React, { ReactNode, useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { createSettingsSectionHeaderStyles } from './SettingsSectionHeader.styles';

type Props = ViewProps & {
  description: string;
  icon: ReactNode;
  title: string;
  trailing?: ReactNode;
};

export const SettingsSectionHeader: React.FC<Props> = ({
  description,
  icon,
  title,
  trailing,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const styles = useMemo(
    () => createSettingsSectionHeaderStyles(theme),
    [theme],
  );

  return (
    <View {...props} style={[styles.container, style]}>
      <View style={styles.icon}>{icon}</View>
      <View style={styles.copy}>
        <AppText variant="heading">{title}</AppText>
        <AppText tone="muted" variant="caption">
          {description}
        </AppText>
      </View>
      {trailing}
    </View>
  );
};
