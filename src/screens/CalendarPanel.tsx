import React, { useMemo } from 'react';
import { Image, Text, View } from 'react-native';
import { useHomeScreenStyles } from './HomeScreen.styles';

const CALENDAR_BACKGROUND_URI =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80';

function getDateParts(date: Date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const weekday = date.toLocaleString('en-US', { weekday: 'long' });
  return { day, month, weekday };
}

const CalendarPanel: React.FC = () => {
  const styles = useHomeScreenStyles();
  const { day, month, weekday } = useMemo(() => getDateParts(new Date()), []);

  return (
    <View style={styles.calendarContent}>
      <Image
        source={{ uri: CALENDAR_BACKGROUND_URI }}
        style={styles.calendarImage}
        resizeMode="cover"
      />
      <View style={styles.calendarTextOverlay}>
        <Text style={styles.calendarText}>Your day is unfolding perfectly.</Text>
      </View>
      <View style={styles.calendarDateRow}>
        <Text style={styles.calendarDateText}>
          {day} {month}
        </Text>
        <View style={styles.calendarLogo}>
          <Text style={styles.calendarLogoText}>M</Text>
        </View>
        <Text style={styles.calendarDateText}>{weekday}</Text>
      </View>
    </View>
  );
};

export default CalendarPanel;
