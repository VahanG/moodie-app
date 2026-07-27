import { useState, type FormEvent } from 'react';
import {
  saveAffirmation,
  type AdminAffirmation,
  type AdminTopic,
} from '../lib/content';
import styles from './ContentEditor.module.css';

export function AffirmationEditor({
  initial,
  topics,
  onCancel,
  onSaved,
}: {
  initial?: AdminAffirmation;
  topics: AdminTopic[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [affirmation, setAffirmation] = useState<
    Omit<AdminAffirmation, 'id'> & { id?: string }
  >(
    initial ?? {
      topicId: topics[0]?.id ?? '',
      text: '',
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
      await saveAffirmation(affirmation);
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
      <h2>{initial ? 'Edit affirmation' : 'New affirmation'}</h2>
      <div className={styles.fields}>
        <label>
          Category
          <select
            required
            value={affirmation.topicId}
            onChange={event =>
              setAffirmation({
                ...affirmation,
                topicId: event.target.value,
              })
            }
          >
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sort order
          <input
            min="0"
            required
            type="number"
            value={affirmation.sortOrder}
            onChange={event =>
              setAffirmation({
                ...affirmation,
                sortOrder: Number(event.target.value),
              })
            }
          />
        </label>
        <label className={styles.wide}>
          Affirmation text
          <textarea
            required
            value={affirmation.text}
            onChange={event =>
              setAffirmation({ ...affirmation, text: event.target.value })
            }
          />
        </label>
        <label className={styles.wide}>
          Suggested image URL
          <input
            required
            type="url"
            value={affirmation.imageUri}
            onChange={event =>
              setAffirmation({
                ...affirmation,
                imageUri: event.target.value,
              })
            }
          />
        </label>
        <label className={styles.checkbox}>
          <input
            checked={affirmation.isPublished}
            type="checkbox"
            onChange={event =>
              setAffirmation({
                ...affirmation,
                isPublished: event.target.checked,
              })
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
        <button
          className={styles.save}
          disabled={saving || topics.length === 0}
          type="submit"
        >
          {saving ? 'Saving…' : 'Save affirmation'}
        </button>
      </div>
    </form>
  );
}
