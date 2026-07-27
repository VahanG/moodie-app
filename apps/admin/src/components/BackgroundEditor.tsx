import { useState, type FormEvent } from 'react';
import { saveBackground, type AdminBackground } from '../lib/content';
import styles from './ContentEditor.module.css';

export function BackgroundEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: AdminBackground;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [background, setBackground] = useState<AdminBackground>(
    initial ?? {
      id: '',
      imageUri: '',
      tags: [],
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
      await saveBackground(background);
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
      <h2>{initial ? 'Edit background' : 'New background'}</h2>
      <div className={styles.fields}>
        <label>
          Stable ID
          <input
            disabled={Boolean(initial)}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            value={background.id}
            onChange={event =>
              setBackground({
                ...background,
                id: event.target.value.toLowerCase(),
              })
            }
          />
        </label>
        <label>
          Sort order
          <input
            min="0"
            required
            type="number"
            value={background.sortOrder}
            onChange={event =>
              setBackground({
                ...background,
                sortOrder: Number(event.target.value),
              })
            }
          />
        </label>
        <label className={styles.wide}>
          Image URL
          <input
            required
            type="url"
            value={background.imageUri}
            onChange={event =>
              setBackground({
                ...background,
                imageUri: event.target.value,
              })
            }
          />
        </label>
        <label className={styles.wide}>
          Tags (comma separated)
          <input
            required
            value={background.tags.join(', ')}
            onChange={event =>
              setBackground({
                ...background,
                tags: event.target.value.split(','),
              })
            }
          />
        </label>
        <label className={styles.checkbox}>
          <input
            checked={background.isPublished}
            type="checkbox"
            onChange={event =>
              setBackground({
                ...background,
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
        <button className={styles.save} disabled={saving} type="submit">
          {saving ? 'Saving…' : 'Save background'}
        </button>
      </div>
    </form>
  );
}
