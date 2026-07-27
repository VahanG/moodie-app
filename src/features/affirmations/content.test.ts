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
      name: 'Calm',
      image_uri: 'https://example.com/calm.jpg',
      sort_order: 20,
    },
    {
      id: 'growth',
      name: 'Growth',
      image_uri: 'https://example.com/growth.jpg',
      sort_order: 10,
    },
  ];
  const affirmations = [
    {
      id: 'affirmation-2',
      topic_id: 'growth',
      text: 'Second',
      image_uri: 'https://example.com/second.jpg',
      sort_order: 20,
    },
    {
      id: 'affirmation-1',
      topic_id: 'growth',
      text: 'First',
      image_uri: 'https://example.com/first.jpg',
      sort_order: 10,
    },
  ];
  const backgrounds = [
    {
      id: 'forest',
      image_uri: 'https://example.com/forest.jpg',
      tags: [' Nature ', 'nature', 'calm'],
      sort_order: 10,
    },
  ];

  test('normalizes and orders database rows', () => {
    expect(
      parseAffirmationContentRows(topics, affirmations, backgrounds),
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

  test('ignores unavailable topic rows and rejects empty published feeds', () => {
    expect(() =>
      parseAffirmationContentRows(
        topics,
        [{ ...affirmations[0], topic_id: 'missing' }],
        backgrounds,
      ),
    ).toThrow('No published affirmations');
  });
});

describe('affirmation content loading', () => {
  const topicRows = [
    {
      id: 'growth',
      name: 'Growth',
      image_uri: 'https://example.com/growth.jpg',
      sort_order: 10,
    },
  ];
  const affirmationRows = [
    {
      id: 'affirmation-1',
      topic_id: 'growth',
      text: 'Keep going.',
      image_uri: 'https://example.com/affirmation.jpg',
      sort_order: 10,
    },
  ];
  const backgroundRows = [
    {
      id: 'forest',
      image_uri: 'https://example.com/forest.jpg',
      tags: ['growth'],
      sort_order: 10,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetItem.mockResolvedValue();
  });

  test('retrieves published database content and caches it', async () => {
    const rowsByTable: Record<string, unknown[]> = {
      affirmation_topics: topicRows,
      affirmations: affirmationRows,
      affirmation_backgrounds: backgroundRows,
    };
    mockFrom.mockImplementation((table: string) =>
      buildQuery({ data: rowsByTable[table], error: null }),
    );

    const loaded = await loadAffirmationContent();

    expect(loaded.source).toBe('remote');
    expect(loaded.content.topics[0].affirmations[0].text).toBe('Keep going.');
    expect(mockFrom).toHaveBeenCalledWith('affirmation_topics');
    expect(mockFrom).toHaveBeenCalledWith('affirmations');
    expect(mockFrom).toHaveBeenCalledWith('affirmation_backgrounds');
    expect(mockSetItem).toHaveBeenCalledWith(
      '@moodie/affirmation-content-v1',
      expect.stringContaining('"version":1'),
    );
  });

  test('uses a validated last-known-good cache when the database fails', async () => {
    mockFrom.mockImplementation(() =>
      buildQuery({ data: null, error: new Error('offline') }),
    );
    mockGetItem.mockResolvedValue(
      JSON.stringify({
        version: 1,
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

    const loaded = await loadAffirmationContent();

    expect(loaded.source).toBe('cache');
    expect(loaded.content.topics[0].affirmations[0].text).toBe(
      'Cached affirmation.',
    );
  });
});
