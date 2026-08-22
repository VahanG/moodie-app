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

export type BottomNavigationVariant = 'default' | 'minimal' | 'onImage';

type Props<Key extends React.Key> = {
  activeKey: Key;
  items: BottomNavigationItem<Key>[];
  onSelect: (key: Key) => void;
  testID?: string;
  variant?: BottomNavigationVariant;
};

export function BottomNavigation<Key extends React.Key>({
  activeKey,
  items,
  onSelect,
  testID,
  variant = 'default',
}: Props<Key>) {
  const { theme } = useTheme();
  const { t } = useLocalization();
  const styles = useMemo(() => createBottomNavigationStyles(theme), [theme]);
  const isMinimal = variant !== 'default';
  const isOnImage = variant === 'onImage';

  return (
    <View style={[styles.shell, isMinimal && styles.shellMinimal]}>
      <View
        accessibilityLabel={t('navigation.primary')}
        accessibilityRole="tablist"
        style={[styles.navigation, isMinimal && styles.navigationMinimal]}
        testID={testID}
      >
        {items.map(item => {
          const isSelected = item.key === activeKey;
          let color = isSelected
            ? theme.colors.accent
            : theme.colors.textMuted;

          if (isOnImage) {
            color = isSelected
              ? theme.colors.onImage
              : theme.colors.onImageMuted;
          }

          return (
            <Pressable
              key={item.key}
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(item.key)}
              style={({ pressed }) => [
                styles.item,
                isMinimal && styles.itemMinimal,
                isSelected && !isMinimal && styles.itemSelected,
                pressed && styles.itemPressed,
              ]}
              testID={item.testID}
            >
              {item.renderIcon({
                color,
                selected: isSelected,
                size: isMinimal ? 25 : 22,
              })}
              {!isMinimal ? (
                <AppText
                  style={styles.label}
                  tone={isSelected ? 'accent' : 'muted'}
                  variant="caption"
                >
                  {item.label}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
