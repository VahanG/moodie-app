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
  onRemove,
  onSaved,
}: {
  items: GalleryMedia[];
  onClose: () => void;
  onRemove: () => void;
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
  const [assetId, setAssetId] = useState(() => items[0].assetId);
  const [sourceProvider, setSourceProvider] = useState(
    () => items[0].sourceProvider,
  );
  const [creatorName, setCreatorName] = useState(() => items[0].creatorName);
  const [creatorHandle, setCreatorHandle] = useState(
    () => items[0].creatorHandle ?? '',
  );
  const [licenseName, setLicenseName] = useState(() => items[0].licenseName);
  const [licenseCheckedOn, setLicenseCheckedOn] = useState(
    () => items[0].licenseCheckedOn ?? '',
  );
  const [downloadedOn, setDownloadedOn] = useState(
    () => items[0].downloadedOn ?? '',
  );
  const [originalWidth, setOriginalWidth] = useState(
    () => items[0].originalWidth?.toString() ?? '',
  );
  const [originalHeight, setOriginalHeight] = useState(
    () => items[0].originalHeight?.toString() ?? '',
  );
  const [assetStatus, setAssetStatus] = useState(items[0].assetStatus);
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
    if (single) {
      changes.assetId = assetId;
      changes.sourceProvider = sourceProvider;
      changes.creatorName = creatorName;
      changes.creatorHandle = creatorHandle;
      changes.licenseName = licenseName;
      changes.licenseCheckedOn = licenseCheckedOn || null;
      changes.downloadedOn = downloadedOn || null;
      changes.originalWidth = originalWidth ? Number(originalWidth) : null;
      changes.originalHeight = originalHeight ? Number(originalHeight) : null;
      changes.assetStatus = assetStatus;
    }

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
  const invalidSourceMetadata =
    single &&
    (!assetId.trim() ||
      !sourceProvider.trim() ||
      !creatorName.trim() ||
      !licenseName.trim());
  const dimensionsPresent = Boolean(originalWidth || originalHeight);
  const invalidDimensions =
    single &&
    dimensionsPresent &&
    (!originalWidth ||
      !originalHeight ||
      !Number.isInteger(Number(originalWidth)) ||
      !Number.isInteger(Number(originalHeight)) ||
      Number(originalWidth) <= 0 ||
      Number(originalHeight) <= 0);

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
          !item.objectPath ? (
            <div className={styles.pendingPreview} key={item.id}>
              <strong>Awaiting upload</strong>
              <span>{item.assetId}</span>
            </div>
          ) : item.mimeType?.startsWith('video/') ? (
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

        {single && (
          <>
            <div className={styles.metadataDivider}>Source and licensing</div>
            <EditField applied bulk={false} label="Asset ID">
              <input
                onChange={event => setAssetId(event.target.value)}
                required
                type="text"
                value={assetId}
              />
              <small>
                Required and unique. Later uploads match this value.
              </small>
            </EditField>
            <EditField applied bulk={false} label="Source provider">
              <input
                onChange={event => setSourceProvider(event.target.value)}
                placeholder="unsplash"
                required
                type="text"
                value={sourceProvider}
              />
            </EditField>
            <EditField applied bulk={false} label="Creator name">
              <input
                onChange={event => setCreatorName(event.target.value)}
                required
                type="text"
                value={creatorName}
              />
            </EditField>
            <EditField applied bulk={false} label="Creator handle">
              <input
                onChange={event => setCreatorHandle(event.target.value)}
                placeholder="handle without @"
                type="text"
                value={creatorHandle}
              />
            </EditField>
            <EditField applied bulk={false} label="License name">
              <input
                onChange={event => setLicenseName(event.target.value)}
                placeholder="Unsplash License"
                required
                type="text"
                value={licenseName}
              />
            </EditField>
            <EditField applied bulk={false} label="License checked">
              <input
                onChange={event => setLicenseCheckedOn(event.target.value)}
                type="date"
                value={licenseCheckedOn}
              />
            </EditField>
            <EditField applied bulk={false} label="Downloaded">
              <input
                onChange={event => setDownloadedOn(event.target.value)}
                type="date"
                value={downloadedOn}
              />
            </EditField>
            <div className={styles.dimensionFields}>
              <EditField applied bulk={false} label="Original width">
                <input
                  min="1"
                  onChange={event => setOriginalWidth(event.target.value)}
                  placeholder="px"
                  type="number"
                  value={originalWidth}
                />
              </EditField>
              <EditField applied bulk={false} label="Original height">
                <input
                  min="1"
                  onChange={event => setOriginalHeight(event.target.value)}
                  placeholder="px"
                  type="number"
                  value={originalHeight}
                />
              </EditField>
            </div>
            <EditField applied bulk={false} label="Asset status">
              <select
                onChange={event =>
                  setAssetStatus(
                    event.target.value as GalleryMedia['assetStatus'],
                  )
                }
                value={assetStatus}
              >
                <option value="pending_upload">Pending upload</option>
                <option value="pending_review">Pending review</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </EditField>
          </>
        )}

        {error && (
          <p aria-live="polite" className={styles.editorError}>
            {error}
          </p>
        )}

        <button
          className={styles.saveButton}
          disabled={
            saving ||
            invalidName ||
            invalidSourceMetadata ||
            invalidDimensions ||
            (!single && !hasBulkField)
          }
          type="submit"
        >
          {saving
            ? 'Saving…'
            : single
            ? 'Save changes'
            : `Apply to ${items.length} items`}
        </button>
        {single && (
          <button
            className={styles.removeButton}
            disabled={saving}
            onClick={onRemove}
            type="button"
          >
            Remove media
          </button>
        )}
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
  onToggle?: () => void;
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
