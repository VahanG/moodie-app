import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, useWindowDimensions, View } from 'react-native';
import { AppText } from '../components/ui';
import { useTheme } from '../theme';
import { useCalendarPanelStyles } from './CalendarPanel.styles';
import { useLocalization } from '../features/localization';
import type { AffirmationBackground } from '../features/affirmations/types';

type Props = {
  backgrounds: AffirmationBackground[];
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function getDailyBackgroundImageUri(
  backgrounds: AffirmationBackground[],
  date: Date,
): string | null {
  if (backgrounds.length === 0) return null;

  const localDay = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const backgroundIndex =
    Math.floor(localDay / MILLISECONDS_PER_DAY) % backgrounds.length;
  return backgrounds[backgroundIndex].imageUri;
}

function getDateParts(date: Date, languageCode: string) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString(languageCode, { month: 'short' });
  const weekday = date.toLocaleString(languageCode, { weekday: 'long' });
  const year = date.getFullYear().toString();
  return { day, month, weekday, year };
}

const CalendarPanel: React.FC<Props> = ({ backgrounds }) => {
  const styles = useCalendarPanelStyles();
  const { theme } = useTheme();
  const { languageCode, t } = useLocalization();
  const { height: windowHeight } = useWindowDimensions();
  const isCompactLayout = windowHeight < 700;
  const today = new Date();
  const { day, month, weekday, year } = getDateParts(today, languageCode);
  const backgroundImageUri = getDailyBackgroundImageUri(backgrounds, today);
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
        <AppText tone="muted">{t('calendar.subtitle')}</AppText>
      </View>

      <View style={styles.mediaCard}>
        {backgroundImageUri ? (
          <Image
            accessibilityIgnoresInvertColors
            accessible={false}
            source={{ uri: backgroundImageUri }}
            style={styles.image}
            resizeMode="cover"
            testID="image-calendar-background"
          />
        ) : null}
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
