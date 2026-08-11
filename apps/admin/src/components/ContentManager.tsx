import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteContent,
  loadAdminContent,
  type AdminAffirmation,
  type AdminBackground,
  type AdminContent,
  type AdminLanguage,
  type AdminTopic,
} from '../lib/content';
import { loadGalleryMedia, type GalleryMedia } from '../lib/gallery';
import { galleryMediaContentUri } from '../lib/galleryPresentation';
import { AffirmationEditor } from './AffirmationEditor';
import { BackgroundEditor } from './BackgroundEditor';
import { TopicEditor } from './TopicEditor';
import { LanguageEditor } from './LanguageEditor';
import { AppTextEditor } from './AppTextEditor';
import styles from './ContentManager.module.css';

type Section =
  | 'languages'
  | 'topics'
  | 'affirmations'
  | 'backgrounds'
  | 'appTexts';
type Editor =
  | { kind: 'language'; value?: AdminLanguage }
  | { kind: 'topic'; value?: AdminTopic }
  | { kind: 'affirmation'; value?: AdminAffirmation }
  | { kind: 'background'; value?: AdminBackground }
  | null;

const emptyContent: AdminContent = {
  languages: [],
  topics: [],
  affirmations: [],
  backgrounds: [],
  appTexts: {},
};

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Content operation failed.';
}

function translationCount(
  translations: Record<string, string | string[]>,
  languages: AdminLanguage[],
): string {
  const completed = languages.filter(language => {
    const value = translations[language.code];
    return Array.isArray(value)
      ? value.some(item => item.trim().length > 0)
      : typeof value === 'string' && value.trim().length > 0;
  }).length;
  return `${completed}/${languages.length} languages`;
}

function galleryPreviewMap(items: GalleryMedia[]): Map<string, string> {
  return new Map(
    items.flatMap(item =>
      item.objectPath && item.previewUrl
        ? [[galleryMediaContentUri(item), item.previewUrl] as const]
        : [],
    ),
  );
}

async function loadContentView(): Promise<{
  content: AdminContent;
  galleryPreviews: Map<string, string>;
}> {
  const [content, gallery] = await Promise.all([
    loadAdminContent(),
    loadGalleryMedia().catch(() => []),
  ]);
  return { content, galleryPreviews: galleryPreviewMap(gallery) };
}

