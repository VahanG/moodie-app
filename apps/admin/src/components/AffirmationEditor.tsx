import { useState, type FormEvent } from 'react';
import {
  saveAffirmation,
  type AdminAffirmation,
  type AdminLanguage,
  type AdminTopic,
} from '../lib/content';
import { ImageUrlField } from './ImageUrlField';
import styles from './ContentEditor.module.css';

export function AffirmationEditor({
  initial,
  topics,
  languages,
  onCancel,
  onSaved,
}: {
  initial?: AdminAffirmation;
  topics: AdminTopic[];
  languages: AdminLanguage[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [affirmation, setAffirmation] = useState<
    Omit<AdminAffirmation, 'id'> & { id?: string }
  >(
    initial ?? {
      topicId: topics[0]?.id ?? '',
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
              {topic.translations.en ?? topic.id}
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
        {languages.map(language => (
          <label className={styles.wide} key={language.code}>
            Affirmation text · {language.nativeName} ({language.code})
            <textarea
              value={affirmation.translations[language.code] ?? ''}
              onChange={event =>
                setAffirmation({
                  ...affirmation,
                  translations: {
                    ...affirmation.translations,
                    [language.code]: event.target.value,
                  },
                })
              }
            />
          </label>
        ))}
        <ImageUrlField
          label="Suggested image URL"
          onChange={imageUri =>
            setAffirmation({ ...affirmation, imageUri })
          }
          value={affirmation.imageUri}
        />
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
