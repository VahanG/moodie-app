import { getAdminSupabaseClient } from './supabase';

export type AdminLanguage = {
  code: string;
  englishName: string;
  nativeName: string;
  textDirection: 'ltr' | 'rtl';
  sortOrder: number;
  isEnabled: boolean;
  isDefault: boolean;
};

export type AdminTopic = {
  id: string;
  translations: Record<string, string>;
  imageUri: string;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminAffirmation = {
  id: string;
  topicId: string;
  translations: Record<string, string>;
  imageUri: string;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminBackground = {
  id: string;
  imageUri: string;
  translations: Record<string, string[]>;
  sortOrder: number;
  isPublished: boolean;
};

export type AdminContent = {
  languages: AdminLanguage[];
  topics: AdminTopic[];
  affirmations: AdminAffirmation[];
  backgrounds: AdminBackground[];
  appTexts: Record<string, Record<string, string>>;
};

type ContentKind = 'topic' | 'affirmation' | 'background';

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function groupTranslations<T>(
  rows: Array<{ ownerId: string; languageCode: string; value: T }>,
): Map<string, Record<string, T>> {
  const grouped = new Map<string, Record<string, T>>();
  rows.forEach(row => {
    const current = grouped.get(row.ownerId) ?? {};
    current[row.languageCode] = row.value;
    grouped.set(row.ownerId, current);
  });
  return grouped;
}

export async function loadAdminContent(): Promise<AdminContent> {
  const client = getAdminSupabaseClient();
  const [
    languages,
    topics,
    topicTranslations,
    affirmations,
    affirmationTranslations,
    backgrounds,
    backgroundTranslations,
    appTexts,
  ] = await Promise.all([
    client
      .from('supported_languages')
      .select(
        'code,english_name,native_name,text_direction,sort_order,is_enabled,is_default',
      )
      .order('sort_order')
      .order('code'),
    client
      .from('affirmation_topics')
      .select('id,image_uri,sort_order,is_published')
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_topic_translations')
      .select('topic_id,language_code,name')
      .order('topic_id')
      .order('language_code'),
    client
      .from('affirmations')
      .select('id,topic_id,image_uri,sort_order,is_published')
      .order('topic_id')
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_translations')
      .select('affirmation_id,language_code,text')
      .order('affirmation_id')
      .order('language_code'),
    client
      .from('affirmation_backgrounds')
      .select('id,image_uri,sort_order,is_published')
      .order('sort_order')
      .order('id'),
    client
      .from('affirmation_background_translations')
      .select('background_id,language_code,tags')
      .order('background_id')
      .order('language_code'),
    client
      .from('app_text_translations')
      .select('language_code,text_key,text_value')
      .order('text_key')
      .order('language_code'),
  ]);

  [
    languages,
    topics,
    topicTranslations,
    affirmations,
    affirmationTranslations,
    backgrounds,
    backgroundTranslations,
    appTexts,
  ].forEach(result => throwIfError(result.error));

  const topicNames = groupTranslations(
    (topicTranslations.data ?? []).map(row => ({
      ownerId: row.topic_id,
      languageCode: row.language_code,
      value: row.name,
    })),
  );
  const affirmationTexts = groupTranslations(
    (affirmationTranslations.data ?? []).map(row => ({
      ownerId: row.affirmation_id,
      languageCode: row.language_code,
      value: row.text,
    })),
  );
  const backgroundTags = groupTranslations(
    (backgroundTranslations.data ?? []).map(row => ({
      ownerId: row.background_id,
      languageCode: row.language_code,
      value: row.tags,
    })),
  );
  const groupedAppTexts: Record<string, Record<string, string>> = {};
  (appTexts.data ?? []).forEach(row => {
    groupedAppTexts[row.language_code] ??= {};
    groupedAppTexts[row.language_code][row.text_key] = row.text_value;
  });

  return {
    languages: (languages.data ?? []).map(row => ({
      code: row.code,
      englishName: row.english_name,
      nativeName: row.native_name,
      textDirection: row.text_direction,
      sortOrder: row.sort_order,
      isEnabled: row.is_enabled,
      isDefault: row.is_default,
    })),
    topics: (topics.data ?? []).map(row => ({
      id: row.id,
      translations: topicNames.get(row.id) ?? {},
      imageUri: row.image_uri,
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    })),
    affirmations: (affirmations.data ?? []).map(row => ({
      id: row.id,
      topicId: row.topic_id,
      translations: affirmationTexts.get(row.id) ?? {},
      imageUri: row.image_uri ?? '',
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    })),
    backgrounds: (backgrounds.data ?? []).map(row => ({
      id: row.id,
      imageUri: row.image_uri,
      translations: backgroundTags.get(row.id) ?? {},
      sortOrder: row.sort_order,
      isPublished: row.is_published,
    })),
    appTexts: groupedAppTexts,
  };
}

async function saveTranslationSet(
  table: string,
  ownerColumn: string,
  ownerId: string,
  valueColumn: string,
  translations: Record<string, string | string[]>,
): Promise<void> {
  const client = getAdminSupabaseClient();
  await Promise.all(
    Object.entries(translations).map(async ([languageCode, value]) => {
      const normalized = Array.isArray(value)
        ? [
            ...new Set(
              value.map(item => item.trim().toLowerCase()).filter(Boolean),
            ),
          ]
        : value.trim();

      if (normalized.length === 0) {
        const { error } = await client
          .from(table)
          .delete()
          .eq(ownerColumn, ownerId)
          .eq('language_code', languageCode);
        throwIfError(error);
        return;
      }

      const { error } = await client.from(table).upsert(
        {
          [ownerColumn]: ownerId,
          language_code: languageCode,
          [valueColumn]: normalized,
        },
        { onConflict: `${ownerColumn},language_code` },
      );
      throwIfError(error);
    }),
  );
}

export async function saveLanguage(language: AdminLanguage): Promise<void> {
  const { error } = await getAdminSupabaseClient()
    .from('supported_languages')
    .upsert(
      {
        code: language.code.trim().toLowerCase(),
        english_name: language.englishName.trim(),
        native_name: language.nativeName.trim(),
        text_direction: language.textDirection,
        sort_order: language.sortOrder,
        is_enabled: language.isEnabled,
        is_default: language.isDefault,
      },
      { onConflict: 'code' },
    );
  throwIfError(error);
}

export async function saveTopic(topic: AdminTopic): Promise<void> {
  const { error } = await getAdminSupabaseClient()
    .from('affirmation_topics')
    .upsert(
      {
        id: topic.id,
        image_uri: topic.imageUri.trim(),
        sort_order: topic.sortOrder,
        is_published: topic.isPublished,
      },
      { onConflict: 'id' },
    );
  throwIfError(error);
  await saveTranslationSet(
    'affirmation_topic_translations',
    'topic_id',
    topic.id,
    'name',
    topic.translations,
  );
}

export async function saveAffirmation(
  affirmation: Omit<AdminAffirmation, 'id'> & { id?: string },
): Promise<void> {
  const values = {
    topic_id: affirmation.topicId,
    image_uri: affirmation.imageUri.trim() || null,
    sort_order: affirmation.sortOrder,
    is_published: affirmation.isPublished,
  };
  let id = affirmation.id;

  if (id) {
    const { error } = await getAdminSupabaseClient()
      .from('affirmations')
      .update(values)
      .eq('id', id);
    throwIfError(error);
  } else {
    const { data, error } = await getAdminSupabaseClient()
      .from('affirmations')
      .insert(values)
      .select('id')
      .single();
    throwIfError(error);
    id = data?.id;
  }

  if (!id) throw new Error('The saved affirmation did not return an ID.');
  await saveTranslationSet(
    'affirmation_translations',
    'affirmation_id',
    id,
    'text',
    affirmation.translations,
  );
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
        sort_order: background.sortOrder,
        is_published: background.isPublished,
      },
      { onConflict: 'id' },
    );
  throwIfError(error);
  await saveTranslationSet(
    'affirmation_background_translations',
    'background_id',
    background.id,
    'tags',
    background.translations,
  );
}

export async function saveAppTexts(
  languageCode: string,
  values: Record<string, string>,
): Promise<void> {
  const client = getAdminSupabaseClient();
  await Promise.all(
    Object.entries(values).map(async ([textKey, textValue]) => {
      const normalized = textValue.trim();
      if (!normalized) {
        const { error } = await client
          .from('app_text_translations')
          .delete()
          .eq('language_code', languageCode)
          .eq('text_key', textKey);
        throwIfError(error);
        return;
      }

      const { error } = await client.from('app_text_translations').upsert(
        {
          language_code: languageCode,
          text_key: textKey,
          text_value: normalized,
        },
        { onConflict: 'language_code,text_key' },
      );
      throwIfError(error);
    }),
  );
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
