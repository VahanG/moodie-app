import { getAdminSupabaseClient } from './supabase';

export type AdminTopic = {
  id: string;
  name: string;
  imageUri: string;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminAffirmation = {
  id: string;
  topicId: string;
  text: string;
  imageUri: string;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminBackground = {
  id: string;
  imageUri: string;
  tags: string[];
  sortOrder: number;
  isPublished: boolean;
};

export type AdminContent = {
  topics: AdminTopic[];
  affirmations: AdminAffirmation[];
  backgrounds: AdminBackground[];
};

type ContentKind = 'topic' | 'affirmation' | 'background';

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function loadAdminContent(): Promise<AdminContent> {
  const client = getAdminSupabaseClient();
  const [topics, affirmations, backgrounds] = await Promise.all([
    client
      .from('affirmation_topics')
      .select('id,name,image_uri,sort_order,is_published')
      .order('sort_order')
      .order('id'),
    client
      .from('affirmations')
      .select('id,topic_id,text,image_uri,sort_order,is_published')
      .order('topic_id')
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_backgrounds')
      .select('id,image_uri,tags,sort_order,is_published')
      .order('sort_order')
      .order('id'),
  ]);

  throwIfError(topics.error);
  throwIfError(affirmations.error);
  throwIfError(backgrounds.error);

  return {
    topics: (topics.data ?? []).map(row => ({
      id: row.id,
      name: row.name,
      imageUri: row.image_uri,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    })),
    affirmations: (affirmations.data ?? []).map(row => ({
      id: row.id,
      topicId: row.topic_id,
      text: row.text,
      imageUri: row.image_uri,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    })),
    backgrounds: (backgrounds.data ?? []).map(row => ({
      id: row.id,
      imageUri: row.image_uri,
      tags: row.tags,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    })),
  };
}

export async function saveTopic(topic: AdminTopic): Promise<void> {
  const { error } = await getAdminSupabaseClient()
    .from('affirmation_topics')
    .upsert(
      {
        id: topic.id,
        name: topic.name.trim(),
        image_uri: topic.imageUri.trim(),
        sort_order: topic.sortOrder,
        is_published: topic.isPublished,
      },
      { onConflict: 'id' },
    );
  throwIfError(error);
}

export async function saveAffirmation(
  affirmation: Omit<AdminAffirmation, 'id'> & { id?: string },
): Promise<void> {
  const values = {
    topic_id: affirmation.topicId,
    text: affirmation.text.trim(),
    image_uri: affirmation.imageUri.trim(),
    sort_order: affirmation.sortOrder,
    is_published: affirmation.isPublished,
  };
  const query = affirmation.id
    ? getAdminSupabaseClient()
        .from('affirmations')
        .update(values)
        .eq('id', affirmation.id)
    : getAdminSupabaseClient().from('affirmations').insert(values);
  const { error } = await query;
  throwIfError(error);
}

export async function saveBackground(
  background: AdminBackground,
): Promise<void> {
  const { error } = await getAdminSupabaseClient()
    .from('affirmation_backgrounds')
    .upsert(
      {
        id: background.id,
        image_uri: background.imageUri.trim(),
        tags: [
          ...new Set(
            background.tags
              .map(tag => tag.trim().toLowerCase())
              .filter(Boolean),
          ),
        ],
        sort_order: background.sortOrder,
        is_published: background.isPublished,
      },
      { onConflict: 'id' },
    );
  throwIfError(error);
}

export async function deleteContent(
  kind: ContentKind,
  id: string,
): Promise<void> {
  const table = {
    topic: 'affirmation_topics',
    affirmation: 'affirmations',
    background: 'affirmation_backgrounds',
  }[kind];
  const { error } = await getAdminSupabaseClient()
    .from(table)
    .delete()
    .eq('id', id);
  throwIfError(error);
}
