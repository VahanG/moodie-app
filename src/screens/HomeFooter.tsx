import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  BottomNavigation,
  type BottomNavigationItem,
  type BottomNavigationVariant,
} from '../components/ui';
import { useLocalization } from '../features/localization';
import {
  CALENDAR_PAGE_VISIBLE,
  HOME_SETTINGS_PAGE_INDEX,
} from './homePager';

type Props = {
  activePage: number;
  onOpenTopicSelection: () => void;
  onSelectPage: (page: number) => void;
  variant?: BottomNavigationVariant;
};

const HomeFooter: React.FC<Props> = ({
  activePage,
  onOpenTopicSelection,
  onSelectPage,
  variant = 'default',
}) => {
  const { t } = useLocalization();
  const calendarNavigationItems: BottomNavigationItem<number>[] =
    CALENDAR_PAGE_VISIBLE
      ? [
          {
            key: 1,
            label: t('navigation.calendar'),
            testID: 'btn-nav-calendar',
            renderIcon: ({ color, selected, size }) => (
              <Ionicons
                color={color}
                name={
                  selected ? 'calendar-clear' : 'calendar-clear-outline'
                }
                size={size}
              />
            ),
          },
        ]
      : [];
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
    ...calendarNavigationItems,
    {
      key: HOME_SETTINGS_PAGE_INDEX,
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
      onSelect={page => {
        if (page === 0) {
          onOpenTopicSelection();
          return;
        }

        onSelectPage(page);
      }}
      testID="navigation-home"
      variant={variant}
    />
  );
};

export default HomeFooter;
