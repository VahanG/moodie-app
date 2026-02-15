import React from 'react';
import { Image, Text, View } from 'react-native';
import styles from './HomeScreen.styles';


type AffirmationCard = {
  imageUri: string;
  text: string;
};


const AFFIRMATION_CARDS: AffirmationCard[] = [
  {
    imageUri:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    text: 'You are growing every day.',
  },
  {
    imageUri:
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80',
    text: 'Small steps create big change.',
  },
  {
    imageUri:
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    text: 'Your calm is your strength.',
  },
];

const getAffirmationForCurrentDay = () => {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % AFFIRMATION_CARDS.length;
  return AFFIRMATION_CARDS[dayIndex] ?? AFFIRMATION_CARDS[0];
}


const activeAffirmation = getAffirmationForCurrentDay();


const AffirmationPanel = () => (
  <View style={styles.affirmationContent}>
    <Image
      source={{ uri: activeAffirmation.imageUri }}
      style={styles.affirmationImage}
      resizeMode="cover"
    />
    <Text style={styles.affirmationText}>{activeAffirmation.text}</Text>
  </View>
);

export default AffirmationPanel;
