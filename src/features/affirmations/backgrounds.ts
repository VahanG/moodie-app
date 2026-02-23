import {
  AffirmationBackground,
  AffirmationBackgroundId,
  AffirmationBackgroundMode,
} from './types';

export const DEFAULT_AFFIRMATION_BACKGROUND_MODE: AffirmationBackgroundMode = 'free';

export const AFFIRMATION_BACKGROUNDS: AffirmationBackground[] = [
  {
    id: 'sunrise-lake',
    imageUri:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    tags: ['nature', 'sunrise', 'calm'],
  },
  {
    id: 'forest-path',
    imageUri:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    tags: ['nature', 'forest', 'growth'],
  },
  {
    id: 'mountain-horizon',
    imageUri:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    tags: ['mountain', 'focus', 'resilience'],
  },
  {
    id: 'ocean-wave',
    imageUri:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    tags: ['ocean', 'calm', 'blue'],
  },
  {
    id: 'city-glow',
    imageUri:
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80',
    tags: ['city', 'night', 'motivation'],
  },
  {
    id: 'desert-dunes',
    imageUri:
      'https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=800&q=80',
    tags: ['desert', 'warm', 'focus'],
  },
  {
    id: 'golden-field',
    imageUri:
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
    tags: ['gratitude', 'warm', 'sunlight'],
  },
  {
    id: 'cozy-home',
    imageUri:
      'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&q=80',
    tags: ['cozy', 'self-love', 'comfort'],
  },
  {
    id: 'aurora-night',
    imageUri:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    tags: ['night', 'confidence', 'sky'],
  },
];

export function isAffirmationBackgroundMode(
  value: unknown,
): value is AffirmationBackgroundMode {
  return value === 'free' || value === 'fixed';
}

export function isAffirmationBackgroundId(
  value: unknown,
): value is AffirmationBackgroundId {
  return (
    typeof value === 'string' &&
    AFFIRMATION_BACKGROUNDS.some(background => background.id === value)
  );
}

export function getAffirmationBackgroundById(
  id: AffirmationBackgroundId,
): AffirmationBackground | undefined {
  return AFFIRMATION_BACKGROUNDS.find(background => background.id === id);
}
