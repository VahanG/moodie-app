import React from 'react';
import { View, Text } from 'react-native';
import styles from './HomeScreen.styles';

type Props = {
  activePage: number;
};

const HomeFooter: React.FC<Props> = ({ activePage }) => (
  <View style={styles.footer}>
    <View style={styles.pageIcons}>
      <Text style={[styles.pageIcon, activePage === 0 && styles.pageIconActive]}>A</Text>
      <Text style={[styles.pageIcon, activePage === 1 && styles.pageIconActive]}>⚙</Text>
    </View>
    <Text style={styles.footerText}>
      {activePage === 1 ? 'Swipe right for affirmation' : 'Swipe left for settings'}
    </Text>
  </View>
);

export default HomeFooter;
