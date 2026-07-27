import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomNavigation, type BottomNavigationItem } from '../components/ui';
import { useLocalization } from '../features/localization';

type Props = {
  activePage: number;
  onSelectPage: (page: number) => void;
};

const HomeFooter: React.FC<Props> = ({ activePage, onSelectPage }) => {
  const { t } = useLocalization();
  const navigationItems: BottomNavigationItem<number>[] = [
    {
      key: 0,
      label: t('navigation.today'),
      testID: 'btn-nav-affirmations',
      renderIcon: ({ color, selected, size }) => (
        <Ionicons
          color={color}
          name={selected ? 'sparkles' : 'sparkles-outline'}
          size={size}
        />
      ),
    },
    {
      key: 1,
      label: t('navigation.calendar'),
      testID: 'btn-nav-calendar',
      renderIcon: ({ color, selected, size }) => (
        <Ionicons
          color={color}
          name={selected ? 'calendar-clear' : 'calendar-clear-outline'}
          size={size}
        />
      ),
    },
    {
      key: 2,
      label: t('navigation.settings'),
      testID: 'btn-nav-settings',
      renderIcon: ({ color, selected, size }) => (
        <Ionicons
          color={color}
          name={selected ? 'options' : 'options-outline'}
          size={size}
        />
      ),
    },
  ];

  return (
    <BottomNavigation
      activeKey={activePage}
      items={navigationItems}
      onSelect={onSelectPage}
      testID="navigation-home"
    />
  );
};

export default HomeFooter;
