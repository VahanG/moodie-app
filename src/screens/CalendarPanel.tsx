import React, { useMemo } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, useWindowDimensions, View } from 'react-native';
import { AppText } from '../components/ui';
import { useTheme } from '../theme';
import { useCalendarPanelStyles } from './CalendarPanel.styles';
import { useLocalization } from '../features/localization';

const CALENDAR_BACKGROUND_URI =
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80';

function getDateParts(date: Date, languageCode: string) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString(languageCode, { month: 'short' });
  const weekday = date.toLocaleString(languageCode, { weekday: 'long' });
  const year = date.getFullYear().toString();
  return { day, month, weekday, year };
}

const CalendarPanel: React.FC = () => {
  const styles = useCalendarPanelStyles();
  const { theme } = useTheme();
  const { languageCode, t } = useLocalization();
  const { height: windowHeight } = useWindowDimensions();
  const isCompactLayout = windowHeight < 700;
  const { day, month, weekday, year } = useMemo(
    () => getDateParts(new Date(), languageCode),
    [languageCode],
  );
  const accessibleDate = `${weekday}, ${month} ${day}, ${year}`;

  return (
    <View
      style={[styles.screen, isCompactLayout && styles.screenCompact]}
      testID="screen-calendar"
    >
      <View
        style={[styles.pageHeader, isCompactLayout && styles.pageHeaderCompact]}
      >
        <AppText testID="text-calendar-heading" variant="title">
          {t('calendar.title')}
        </AppText>
        <AppText tone="muted">
          {t('calendar.subtitle')}
        </AppText>
      </View>

      <View style={styles.mediaCard}>
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          source={{ uri: CALENDAR_BACKGROUND_URI }}
          style={styles.image}
          resizeMode="cover"
          testID="image-calendar-background"
        />
        <View pointerEvents="none" style={styles.imageOverlay} />
        <View
          style={[styles.content, isCompactLayout && styles.contentCompact]}
        >
          <View style={styles.todayPill}>
            <Ionicons
              color={theme.colors.onImage}
              name="calendar-clear-outline"
              size={17}
            />
            <AppText style={styles.todayText} variant="label">
              {t('calendar.today')}
            </AppText>
          </View>

          <View
            accessibilityLabel={accessibleDate}
            accessible
            style={styles.dateBlock}
            testID="text-calendar-date"
          >
            <AppText style={styles.weekday}>{weekday}</AppText>
            <AppText style={[styles.day, isCompactLayout && styles.dayCompact]}>
              {day}
            </AppText>
            <AppText style={styles.monthYear}>
              {month.toUpperCase()} · {year}
            </AppText>
          </View>

          <View
            style={[
              styles.reflectionCard,
              isCompactLayout && styles.reflectionCardCompact,
            ]}
          >
            <View style={styles.reflectionIcon}>
              <Ionicons
                color={theme.colors.onImage}
                name="sparkles-outline"
                size={19}
              />
            </View>
            <View style={styles.reflectionCopy}>
              <AppText style={styles.reflectionEyebrow} variant="caption">
                {t('calendar.reflection')}
              </AppText>
              <AppText
                style={styles.reflectionMessage}
                testID="text-calendar-message"
                tone="onImage"
                variant="heading"
              >
                {t('calendar.message')}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CalendarPanel;