export function ContentManager() {
  const [content, setContent] = useState<AdminContent>(emptyContent);
  const [galleryPreviews, setGalleryPreviews] = useState<Map<string, string>>(
    new Map(),
  );
  const [section, setSection] = useState<Section>('languages');
  const [editor, setEditor] = useState<Editor>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const loaded = await loadContentView();
      setContent(loaded.content);
      setGalleryPreviews(loaded.galleryPreviews);
      setEditor(null);
    } catch (loadError) {
      setError(messageFrom(loadError));
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadContentView()
      .then(loaded => {
        if (active) {
          setContent(loaded.content);
          setGalleryPreviews(loaded.galleryPreviews);
        }
      })
      .catch(loadError => {
        if (active) setError(messageFrom(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const topicNames = useMemo(
    () =>
      new Map(
        content.topics.map(topic => [
          topic.id,
          topic.translations.en ?? topic.id,
        ]),
      ),
    [content.topics],
  );

  const startAdd = () => {
    if (section === 'languages') setEditor({ kind: 'language' });
    if (section === 'topics') setEditor({ kind: 'topic' });
    if (section === 'affirmations') setEditor({ kind: 'affirmation' });
    if (section === 'backgrounds') setEditor({ kind: 'background' });
  };

  const remove = async (
    kind: 'topic' | 'affirmation' | 'background',
    id: string,
  ) => {
    const warning =
      kind === 'topic'
        ? 'Delete this category and all of its affirmations?'
        : 'Delete this content item?';
    if (!globalThis.confirm(warning)) return;

    setError(null);
    try {
      await deleteContent(kind, id);
      await reload();
    } catch (deleteError) {
      setError(messageFrom(deleteError));
    }
  };

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p>Editorial content</p>
          <h1>Affirmation library</h1>
          <p>
            Manage categories, text, backgrounds, ordering, and publication.
          </p>
        </div>
        {!editor && section !== 'appTexts' && (
          <button className={styles.addButton} onClick={startAdd} type="button">
            Add{' '}
            {section === 'topics'
              ? 'category'
              : section === 'languages'
                ? 'language'
                : section.slice(0, -1)}
          </button>
        )}
      </header>

      <div aria-label="Content type" className={styles.tabs}>
        {(
          [
            'languages',
            'topics',
            'affirmations',
            'backgrounds',
            'appTexts',
          ] as Section[]
        ).map(item => (
          <button
            className={section === item ? styles.activeTab : undefined}
            key={item}
            onClick={() => {
              setSection(item);
              setEditor(null);
            }}
            type="button"
          >
            {item === 'topics'
              ? 'Categories'
              : item === 'appTexts'
                ? 'App text'
                : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={`${styles.panel} ${editor ? styles.editorPanel : ''}`}>
        {editor?.kind === 'language' && (
          <LanguageEditor
            initial={editor.value}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}
        {editor?.kind === 'topic' && (
          <TopicEditor
            initial={editor.value}
            languages={content.languages}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}
        {editor?.kind === 'affirmation' && (
          <AffirmationEditor
            initial={editor.value}
            languages={content.languages}
            topics={content.topics}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}
        {editor?.kind === 'background' && (
          <BackgroundEditor
            initial={editor.value}
            languages={content.languages}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}

        {!editor && loading && <div className={styles.loading}>Loading…</div>}
        {!editor && !loading && section === 'languages' && (
          <ContentList
            items={content.languages.map(language => ({
              id: language.code,
              title: `${language.nativeName} · ${language.englishName}`,
              subtitle: `${language.code.toUpperCase()} · ${
                language.textDirection.toUpperCase()
              } · order ${language.sortOrder}${
                language.isDefault ? ' · default' : ''
              }`,
              isPublished: language.isEnabled,
              publishedLabel: language.isEnabled ? 'Enabled' : 'Disabled',
              edit: () =>
                setEditor({ kind: 'language', value: language }),
            }))}
          />
        )}
        {!editor && !loading && section === 'topics' && (
          <ContentList
            items={content.topics.map(topic => ({
              id: topic.id,
              title: topic.translations.en ?? topic.id,
              subtitle: `${
                content.affirmations.filter(item => item.topicId === topic.id)
                  .length
              } affirmations · ${translationCount(
                topic.translations,
                content.languages,
              )} · order ${topic.sortOrder}`,
              imageUri: galleryPreviews.get(topic.imageUri) ?? topic.imageUri,
              isPublished: topic.isPublished,
              edit: () => setEditor({ kind: 'topic', value: topic }),
              remove: () => remove('topic', topic.id),
            }))}
          />
        )}
        {!editor && !loading && section === 'affirmations' && (
          <ContentList
            items={content.affirmations.map(affirmation => ({
              id: affirmation.id,
              title:
                affirmation.translations.en ??
                `Untranslated affirmation ${affirmation.id.slice(0, 8)}`,
              subtitle: `${
                topicNames.get(affirmation.topicId) ?? affirmation.topicId
              } · ${translationCount(
                affirmation.translations,
                content.languages,
              )} · order ${affirmation.sortOrder}`,
              imageUri:
                galleryPreviews.get(affirmation.imageUri) ??
                affirmation.imageUri,
              isPublished: affirmation.isPublished,
              edit: () =>
                setEditor({ kind: 'affirmation', value: affirmation }),
              remove: () => remove('affirmation', affirmation.id),
            }))}
          />
        )}
        {!editor && !loading && section === 'backgrounds' && (
          <ContentList
            items={content.backgrounds.map(background => ({
              id: background.id,
              title: background.id,
              subtitle: `${(background.translations.en ?? []).join(
                ', ',
              )} · ${translationCount(
                background.translations,
                content.languages,
              )} · order ${background.sortOrder}`,
              imageUri:
                galleryPreviews.get(background.imageUri) ?? background.imageUri,
              isPublished: background.isPublished,
              edit: () => setEditor({ kind: 'background', value: background }),
              remove: () => remove('background', background.id),
            }))}
          />
        )}
        {!editor && !loading && section === 'appTexts' && (
          <AppTextEditor
            appTexts={content.appTexts}
            languages={content.languages}
            onSaved={reload}
          />
        )}
      </div>
    </section>
  );
}

function ContentList({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    imageUri?: string;
    isPublished: boolean;
    publishedLabel?: string;
    edit: () => void;
    remove?: () => void;
  }>;
}) {
  if (items.length === 0) {
    return <div className={styles.empty}>No content here yet.</div>;
  }

  return (
    <div className={styles.list}>
      {items.map(item => (
        <article className={styles.row} key={item.id}>
          {item.imageUri ? (
            <img alt="" className={styles.thumbnail} src={item.imageUri} />
          ) : (
            <div className={styles.thumbnail} />
          )}
          <div className={styles.summary}>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
          </div>
          <span className={item.isPublished ? styles.published : styles.draft}>
            {item.publishedLabel ??
              (item.isPublished ? 'Published' : 'Draft')}
          </span>
          <div className={styles.rowActions}>
            <button onClick={item.edit} type="button">
              Edit
            </button>
            {item.remove && (
              <button
                className={styles.delete}
                onClick={item.remove}
                type="button"
              >
                Delete
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
