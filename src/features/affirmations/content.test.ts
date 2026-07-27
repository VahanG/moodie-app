import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAffirmationContent, parseAffirmationContentRows } from './content';

const mockFrom = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('../supabase', () => ({
  getSupabaseClient: () => ({ from: mockFrom }),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

function buildQuery(result: { data: unknown[] | null; error: Error | null }) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    then: (
      resolve: (value: typeof result) => unknown,
      reject: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  return query;
}

describe('affirmation content parsing', () => {
  const topics = [
    {
      id: 'calm',
      image_uri: 'https://example.com/calm.jpg',
      sort_order: 20,
    },
    {
      id: 'growth',
      image_uri: 'https://example.com/growth.jpg',
      sort_order: 10,
    },
  ];
  const topicTranslations = [
    { topic_id: 'growth', name: 'Growth' },
    { topic_id: 'calm', name: 'Calm' },
  ];
  const affirmations = [
    {
      id: 'affirmation-2',
      topic_id: 'growth',
      image_uri: 'https://example.com/second.jpg',
      sort_order: 20,
    },
    {
      id: 'affirmation-1',
      topic_id: 'growth',
      image_uri: 'https://example.com/first.jpg',
      sort_order: 10,
    },
  ];
  const affirmationTranslations = [
    { affirmation_id: 'affirmation-2', text: 'Second' },
    { affirmation_id: 'affirmation-1', text: 'First' },
  ];
  const backgrounds = [
    {
      id: 'forest',
      image_uri: 'https://example.com/forest.jpg',
      sort_order: 10,
    },
  ];
  const backgroundTranslations = [
    {
      background_id: 'forest',
      tags: [' Nature ', 'nature', 'calm'],
    },
  ];

  test('normalizes and orders selected-language rows', () => {
    expect(
      parseAffirmationContentRows(
        topics,
        topicTranslations,
        affirmations,
        affirmationTranslations,
        backgrounds,
        backgroundTranslations,
      ),
    ).toEqual({
      topics: [
        {
          id: 'growth',
          name: 'Growth',
          imageUri: 'https://example.com/growth.jpg',
          affirmations: [
            {
              id: 'affirmation-1',
              text: 'First',
              imageUri: 'https://example.com/first.jpg',
            },
            {
              id: 'affirmation-2',
              text: 'Second',
              imageUri: 'https://example.com/second.jpg',
            },
          ],
        },
      ],
      backgrounds: [
        {
          id: 'forest',
          imageUri: 'https://example.com/forest.jpg',
          tags: ['nature', 'calm'],
        },
      ],
    });
  });

  test('hides every item missing a selected-language translation', () => {
    expect(() =>
      parseAffirmationContentRows(
        topics,
        topicTranslations,
        affirmations,
        [],
        backgrounds,
        backgroundTranslations,
      ),
    ).toThrow('No published affirmations');

    expect(() =>
      parseAffirmationContentRows(
        topics,
        topicTranslations,
        affirmations,
        affirmationTranslations,
        backgrounds,
        [],
      ),
    ).toThrow('No published affirmation backgrounds');
  });
});

describe('affirmation content loading', () => {
  const rowsByTable: Record<string, unknown[]> = {
    affirmation_topics: [
      {
        id: 'growth',
        image_uri: 'https://example.com/growth.jpg',
        sort_order: 10,
      },
    ],
    affirmation_topic_translations: [
      { topic_id: 'growth', name: 'Growth' },
    ],
    affirmations: [
      {
        id: 'affirmation-1',
        topic_id: 'growth',
        image_uri: 'https://example.com/affirmation.jpg',
        sort_order: 10,
      },
    ],
    affirmation_translations: [
      { affirmation_id: 'affirmation-1', text: 'Keep going.' },
    ],
    affirmation_backgrounds: [
      {
        id: 'forest',
        image_uri: 'https://example.com/forest.jpg',
        sort_order: 10,
      },
    ],
    affirmation_background_translations: [
      { background_id: 'forest', tags: ['growth'] },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue();
  });

  test('retrieves one language and caches it separately', async () => {
    mockFrom.mockImplementation((table: string) =>
      buildQuery({ data: rowsByTable[table], error: null }),
    );

    const loaded = await loadAffirmationContent('en');

    expect(loaded.source).toBe('remote');
    expect(loaded.content.topics[0].affirmations[0].text).toBe('Keep going.');
    expect(mockFrom).toHaveBeenCalledWith('affirmation_translations');
    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/affirmation-content-v2:en',
      expect.stringContaining('"version":2'),
    );
  });

  test('uses only the selected languages last-known-good cache', async () => {
    mockFrom.mockImplementation(() =>
      buildQuery({ data: null, error: new Error('offline') }),
    );
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        version: 2,
        topics: [
          {
            id: 'growth',
            name: 'Growth',
            imageUri: 'https://example.com/growth.jpg',
            affirmations: [
              {
                id: 'affirmation-1',
                text: 'Cached affirmation.',
                imageUri: 'https://example.com/affirmation.jpg',
              },
            ],
          },
        ],
        backgrounds: [
          {
            id: 'forest',
            imageUri: 'https://example.com/forest.jpg',
            tags: ['growth'],
          },
        ],
      }),
    );

    const loaded = await loadAffirmationContent('en');

    expect(mockGetItem).toHaveBeenCalledWith(
      '@moodie/affirmation-content-v2:en',
    );
    expect(loaded.content.topics[0].affirmations[0].text).toBe(
      'Cached affirmation.',
    );
  });
});
