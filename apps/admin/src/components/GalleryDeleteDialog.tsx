import { useEffect, useState } from 'react';
import {
  deleteGalleryMedia,
  getGalleryMediaReferences,
  type GalleryMedia,
  type GalleryMediaReference,
} from '../lib/gallery';
import styles from './GalleryManager.module.css';

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Media usage could not be verified.';
}

export function GalleryDeleteDialog({
  item,
  onClose,
  onDeleted,
}: {
  item: GalleryMedia;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const [references, setReferences] = useState<GalleryMediaReference[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    getGalleryMediaReferences(item.id)
      .then(result => {
        if (active) setReferences(result);
      })
      .catch(loadError => {
        if (active) setError(messageFrom(loadError));
      });

    return () => {
      active = false;
    };
  }, [item.id]);

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteGalleryMedia(item);
      if (!result.deleted) {
        setReferences(result.references);
        return;
      }
      await onDeleted();
    } catch (deleteError) {
      setError(messageFrom(deleteError));
    } finally {
      setDeleting(false);
    }
  };

  const blocked = references !== null && references.length > 0;

  return (
    <div
      className={styles.dialogBackdrop}
      onMouseDown={event => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
    >
      <section
        aria-labelledby="gallery-delete-title"
        aria-modal="true"
        className={styles.deleteDialog}
        role="dialog"
      >
        <div className={styles.deleteDialogHeader}>
          <div>
            <span className={styles.kicker}>Permanent removal</span>
            <h2 id="gallery-delete-title">
              {blocked ? 'This media is in use' : 'Remove this media?'}
            </h2>
          </div>
          <button
            aria-label="Close removal dialog"
            className={styles.closeButton}
            disabled={deleting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className={styles.deleteSummary}>
          {!item.objectPath ? (
            <div className={styles.pendingPreview}>
              <strong>Awaiting upload</strong>
            </div>
          ) : item.mimeType?.startsWith('video/') ? (
            <video muted preload="metadata" src={item.previewUrl} />
          ) : (
            <img alt="" src={item.previewUrl} />
          )}
          <div>
            <strong>{item.name}</strong>
            <small>{item.objectPath ?? item.assetId}</small>
          </div>
        </div>

        {references === null && !error && (
          <p className={styles.checkingUsage}>
            Checking where this media is used…
          </p>
        )}

        {blocked && (
          <div className={styles.blockedWarning}>
            <strong>Removal is blocked.</strong>
            <p>
              Replace this media on the following content before removing it
              from the gallery:
            </p>
            <ul>
              {references.map(reference => (
                <li key={`${reference.entityType}:${reference.entityId}`}>
                  <span>{reference.entityType}</span>
                  <code>{reference.entityId}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {references?.length === 0 && !error && (
          <p className={styles.deleteWarning}>
            This permanently removes
            {item.objectPath ? ' the file and' : ''} all of its gallery
            metadata. This action cannot be undone.
          </p>
        )}

        {error && (
          <div aria-live="polite" className={styles.blockedWarning}>
            <strong>Removal is blocked for safety.</strong>
            <p>{error}</p>
          </div>
        )}

        <div className={styles.dialogActions}>
          <button
            className={styles.cancelButton}
            disabled={deleting}
            onClick={onClose}
            type="button"
          >
            {blocked || error ? 'Close' : 'Cancel'}
          </button>
          {references?.length === 0 && !error && (
            <button
              className={styles.confirmDeleteButton}
              disabled={deleting}
              onClick={remove}
              type="button"
            >
              {deleting ? 'Removing…' : 'Remove permanently'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
