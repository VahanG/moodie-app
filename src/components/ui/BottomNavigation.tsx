import React, { ReactNode, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { createBottomNavigationStyles } from './BottomNavigation.styles';
import { useLocalization } from '../../features/localization';

export type BottomNavigationIconProps = {
  color: string;
  selected: boolean;
  size: number;
};

export type BottomNavigationItem<Key extends React.Key> = {
  key: Key;
  label: string;
  testID: string;
  renderIcon: (props: BottomNavigationIconProps) => ReactNode;
};

type Props<Key extends React.Key> = {
  activeKey: Key;
  items: BottomNavigationItem<Key>[];
  onSelect: (key: Key) => void;
  testID?: string;
};

export function BottomNavigation<Key extends React.Key>({
  activeKey,
  items,
  onSelect,
  testID,
}: Props<Key>) {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createBottomNavigationStyles(theme), [theme]);

  return (
    <View style={styles.shell}>
      <View
        accessibilityLabel={t('navigation.primary')}
        accessibilityRole="tablist"
        style={styles.navigation}
        testID={testID}
      >
        {items.map(item => {
          const isSelected = item.key === activeKey;
          const color = isSelected
            ? theme.colors.accent
            : theme.colors.textMuted;

          return (
            <Pressable
              key={item.key}
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.item,
                isSelected && styles.itemSelected,
                pressed && styles.itemPressed,
              ]}
              testID={item.testID}
            >
              {item.renderIcon({ color, selected: isSelected, size: 22 })}
              <AppText
                style={styles.label}
                tone={isSelected ? 'accent' : 'muted'}
                variant="caption"
              >
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
