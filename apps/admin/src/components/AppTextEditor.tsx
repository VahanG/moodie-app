import { useMemo, useState, type FormEvent } from 'react';
import {
  saveAppTexts,
  type AdminLanguage,
} from '../lib/content';
import styles from './ContentEditor.module.css';

export function AppTextEditor({
  languages,
  appTexts,
  onSaved,
}: {
  languages: AdminLanguage[];
  appTexts: Record<string, Record<string, string>>;
  onSaved: () => Promise<void>;
}) {
  const [languageCode, setLanguageCode] = useState(
    languages.find(language => !language.isDefault)?.code ??
      languages[0]?.code ??
      'en',
  );
  const sourceValues = useMemo(() => appTexts.en ?? {}, [appTexts.en]);
  const keys = useMemo(() => Object.keys(sourceValues).sort(), [sourceValues]);
  const [drafts, setDrafts] = useState(appTexts);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const values = drafts[languageCode] ?? {};

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveAppTexts(languageCode, values);
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
      <h2>Application text</h2>
      <p>
        Remote values override bundled app text. Keep named placeholders such
        as <code>{'{{time}}'}</code> unchanged in translations.
      </p>
      <label>
        Editing language
        <select
          value={languageCode}
          onChange={event => setLanguageCode(event.target.value)}
        >
          {languages.map(language => (
            <option key={language.code} value={language.code}>
              {language.nativeName} ({language.code})
            </option>
          ))}
        </select>
      </label>
      <div className={styles.fields}>
        {keys.map(key => (
          <label className={styles.wide} key={key}>
            {key}
            <small>English: {sourceValues[key]}</small>
            <textarea
              placeholder={
                languageCode === 'en'
                  ? sourceValues[key]
                  : 'Leave blank to use bundled English'
              }
              value={values[key] ?? ''}
              onChange={event =>
                setDrafts(current => ({
                  ...current,
                  [languageCode]: {
                    ...(current[languageCode] ?? {}),
                    [key]: event.target.value,
                  },
                }))
              }
            />
          </label>
        ))}
      </div>
      {keys.length === 0 && (
        <p className={styles.error}>
          English app-text definitions have not been seeded yet.
        </p>
      )}
      {error && (
        <p aria-live="polite" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          className={styles.save}
          disabled={saving || keys.length === 0}
          type="submit"
        >
          {saving ? 'Saving…' : 'Save application text'}
        </button>
      </div>
    </form>
  );
}
