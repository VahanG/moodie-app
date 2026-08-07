import { useState, type FormEvent } from 'react';
import {
  updateGalleryMedia,
  type GalleryMedia,
  type GalleryMediaChanges,
} from '../lib/gallery';
import styles from './GalleryManager.module.css';

type EditableField = 'name' | 'description' | 'tags';

function commonText(
  items: GalleryMedia[],
  read: (item: GalleryMedia) => string,
): string {
  const first = read(items[0]);
  return items.every(item => read(item) === first) ? first : '';
}

export function GalleryEditor({
  items,
  onClose,
  onSaved,
}: {
  items: GalleryMedia[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const single = items.length === 1;
  const [name, setName] = useState(() => commonText(items, item => item.name));
  const [description, setDescription] = useState(() =>
    commonText(items, item => item.description),
  );
  const [tags, setTags] = useState(() =>
    commonText(items, item => item.tags.join(', ')),
  );
  const [applied, setApplied] = useState<Record<EditableField, boolean>>({
    name: false,
    description: false,
    tags: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleApplied = (field: EditableField) => {
    setApplied(current => ({ ...current, [field]: !current[field] }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const changes: GalleryMediaChanges = {};
    if (single || applied.name) changes.name = name;
    if (single || applied.description) changes.description = description;
    if (single || applied.tags) changes.tags = tags.split(',');

    setSaving(true);
    setError(null);
    try {
      await updateGalleryMedia(
        items.map(item => item.id),
        changes,
      );
      await onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Gallery metadata could not be saved.',
      );
    } finally {
      setSaving(false);
    }
  };

  const hasBulkField = Object.values(applied).some(Boolean);
  const invalidName = (single || applied.name) && !name.trim();

  return (
    <aside aria-label="Edit gallery metadata" className={styles.editor}>
      <div className={styles.editorHeader}>
        <div>
          <span className={styles.kicker}>Metadata</span>
          <h2>{single ? 'Edit media' : `Edit ${items.length} items`}</h2>
        </div>
        <button
          aria-label="Close metadata editor"
          className={styles.closeButton}
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>

      <div className={single ? styles.editorPreview : styles.previewStrip}>
        {items.map(item =>
          item.mimeType.startsWith('video/') ? (
            <video
              controls={single}
              key={item.id}
              muted
              preload="metadata"
              src={item.previewUrl}
            />
          ) : (
            <img alt={item.name} key={item.id} src={item.previewUrl} />
          ),
        )}
      </div>

      {!single && (
        <p className={styles.bulkNote}>
          Choose the fields to apply to every selected item. Other metadata
          stays unchanged.
        </p>
      )}

      <form className={styles.editorForm} onSubmit={submit}>
        <EditField
          applied={applied.name}
          bulk={!single}
          label="Name"
          onToggle={() => toggleApplied('name')}
        >
          <input
            disabled={!single && !applied.name}
            onChange={event => setName(event.target.value)}
            placeholder={single ? 'Media name' : 'Shared name'}
            type="text"
            value={name}
          />
        </EditField>

        <EditField
          applied={applied.description}
          bulk={!single}
          label="Description"
          onToggle={() => toggleApplied('description')}
        >
          <textarea
            disabled={!single && !applied.description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Describe how this media should be used"
            rows={4}
            value={description}
          />
        </EditField>

        <EditField
          applied={applied.tags}
          bulk={!single}
          label="Tags"
          onToggle={() => toggleApplied('tags')}
        >
          <input
            disabled={!single && !applied.tags}
            onChange={event => setTags(event.target.value)}
            placeholder="calm, summer, campaign"
            type="text"
            value={tags}
          />
          <small>Separate tags with commas.</small>
        </EditField>

        {error && (
          <p aria-live="polite" className={styles.editorError}>
            {error}
          </p>
        )}

        <button
          className={styles.saveButton}
          disabled={saving || invalidName || (!single && !hasBulkField)}
          type="submit"
        >
          {saving
            ? 'Saving…'
            : single
              ? 'Save changes'
              : `Apply to ${items.length} items`}
        </button>
      </form>
    </aside>
  );
}

function EditField({
  applied,
  bulk,
  children,
  label,
  onToggle,
}: {
  applied: boolean;
  bulk: boolean;
  children: React.ReactNode;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {bulk && (
          <span className={styles.applyToggle}>
            <input checked={applied} onChange={onToggle} type="checkbox" />
            Apply to all
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

