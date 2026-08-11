import { useState, type FormEvent } from 'react';
import {
  saveBackground,
  type AdminBackground,
  type AdminLanguage,
} from '../lib/content';
import { ImageUrlField } from './ImageUrlField';
import styles from './ContentEditor.module.css';

export function BackgroundEditor({
  initial,
  languages,
  onCancel,
  onSaved,
}: {
  initial?: AdminBackground;
  languages: AdminLanguage[];
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [background, setBackground] = useState<AdminBackground>(
    initial ?? {
      id: '',
      imageUri: '',
      translations: {},
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
        <ImageUrlField
          label="Image URL"
          onChange={imageUri => setBackground({ ...background, imageUri })}
          value={background.imageUri}
        />
        {languages.map(language => (
          <label className={styles.wide} key={language.code}>
            Tags · {language.nativeName} ({language.code}, comma separated)
            <input
              value={(background.translations[language.code] ?? []).join(', ')}
              onChange={event =>
                setBackground({
                  ...background,
                  translations: {
                    ...background.translations,
                    [language.code]: event.target.value.split(','),
                  },
                })
              }
            />
          </label>
        ))}
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
