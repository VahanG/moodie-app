import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '../supabase';
import {
  AffirmationCard,
  AffirmationBackground,
  AffirmationContent,
  AffirmationTopic,
  LoadedAffirmationContent,
} from './types';

const CONTENT_CACHE_PREFIX = '@moodie/affirmation-content-v3:';
const CONTENT_CACHE_VERSION = 3;
const GALLERY_BUCKET = 'gallery';
const GALLERY_URI_PREFIX = 'gallery://';
const GALLERY_SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;

type TopicRow = {
  id: unknown;
  image_uri: unknown;
  sort_order: unknown;
};

type TopicTranslationRow = {
  topic_id: unknown;
  name: unknown;
};

type AffirmationRow = {
  id: unknown;
  topic_id: unknown;
  image_uri: unknown;
  sort_order: unknown;
};

type AffirmationTranslationRow = {
  affirmation_id: unknown;
  text: unknown;
};

type BackgroundRow = {
  id: unknown;
  image_uri: unknown;
  sort_order: unknown;
};

type BackgroundTranslationRow = {
  background_id: unknown;
  tags: unknown;
};

type OrderedAffirmation = AffirmationCard & { sortOrder: number };
type OrderedTopic = Omit<AffirmationTopic, 'affirmations'> & {
  affirmations: OrderedAffirmation[];
  sortOrder: number;
};

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${field} in affirmation content.`);
  }

  return value;
}

function optionalImageUri(value: unknown, field: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${field} in affirmation content.`);
  }

  return value.trim();
}

