import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseClient } from '../supabase';
import {
  AffirmationCard,
  AffirmationBackground,
  AffirmationContent,
  AffirmationTopic,
  LoadedAffirmationContent,
} from './types';

const CONTENT_CACHE_KEY = '@moodie/affirmation-content-v1';
const CONTENT_CACHE_VERSION = 1;

type TopicRow = {
  id: unknown;
  name: unknown;
  image_uri: unknown;
  sort_order: unknown;
};

type AffirmationRow = {
  id: unknown;
  topic_id: unknown;
  text: unknown;
  image_uri: unknown;
  sort_order: unknown;
};

type BackgroundRow = {
  id: unknown;
  image_uri: unknown;
  tags: unknown;
  sort_order: unknown;
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

export function parseAffirmationContentRows(
  topicRows: TopicRow[],
  affirmationRows: AffirmationRow[],
  backgroundRows: BackgroundRow[],
): AffirmationContent {
  const topicsById = new Map<string, OrderedTopic>();

  topicRows.forEach(row => {
    const id = requireString(row.id, 'topic id');
    if (topicsById.has(id)) {
      throw new Error(`Duplicate topic id "${id}" in affirmation content.`);
    }

    topicsById.set(id, {
      id,
      name: requireString(row.name, 'topic name'),
      imageUri: requireString(row.image_uri, 'topic image URI'),
      sortOrder: requireOrder(row.sort_order, 'topic sort order'),
      affirmations: [],
    });
  });

  const seenAffirmationIds = new Set<string>();
  affirmationRows.forEach(row => {
    const id = requireString(row.id, 'affirmation id');
    if (seenAffirmationIds.has(id)) {
      throw new Error(
        `Duplicate affirmation id "${id}" in affirmation content.`,
      );
    }
    seenAffirmationIds.add(id);
    const topicId = requireString(row.topic_id, 'affirmation topic id');
    const topic = topicsById.get(topicId);

    if (!topic) {
      return;
    }

    topic.affirmations.push({
      id,
      text: requireString(row.text, 'affirmation text'),
      imageUri: requireString(row.image_uri, 'affirmation image URI'),
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

  const backgroundsWithOrder = backgroundRows.map(row => ({
    id: requireString(row.id, 'background id'),
    imageUri: requireString(row.image_uri, 'background image URI'),
    tags: parseTags(row.tags),
    sortOrder: requireOrder(row.sort_order, 'background sort order'),
  }));
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

  if (backgrounds.length === 0) {
    throw new Error('No published affirmation backgrounds are available.');
  }

  return { topics, backgrounds };
}

async function fetchPublishedAffirmationContent(): Promise<AffirmationContent> {
  const client = getSupabaseClient();
  const [topicsResult, affirmationsResult, backgroundsResult] =
    await Promise.all([
      client
        .from('affirmation_topics')
        .select('id,name,image_uri,sort_order')
        .eq('is_published', true)
        .order('sort_order')
        .order('id'),
      client
        .from('affirmations')
        .select('id,topic_id,text,image_uri,sort_order')
        .eq('is_published', true)
        .order('topic_id')
        .order('sort_order')
        .order('id'),
      client
        .from('affirmation_backgrounds')
        .select('id,image_uri,tags,sort_order')
        .eq('is_published', true)
        .order('sort_order')
        .order('id'),
    ]);

  const error =
    topicsResult.error ?? affirmationsResult.error ?? backgroundsResult.error;
  if (error) {
    throw error;
  }

  return parseAffirmationContentRows(
    (topicsResult.data ?? []) as TopicRow[],
    (affirmationsResult.data ?? []) as AffirmationRow[],
    (backgroundsResult.data ?? []) as BackgroundRow[],
  );
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
  const affirmationRows: AffirmationRow[] = [];
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
      name: topic.name,
      image_uri: topic.imageUri,
      sort_order: topicRows.length,
    });

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
        text: affirmation.text,
        image_uri: affirmation.imageUri,
        sort_order: affirmationRows.length,
      });
    });
  });

  const backgroundRows = candidate.backgrounds.map(
    (backgroundValue, index): BackgroundRow => {
      if (typeof backgroundValue !== 'object' || backgroundValue === null) {
        throw new Error('Invalid cached affirmation background.');
      }
      const background = backgroundValue as {
        id?: unknown;
        imageUri?: unknown;
        tags?: unknown;
      };
      return {
        id: background.id,
        image_uri: background.imageUri,
        tags: background.tags,
        sort_order: index,
      };
    },
  );

  return parseAffirmationContentRows(
    topicRows,
    affirmationRows,
    backgroundRows,
  );
}

export async function loadAffirmationContent(): Promise<LoadedAffirmationContent> {
  try {
    const content = await fetchPublishedAffirmationContent();
    await AsyncStorage.setItem(
      CONTENT_CACHE_KEY,
      JSON.stringify({ version: CONTENT_CACHE_VERSION, ...content }),
    ).catch(() => undefined);
    return { content, source: 'remote' };
  } catch (remoteError) {
    const cachedValue = await AsyncStorage.getItem(CONTENT_CACHE_KEY);
    if (cachedValue === null) {
      throw remoteError;
    }

    return {
      content: parseCachedContent(cachedValue),
      source: 'cache',
    };
  }
}
