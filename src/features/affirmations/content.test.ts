import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAffirmationContent, parseAffirmationContentRows } from './content';

const mockFrom = jest.fn();
const mockCreateSignedUrls = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
jest.mock('../supabase', () => ({
  getSupabaseClient: () => ({
    from: mockFrom,
    storage: {
      from: () => ({ createSignedUrls: mockCreateSignedUrls }),
    },
  }),
}));

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;

function buildQuery(
  result: { data: unknown[] | null; error: Error | null },
  waitFor: Promise<unknown> = Promise.resolve(),
) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    then: (
      resolve: (value: typeof result) => unknown,
      reject: (reason: unknown) => unknown,
    ) => waitFor.then(() => result).then(resolve, reject),
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

    expect(
      parseAffirmationContentRows(
        topics,
        topicTranslations,
        affirmations,
        affirmationTranslations,
        backgrounds,
        [],
      ).backgrounds,
    ).toEqual([]);
  });

  test('keeps only affirmations translated into the selected language', () => {
    expect(
      parseAffirmationContentRows(
        topics,
        topicTranslations,
        affirmations,
        [affirmationTranslations[0]],
        backgrounds,
        backgroundTranslations,
      ).topics[0].affirmations,
    ).toEqual([
      {
        id: 'affirmation-2',
        text: 'Second',
        imageUri: 'https://example.com/second.jpg',
      },
    ]);
  });

  test('keeps a translated affirmation when its topic name is untranslated', () => {
    expect(
      parseAffirmationContentRows(
        topics,
        [],
        affirmations,
        [affirmationTranslations[0]],
        backgrounds,
        [],
      ).topics,
    ).toEqual([
      {
        id: 'growth',
        name: null,
        imageUri: 'https://example.com/growth.jpg',
        affirmations: [
          {
            id: 'affirmation-2',
            text: 'Second',
            imageUri: 'https://example.com/second.jpg',
          },
        ],
      },
    ]);
  });

  test('keeps a translated affirmation when its suggested image is empty', () => {
    expect(
      parseAffirmationContentRows(
        topics,
        topicTranslations,
        [{ ...affirmations[0], image_uri: null }],
        [affirmationTranslations[0]],
        backgrounds,
        backgroundTranslations,
      ).topics[0].affirmations,
    ).toEqual([
      {
        id: 'affirmation-2',
        text: 'Second',
        imageUri: '',
      },
    ]);
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
    affirmation_topic_translations: [{ topic_id: 'growth', name: 'Growth' }],
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
  const cachedPayload = JSON.stringify({
    version: 3,
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
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue();
    mockCreateSignedUrls.mockResolvedValue({ data: [], error: null });
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
      '@moodie/affirmation-content-v3:en',
      expect.stringContaining('"version":3'),
    );
  });

  test('resolves stable gallery references to signed image URLs', async () => {
    const galleryRows: Record<string, unknown[]> = {
      ...rowsByTable,
      affirmation_topics: [
        {
          ...(rowsByTable.affirmation_topics[0] as Record<string, unknown>),
          image_uri: 'gallery://admin/topic.jpg',
        },
      ],
      affirmations: [
        {
          ...(rowsByTable.affirmations[0] as Record<string, unknown>),
          image_uri: 'gallery://admin/affirmation.jpg',
        },
      ],
      affirmation_backgrounds: [
        {
          ...(rowsByTable.affirmation_backgrounds[0] as Record<
            string,
            unknown
          >),
          image_uri: 'gallery://admin/background.jpg',
        },
      ],
    };
    mockFrom.mockImplementation((table: string) =>
      buildQuery({ data: galleryRows[table], error: null }),
    );
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: 'admin/topic.jpg', signedUrl: 'https://signed/topic.jpg' },
        {
          path: 'admin/affirmation.jpg',
          signedUrl: 'https://signed/affirmation.jpg',
        },
        {
          path: 'admin/background.jpg',
          signedUrl: 'https://signed/background.jpg',
        },
      ],
      error: null,
    });

    const loaded = await loadAffirmationContent('en');

    expect(mockCreateSignedUrls).toHaveBeenCalledWith(
      ['admin/topic.jpg', 'admin/affirmation.jpg', 'admin/background.jpg'],
      86400,
    );
    expect(loaded.content.topics[0].imageUri).toBe('https://signed/topic.jpg');
    expect(loaded.content.topics[0].affirmations[0].imageUri).toBe(
      'https://signed/affirmation.jpg',
    );
    expect(loaded.content.backgrounds[0].imageUri).toBe(
      'https://signed/background.jpg',
    );
  });

  test('publishes cached content before a delayed remote refresh finishes', async () => {
    let finishRemoteRefresh: () => void = () => undefined;
    const remoteRefreshGate = new Promise<void>(resolve => {
      finishRemoteRefresh = resolve;
    });
    mockGetItem.mockResolvedValue(cachedPayload);
    mockFrom.mockImplementation((table: string) =>
      buildQuery({ data: rowsByTable[table], error: null }, remoteRefreshGate),
    );
    const onCachedContent = jest.fn();
    let refreshFinished = false;

    const loading = loadAffirmationContent('en', onCachedContent).then(
      loaded => {
        refreshFinished = true;
        return loaded;
      },
    );
    await new Promise<void>(resolve => setImmediate(resolve));

    expect(onCachedContent).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'cache',
        content: expect.objectContaining({
          topics: expect.arrayContaining([
            expect.objectContaining({
              affirmations: expect.arrayContaining([
                expect.objectContaining({ text: 'Cached affirmation.' }),
              ]),
            }),
          ]),
        }),
      }),
    );
    expect(refreshFinished).toBe(false);

    finishRemoteRefresh();
    const loaded = await loading;

    expect(loaded.source).toBe('remote');
    expect(loaded.content.topics[0].affirmations[0].text).toBe('Keep going.');
  });

  test('does not delay fresh remote content behind a slower cache read', async () => {
    let finishCacheRead: (value: string | null) => void = () => undefined;
    const cacheRead = new Promise<string | null>(resolve => {
      finishCacheRead = resolve;
    });
    mockGetItem.mockReturnValue(cacheRead);
    mockFrom.mockImplementation((table: string) =>
      buildQuery({ data: rowsByTable[table], error: null }),
    );
    const onCachedContent = jest.fn();

    const loaded = await loadAffirmationContent('en', onCachedContent);

    expect(loaded.source).toBe('remote');
    expect(loaded.content.topics[0].affirmations[0].text).toBe('Keep going.');
    finishCacheRead(cachedPayload);
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(onCachedContent).not.toHaveBeenCalled();
  });

  test('uses only the selected languages last-known-good cache', async () => {
    mockFrom.mockImplementation(() =>
      buildQuery({ data: null, error: new Error('offline') }),
    );
    mockGetItem.mockResolvedValue(cachedPayload);

    const loaded = await loadAffirmationContent('en');

    expect(mockGetItem).toHaveBeenCalledWith(
      '@moodie/affirmation-content-v3:en',
    );
    expect(loaded.content.topics[0].affirmations[0].text).toBe(
      'Cached affirmation.',
    );
  });
});
