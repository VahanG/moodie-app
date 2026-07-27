import { useState, type FormEvent } from 'react';
import { saveLanguage, type AdminLanguage } from '../lib/content';
import styles from './ContentEditor.module.css';

export function LanguageEditor({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: AdminLanguage;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [language, setLanguage] = useState<AdminLanguage>(
    initial ?? {
      code: '',
      englishName: '',
      nativeName: '',
      textDirection: 'ltr',
      sortOrder: 0,
      isEnabled: false,
      isDefault: false,
    },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveLanguage(language);
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
      <h2>{initial ? 'Edit language' : 'New language'}</h2>
      <p>
        Use a lowercase language code such as <code>hy</code>, <code>ru</code>,
        or <code>pt-br</code>.
      </p>
      <div className={styles.fields}>
        <label>
          Language code
          <input
            disabled={Boolean(initial)}
            pattern="[a-z]{2,3}(?:-[a-z0-9]{2,8})*"
            required
            value={language.code}
            onChange={event =>
              setLanguage({
                ...language,
                code: event.target.value.toLowerCase(),
              })
            }
          />
        </label>
        <label>
          English name
          <input
            required
            value={language.englishName}
            onChange={event =>
              setLanguage({ ...language, englishName: event.target.value })
            }
          />
        </label>
        <label>
          Native name
          <input
            required
            value={language.nativeName}
            onChange={event =>
              setLanguage({ ...language, nativeName: event.target.value })
            }
          />
        </label>
        <label>
          Text direction
          <select
            value={language.textDirection}
            onChange={event =>
              setLanguage({
                ...language,
                textDirection: event.target.value as 'ltr' | 'rtl',
              })
            }
          >
            <option value="ltr">Left to right</option>
            <option value="rtl">Right to left</option>
          </select>
        </label>
        <label>
          Sort order
          <input
            min="0"
            required
            type="number"
            value={language.sortOrder}
            onChange={event =>
              setLanguage({
                ...language,
                sortOrder: Number(event.target.value),
              })
            }
          />
        </label>
        <label className={styles.checkbox}>
          <input
            checked={language.isEnabled}
            disabled={language.isDefault}
            type="checkbox"
            onChange={event =>
              setLanguage({
                ...language,
                isEnabled: event.target.checked,
              })
            }
          />
          Enabled in supporter app
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
          {saving ? 'Saving…' : 'Save language'}
        </button>
      </div>
    </form>
  );
}
