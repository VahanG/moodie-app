import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomNavigation, type BottomNavigationItem } from '../components/ui';

type Props = {
  activePage: number;
  onSelectPage: (page: number) => void;
};

const navigationItems: BottomNavigationItem<number>[] = [
  {
    key: 0,
    label: 'Today',
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
    label: 'Calendar',
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
    label: 'Settings',
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

const HomeFooter: React.FC<Props> = ({ activePage, onSelectPage }) => (
  <BottomNavigation
    activeKey={activePage}
    items={navigationItems}
    onSelect={onSelectPage}
    testID="navigation-home"
  />
);

export default HomeFooter;
