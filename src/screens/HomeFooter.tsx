import React from 'react';
import { View, Text } from 'react-native';
import styles from './HomeScreen.styles';

type Props = {
  activePage: number;
};

const HomeFooter: React.FC<Props> = ({ activePage }) => (
  <View style={styles.footer}>
    <View style={styles.pageDots}>
      <View style={[styles.pageDot, activePage === 0 && styles.pageDotActive]} />
      <View style={[styles.pageDot, activePage === 1 && styles.pageDotActive]} />
    </View>
    <Text style={styles.footerText}>
      {activePage === 1 ? 'Swipe right for settings' : 'Swipe left for affirmation'}
    </Text>
  </View>
);

export default HomeFooter;