function requireOrder(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Invalid ${field} in affirmation content.`);
  }

  return value as number;
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid background tags in affirmation content.');
  }

  const tags = [
    ...new Set(
      value.map(tag =>
        requireString(tag, 'background tag').trim().toLowerCase(),
      ),
    ),
  ];

  if (tags.length === 0) {
    throw new Error('A background must contain at least one tag.');
  }

  return tags;
}

function compareOrdered(
  a: { sortOrder: number; id: string },
  b: { sortOrder: number; id: string },
): number {
  return a.sortOrder - b.sortOrder || a.id.localeCompare(b.id);
}

function galleryObjectPath(imageUri: string): string | null {
  if (!imageUri.startsWith(GALLERY_URI_PREFIX)) return null;
  const objectPath = imageUri.slice(GALLERY_URI_PREFIX.length);
  if (!objectPath) {
    throw new Error('Invalid gallery image URI in affirmation content.');
  }
  return objectPath;
}

async function resolveGalleryImageUris(
  content: AffirmationContent,
): Promise<AffirmationContent> {
  const imageUris = [
    ...content.topics.flatMap(topic => [
      topic.imageUri,
      ...topic.affirmations.map(affirmation => affirmation.imageUri),
    ]),
    ...content.backgrounds.map(background => background.imageUri),
  ];
  const objectPaths = [
    ...new Set(
      imageUris.flatMap(imageUri => {
        const objectPath = galleryObjectPath(imageUri);
        return objectPath ? [objectPath] : [];
      }),
    ),
  ];
  if (objectPaths.length === 0) return content;

  const { data, error } = await getSupabaseClient()
    .storage.from(GALLERY_BUCKET)
    .createSignedUrls(objectPaths, GALLERY_SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  const signedUrlByPath = new Map(
    (data ?? []).flatMap(item =>
      item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : [],
    ),
  );
  const resolveImageUri = (imageUri: string): string => {
    const objectPath = galleryObjectPath(imageUri);
    if (!objectPath) return imageUri;
    const signedUrl = signedUrlByPath.get(objectPath);
    if (!signedUrl) {
      throw new Error('A gallery image could not be loaded.');
    }
    return signedUrl;
  };

  return {
    topics: content.topics.map(topic => ({
      ...topic,
      imageUri: resolveImageUri(topic.imageUri),
      affirmations: topic.affirmations.map(affirmation => ({
        ...affirmation,
        imageUri: resolveImageUri(affirmation.imageUri),
      })),
    })),
    backgrounds: content.backgrounds.map(background => ({
      ...background,
      imageUri: resolveImageUri(background.imageUri),
    })),
  };
}

export function parseAffirmationContentRows(
  topicRows: TopicRow[],
  topicTranslationRows: TopicTranslationRow[],
  affirmationRows: AffirmationRow[],
  affirmationTranslationRows: AffirmationTranslationRow[],
  backgroundRows: BackgroundRow[],
  backgroundTranslationRows: BackgroundTranslationRow[],
): AffirmationContent {
  const topicNames = new Map(
    topicTranslationRows.map(row => [
      requireString(row.topic_id, 'topic translation id'),
      requireString(row.name, 'topic name'),
    ]),
  );
  const topicsById = new Map<string, OrderedTopic>();

  topicRows.forEach(row => {
    const id = requireString(row.id, 'topic id');
    if (topicsById.has(id)) {
      throw new Error(`Duplicate topic id "${id}" in affirmation content.`);
    }

    topicsById.set(id, {
      id,
      name: topicNames.get(id) ?? null,
      imageUri: requireString(row.image_uri, 'topic image URI'),
      sortOrder: requireOrder(row.sort_order, 'topic sort order'),
      affirmations: [],
    });
  });

  const affirmationTexts = new Map(
    affirmationTranslationRows.map(row => [
      requireString(row.affirmation_id, 'affirmation translation id'),
      requireString(row.text, 'affirmation text'),
    ]),
  );
  const seenAffirmationIds = new Set<string>();
  affirmationRows.forEach(row => {
    const id = requireString(row.id, 'affirmation id');
    const text = affirmationTexts.get(id);
    if (!text) return;
    if (seenAffirmationIds.has(id)) {
      throw new Error(
        `Duplicate affirmation id "${id}" in affirmation content.`,
      );
    }
    seenAffirmationIds.add(id);
    const topicId = requireString(row.topic_id, 'affirmation topic id');
    const topic = topicsById.get(topicId);
    if (!topic) return;

    topic.affirmations.push({
      id,
      text,
      imageUri: optionalImageUri(row.image_uri, 'affirmation image URI'),
      sortOrder: requireOrder(row.sort_order, 'affirmation sort order'),
    });
  });

  const topics = [...topicsById.values()]
    .filter(topic => topic.affirmations.length > 0)
    .sort(compareOrdered)
    .map(topic => ({
      id: topic.id,
      name: topic.name,
      imageUri: topic.imageUri,
      affirmations: topic.affirmations
        .sort(compareOrdered)
        .map(({ sortOrder: _sortOrder, ...affirmation }) => affirmation),
    }));

  const backgroundTags = new Map(
    backgroundTranslationRows.map(row => [
      requireString(row.background_id, 'background translation id'),
      parseTags(row.tags),
    ]),
  );
  const backgroundsWithOrder = backgroundRows.flatMap(row => {
    const id = requireString(row.id, 'background id');
    const tags = backgroundTags.get(id);
    if (!tags) return [];

    return [
      {
        id,
        imageUri: requireString(row.image_uri, 'background image URI'),
        tags,
        sortOrder: requireOrder(row.sort_order, 'background sort order'),
      },
    ];
  });
  const seenBackgroundIds = new Set<string>();
  backgroundsWithOrder.forEach(background => {
    if (seenBackgroundIds.has(background.id)) {
      throw new Error(
        `Duplicate background id "${background.id}" in affirmation content.`,
      );
    }
    seenBackgroundIds.add(background.id);
  });
  const backgrounds: AffirmationBackground[] = backgroundsWithOrder
    .sort(compareOrdered)
    .map(({ sortOrder: _sortOrder, ...background }) => background);

  if (
    topics.length === 0 ||
    topics.every(topic => topic.affirmations.length === 0)
  ) {
    throw new Error('No published affirmations are available.');
  }

  return { topics, backgrounds };
}

async function fetchPublishedAffirmationContent(
  languageCode: string,
): Promise<AffirmationContent> {
  const client = getSupabaseClient();
  const [
    topicsResult,
    topicTranslationsResult,
    affirmationsResult,
    affirmationTranslationsResult,
    backgroundsResult,
    backgroundTranslationsResult,
  ] = await Promise.all([
    client
      .from('affirmation_topics')
      .select('id,image_uri,sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_topic_translations')
      .select('topic_id,name')
      .eq('language_code', languageCode)
      .order('topic_id'),
    client
      .from('affirmations')
      .select('id,topic_id,image_uri,sort_order')
      .eq('is_published', true)
      .order('topic_id')
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_translations')
      .select('affirmation_id,text')
      .eq('language_code', languageCode)
      .order('affirmation_id'),
    client
      .from('affirmation_backgrounds')
      .select('id,image_uri,sort_order')
      .eq('is_published', true)
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_background_translations')
      .select('background_id,tags')
      .eq('language_code', languageCode)
      .order('background_id'),
  ]);

  const error =
    topicsResult.error ??
    topicTranslationsResult.error ??
    affirmationsResult.error ??
    affirmationTranslationsResult.error ??
    backgroundsResult.error ??
    backgroundTranslationsResult.error;
  if (error) throw error;

  const content = parseAffirmationContentRows(
    (topicsResult.data ?? []) as TopicRow[],
    (topicTranslationsResult.data ?? []) as TopicTranslationRow[],
    (affirmationsResult.data ?? []) as AffirmationRow[],
    (affirmationTranslationsResult.data ?? []) as AffirmationTranslationRow[],
    (backgroundsResult.data ?? []) as BackgroundRow[],
    (backgroundTranslationsResult.data ?? []) as BackgroundTranslationRow[],
  );
  return resolveGalleryImageUris(content);
}

function parseCachedContent(value: string): AffirmationContent {
  const parsed: unknown = JSON.parse(value);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid cached affirmation content.');
  }

  const candidate = parsed as {
    version?: unknown;
    topics?: unknown;
    backgrounds?: unknown;
  };
  if (
    candidate.version !== CONTENT_CACHE_VERSION ||
    !Array.isArray(candidate.topics) ||
    !Array.isArray(candidate.backgrounds)
  ) {
    throw new Error('Incompatible cached affirmation content.');
  }

  const topicRows: TopicRow[] = [];
  const topicTranslationRows: TopicTranslationRow[] = [];
  const affirmationRows: AffirmationRow[] = [];
  const affirmationTranslationRows: AffirmationTranslationRow[] = [];
  candidate.topics.forEach(topicValue => {
    if (typeof topicValue !== 'object' || topicValue === null) {
      throw new Error('Invalid cached affirmation topic.');
    }

    const topic = topicValue as {
      id?: unknown;
      name?: unknown;
      imageUri?: unknown;
      affirmations?: unknown;
    };
    topicRows.push({
      id: topic.id,
      image_uri: topic.imageUri,
      sort_order: topicRows.length,
    });
    if (topic.name !== null) {
      topicTranslationRows.push({ topic_id: topic.id, name: topic.name });
    }

    if (!Array.isArray(topic.affirmations)) {
      throw new Error('Invalid cached affirmations.');
    }
    topic.affirmations.forEach(affirmationValue => {
      if (typeof affirmationValue !== 'object' || affirmationValue === null) {
        throw new Error('Invalid cached affirmation.');
      }
      const affirmation = affirmationValue as {
        id?: unknown;
        text?: unknown;
        imageUri?: unknown;
      };
      affirmationRows.push({
        id: affirmation.id,
        topic_id: topic.id,
        image_uri: affirmation.imageUri,
        sort_order: affirmationRows.length,
      });
      affirmationTranslationRows.push({
        affirmation_id: affirmation.id,
        text: affirmation.text,
      });
    });
  });

  const backgroundRows: BackgroundRow[] = [];
  const backgroundTranslationRows: BackgroundTranslationRow[] = [];
  candidate.backgrounds.forEach((backgroundValue, index) => {
    if (typeof backgroundValue !== 'object' || backgroundValue === null) {
      throw new Error('Invalid cached affirmation background.');
    }
    const background = backgroundValue as {
      id?: unknown;
      imageUri?: unknown;
      tags?: unknown;
    };
    backgroundRows.push({
      id: background.id,
      image_uri: background.imageUri,
      sort_order: index,
    });
    backgroundTranslationRows.push({
      background_id: background.id,
      tags: background.tags,
    });
  });

  return parseAffirmationContentRows(
    topicRows,
    topicTranslationRows,
    affirmationRows,
    affirmationTranslationRows,
    backgroundRows,
    backgroundTranslationRows,
  );
}

export async function loadAffirmationContent(
  languageCode: string,
): Promise<LoadedAffirmationContent> {
  const cacheKey = `${CONTENT_CACHE_PREFIX}${languageCode}`;
  try {
    const content = await fetchPublishedAffirmationContent(languageCode);
    await AsyncStorage.setItem(
      cacheKey,
      JSON.stringify({ version: CONTENT_CACHE_VERSION, ...content }),
    ).catch(() => undefined);
    return { content, source: 'remote' };
  } catch (remoteError) {
    const cachedValue = await AsyncStorage.getItem(cacheKey);
    if (cachedValue === null) throw remoteError;

    return {
      content: parseCachedContent(cachedValue),
      source: 'cache',
    };
  }
}
