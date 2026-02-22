import { AffirmationTopic, AffirmationTopicId } from './types';

export const DEFAULT_AFFIRMATION_TOPIC_ID: AffirmationTopicId = 'growth';

export const AFFIRMATION_TOPICS: AffirmationTopic[] = [
  {
    id: 'growth',
    name: 'Growth',
    imageUri:
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    affirmations: [
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
        text: 'Progress is built one brave choice at a time.',
      },
    ],
  },
  {
    id: 'calm',
    name: 'Calm',
    imageUri:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
    affirmations: [
      {
        imageUri:
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
        text: 'Your calm is your strength.',
      },
      {
        imageUri:
          'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=800&q=80',
        text: 'You can slow down and still move forward.',
      },
      {
        imageUri:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        text: 'A steady breath brings you back to center.',
      },
    ],
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    imageUri:
      'https://images.unsplash.com/photo-1482192597420-4818b0bdb5af?auto=format&fit=crop&w=800&q=80',
    affirmations: [
      {
        imageUri:
          'https://images.unsplash.com/photo-1482192597420-4818b0bdb5af?auto=format&fit=crop&w=800&q=80',
        text: 'There is something good in this moment.',
      },
      {
        imageUri:
          'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80',
        text: 'Gratitude helps your day open up.',
      },
      {
        imageUri:
          'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80',
        text: 'You have more support than you can see.',
      },
    ],
  },
];

export function isAffirmationTopicId(value: unknown): value is AffirmationTopicId {
  return (
    typeof value === 'string' &&
    AFFIRMATION_TOPICS.some(topic => topic.id === value)
  );
}

export function getAffirmationTopicById(id: AffirmationTopicId): AffirmationTopic {
  return (
    AFFIRMATION_TOPICS.find(topic => topic.id === id) ??
    AFFIRMATION_TOPICS[0]
  );
}
