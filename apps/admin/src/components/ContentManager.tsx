import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteContent,
  loadAdminContent,
  type AdminAffirmation,
  type AdminBackground,
  type AdminContent,
  type AdminTopic,
} from '../lib/content';
import { AffirmationEditor } from './AffirmationEditor';
import { BackgroundEditor } from './BackgroundEditor';
import { TopicEditor } from './TopicEditor';
import styles from './ContentManager.module.css';

type Section = 'topics' | 'affirmations' | 'backgrounds';
type Editor =
  | { kind: 'topic'; value?: AdminTopic }
  | { kind: 'affirmation'; value?: AdminAffirmation }
  | { kind: 'background'; value?: AdminBackground }
  | null;

const emptyContent: AdminContent = {
  topics: [],
  affirmations: [],
  backgrounds: [],
};

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Content operation failed.';
}

export function ContentManager() {
  const [content, setContent] = useState<AdminContent>(emptyContent);
  const [section, setSection] = useState<Section>('topics');
  const [editor, setEditor] = useState<Editor>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setContent(await loadAdminContent());
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

    loadAdminContent()
      .then(loadedContent => {
        if (active) setContent(loadedContent);
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
    () => new Map(content.topics.map(topic => [topic.id, topic.name])),
    [content.topics],
  );

  const startAdd = () => {
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
        {!editor && (
          <button className={styles.addButton} onClick={startAdd} type="button">
            Add {section === 'topics' ? 'category' : section.slice(0, -1)}
          </button>
        )}
      </header>

      <div aria-label="Content type" className={styles.tabs}>
        {(['topics', 'affirmations', 'backgrounds'] as Section[]).map(item => (
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
              : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={`${styles.panel} ${editor ? styles.editorPanel : ''}`}>
        {editor?.kind === 'topic' && (
          <TopicEditor
            initial={editor.value}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}
        {editor?.kind === 'affirmation' && (
          <AffirmationEditor
            initial={editor.value}
            topics={content.topics}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}
        {editor?.kind === 'background' && (
          <BackgroundEditor
            initial={editor.value}
            onCancel={() => setEditor(null)}
            onSaved={reload}
          />
        )}

        {!editor && loading && <div className={styles.loading}>Loading…</div>}
        {!editor && !loading && section === 'topics' && (
          <ContentList
            items={content.topics.map(topic => ({
              id: topic.id,
              title: topic.name,
              subtitle: `${
                content.affirmations.filter(item => item.topicId === topic.id)
                  .length
              } affirmations · order ${topic.sortOrder}`,
              imageUri: topic.imageUri,
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
              title: affirmation.text,
              subtitle: `${
                topicNames.get(affirmation.topicId) ?? affirmation.topicId
              } · order ${affirmation.sortOrder}`,
              imageUri: affirmation.imageUri,
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
              subtitle: `${background.tags.join(', ')} · order ${
                background.sortOrder
              }`,
              imageUri: background.imageUri,
              isPublished: background.isPublished,
              edit: () => setEditor({ kind: 'background', value: background }),
              remove: () => remove('background', background.id),
            }))}
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
    imageUri: string;
    isPublished: boolean;
    edit: () => void;
    remove: () => void;
  }>;
}) {
  if (items.length === 0) {
    return <div className={styles.empty}>No content here yet.</div>;
  }

  return (
    <div className={styles.list}>
      {items.map(item => (
        <article className={styles.row} key={item.id}>
          <img alt="" className={styles.thumbnail} src={item.imageUri} />
          <div className={styles.summary}>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
          </div>
          <span className={item.isPublished ? styles.published : styles.draft}>
            {item.isPublished ? 'Published' : 'Draft'}
          </span>
          <div className={styles.rowActions}>
            <button onClick={item.edit} type="button">
              Edit
            </button>
            <button
              className={styles.delete}
              onClick={item.remove}
              type="button"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
