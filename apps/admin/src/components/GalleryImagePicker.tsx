import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadGalleryMedia, type GalleryMedia } from '../lib/gallery';
import {
  galleryMediaContentUri,
  galleryMediaMatchesQuery,
} from '../lib/galleryPresentation';
import { GalleryMediaGrid, GallerySearch } from './GalleryMediaBrowser';
import styles from './GalleryManager.module.css';

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Gallery could not be loaded.';
}

export function GalleryImagePicker({
  currentValue,
  onClose,
  onSelect,
}: {
  currentValue: string;
  onClose: () => void;
  onSelect: (imageUri: string, previewUrl: string) => void;
}) {
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    loadGalleryMedia()
      .then(loaded => {
        if (!active) return;
        const selectable = loaded.filter(
          item =>
            Boolean(item.objectPath && item.previewUrl) &&
            item.mimeType?.startsWith('image/'),
        );
        setItems(selectable);
        const current = selectable.find(
          item => galleryMediaContentUri(item) === currentValue,
        );
        setSelectedId(current?.id ?? null);
      })
      .catch(loadError => {
        if (active) setError(messageFrom(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentValue, onClose]);

  const visibleItems = useMemo(
    () => items.filter(item => galleryMediaMatchesQuery(item, query)),
    [items, query],
  );

  const choose = (item: GalleryMedia) => {
    onSelect(galleryMediaContentUri(item), item.previewUrl);
    onClose();
  };

  return createPortal(
    <div
      className={styles.dialogBackdrop}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="gallery-picker-title"
        aria-modal="true"
        className={styles.pickerDialog}
        role="dialog"
      >
        <header className={styles.pickerHeader}>
          <div>
            <span className={styles.kicker}>Media gallery</span>
            <h2 id="gallery-picker-title">Select an image</h2>
            <p>Choose an uploaded gallery image for this content item.</p>
          </div>
          <button
            aria-label="Close gallery picker"
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className={styles.pickerToolbar}>
          <GallerySearch autoFocus onQueryChange={setQuery} query={query} />
        </div>

        <div className={styles.pickerPanel}>
          {error ? (
            <p aria-live="polite" className={styles.pickerError}>
              {error}
            </p>
          ) : (
            <GalleryMediaGrid
              actionLabel="Use image"
              emptyLibraryText="Upload an image in Gallery before selecting it here."
              items={visibleItems}
              loading={loading}
              onAction={choose}
              onSelect={setSelectedId}
              selectedIds={selectedId ? new Set([selectedId]) : new Set()}
              selectionType="radio"
              totalItems={items.length}
            />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}
