import React from 'react';
import { View, Text } from 'react-native';
import { useHomeScreenStyles } from './HomeScreen.styles';

type Props = {
  activePage: number;
};

const HomeFooter: React.FC<Props> = ({ activePage }) => {
  const styles = useHomeScreenStyles();

  return (
    <View style={styles.footer}>
      <View style={styles.pageIcons}>
        <Text style={[styles.pageIcon, activePage === 0 && styles.pageIconActive]}>
          A
        </Text>
        <Text style={[styles.pageIcon, activePage === 1 && styles.pageIconActive]}>
          C
        </Text>
        <Text style={[styles.pageIcon, activePage === 2 && styles.pageIconActive]}>
          ⚙
        </Text>
      </View>
      <Text style={styles.footerText}>
        {activePage === 0
          ? 'Swipe left for calendar'
          : activePage === 1
            ? 'Swipe for affirmations or settings'
            : 'Swipe right for calendar'}
      </Text>
    </View>
  );
};

export default HomeFooter;
