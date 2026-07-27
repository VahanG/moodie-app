import { useState, type FormEvent } from 'react';
import {
  saveTopic,
  type AdminLanguage,
  type AdminTopic,
} from '../lib/content';
import styles from './ContentEditor.module.css';

export function TopicEditor({
  initial,
  languages,
  onCancel,
  onSaved,
}: {
  initial?: AdminTopic;
  languages: AdminLanguage[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [topic, setTopic] = useState<AdminTopic>(
    initial ?? {
      id: '',
      translations: {},
      imageUri: '',
      sortOrder: 0,
      isPublished: false,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveTopic(topic);
      await onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Could not save.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.editor} onSubmit={submit}>
      <h2>{initial ? 'Edit category' : 'New category'}</h2>
      <div className={styles.fields}>
        <label>
          Stable ID
          <input
            disabled={Boolean(initial)}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            value={topic.id}
            onChange={event =>
              setTopic({ ...topic, id: event.target.value.toLowerCase() })
            }
          />
        </label>
        {languages.map(language => (
          <label className={styles.wide} key={language.code}>
            Name · {language.nativeName} ({language.code})
            <input
              value={topic.translations[language.code] ?? ''}
              onChange={event =>
                setTopic({
                  ...topic,
                  translations: {
                    ...topic.translations,
                    [language.code]: event.target.value,
                  },
                })
              }
            />
          </label>
        ))}
        <label className={styles.wide}>
          Image URL
          <input
            required
            type="url"
            value={topic.imageUri}
            onChange={event =>
              setTopic({ ...topic, imageUri: event.target.value })
            }
          />
        </label>
        <label>
          Sort order
          <input
            min="0"
            required
            type="number"
            value={topic.sortOrder}
            onChange={event =>
              setTopic({ ...topic, sortOrder: Number(event.target.value) })
            }
          />
        </label>
        <label className={styles.checkbox}>
          <input
            checked={topic.isPublished}
            type="checkbox"
            onChange={event =>
              setTopic({ ...topic, isPublished: event.target.checked })
            }
          />
          Published
        </label>
      </div>
      {error && (
        <p aria-live="polite" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button className={styles.cancel} onClick={onCancel} type="button">
          Cancel
        </button>
        <button className={styles.save} disabled={saving} type="submit">
          {saving ? 'Saving…' : 'Save category'}
        </button>
      </div>
    </form>
  );
}
