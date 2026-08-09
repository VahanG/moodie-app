import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GALLERY_ACCEPT,
  loadGalleryMedia,
  uploadGalleryMedia,
  type GalleryMedia,
} from '../lib/gallery';
import { GalleryEditor } from './GalleryEditor';
import { GalleryDeleteDialog } from './GalleryDeleteDialog';
import styles from './GalleryManager.module.css';

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'Gallery operation failed.';
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GalleryManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<GalleryMedia[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingItem, setDeletingItem] = useState<GalleryMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const loaded = await loadGalleryMedia();
      setItems(loaded);
      setSelectedIds(current => {
        const available = new Set(loaded.map(item => item.id));
        return new Set([...current].filter(id => available.has(id)));
      });
    } catch (loadError) {
      setError(messageFrom(loadError));
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    loadGalleryMedia()
      .then(loaded => {
        if (active) setItems(loaded);
      })
      .catch(loadError => {
        if (active) setError(messageFrom(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter(item =>
      [item.name, item.description, item.mimeType, ...item.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    );
  }, [items, query]);

  const selectedItems = useMemo(
    () => items.filter(item => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const toggleSelected = (id: string) => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openSingleEditor = (id: string) => {
    setSelectedIds(new Set([id]));
    setEditorOpen(true);
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const uploaded = await uploadGalleryMedia(files);
      setItems(current => [...uploaded, ...current]);
      setSelectedIds(new Set(uploaded.map(item => item.id)));
      setEditorOpen(true);
      setNotice(
        `${uploaded.length} ${uploaded.length === 1 ? 'item' : 'items'} uploaded. Add the metadata now.`,
      );
    } catch (uploadError) {
      setError(messageFrom(uploadError));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const allVisibleSelected =
    visibleItems.length > 0 &&
    visibleItems.every(item => selectedIds.has(item.id));

  const toggleAllVisible = () => {
    setSelectedIds(current => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleItems.forEach(item => next.delete(item.id));
      } else {
        visibleItems.forEach(item => next.add(item.id));
      }
      return next;
    });
  };

  return (
    <section className={styles.shell}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Asset workspace</p>
          <h1>Media gallery</h1>
          <p>Upload, preview, and organize reusable Moodie media.</p>
        </div>
        <label className={styles.uploadButton}>
          <input
            accept={GALLERY_ACCEPT}
            disabled={uploading}
            multiple
            onChange={event => handleUpload(Array.from(event.target.files ?? []))}
            ref={inputRef}
            type="file"
          />
          {uploading ? 'Uploading…' : 'Upload media'}
        </label>
      </header>

      <div className={styles.toolbar}>
        <input
          aria-label="Search media"
          className={styles.search}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search names, descriptions, or tags"
          type="search"
          value={query}
        />
        <button
          className={styles.selectButton}
          disabled={visibleItems.length === 0}
          onClick={toggleAllVisible}
          type="button"
        >
          {allVisibleSelected ? 'Clear visible' : 'Select visible'}
        </button>
        <span className={styles.selectionCount}>
          {selectedIds.size} selected
        </span>
        <button
          className={styles.editButton}
          disabled={selectedIds.size === 0}
          onClick={() => setEditorOpen(true)}
          type="button"
        >
          Edit selected
        </button>
      </div>

      {notice && (
        <p aria-live="polite" className={styles.notice}>
          {notice}
        </p>
      )}
      {error && (
        <p aria-live="polite" className={styles.error}>
          {error}
        </p>
      )}

      <div
        className={`${styles.workspace} ${
          editorOpen && selectedItems.length > 0 ? styles.withEditor : ''
        }`}
      >
        <div className={styles.galleryPanel}>
          {loading && <div className={styles.empty}>Loading gallery…</div>}
          {!loading && visibleItems.length === 0 && (
            <div className={styles.empty}>
              <strong>{items.length === 0 ? 'No media yet' : 'No matches'}</strong>
              <span>
                {items.length === 0
                  ? 'Upload images or videos to start the library.'
                  : 'Try a different name, description, or tag.'}
              </span>
            </div>
          )}
          {!loading && visibleItems.length > 0 && (
            <div className={styles.grid}>
              {visibleItems.map(item => {
                const selected = selectedIds.has(item.id);
                return (
                  <article
                    className={`${styles.card} ${
                      selected ? styles.selectedCard : ''
                    }`}
                    key={item.id}
                  >
                    <label className={styles.checkbox}>
                      <input
                        aria-label={`Select ${item.name}`}
                        checked={selected}
                        onChange={() => toggleSelected(item.id)}
                        type="checkbox"
                      />
                    </label>
                    <div className={styles.mediaPreview}>
                      {item.mimeType.startsWith('video/') ? (
                        <video muted preload="metadata" src={item.previewUrl} />
                      ) : (
                        <img alt={item.name} loading="lazy" src={item.previewUrl} />
                      )}
                      <span>{item.mimeType.startsWith('video/') ? 'Video' : 'Image'}</span>
                    </div>
                    <div className={styles.cardBody}>
                      <strong title={item.name}>{item.name}</strong>
                      <p>{item.description || 'No description yet'}</p>
                      <div className={styles.tags}>
                        {item.tags.length > 0 ? (
                          item.tags.slice(0, 3).map(tag => <span key={tag}>{tag}</span>)
                        ) : (
                          <span className={styles.missingTag}>No tags</span>
                        )}
                      </div>
                      <div className={styles.cardFooter}>
                        <small>{formatSize(item.sizeBytes)}</small>
                        <button onClick={() => openSingleEditor(item.id)} type="button">
                          Edit
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {editorOpen && selectedItems.length > 0 && (
          <GalleryEditor
            items={selectedItems}
            key={selectedItems.map(item => item.id).sort().join(':')}
            onClose={() => setEditorOpen(false)}
            onRemove={() => setDeletingItem(selectedItems[0])}
            onSaved={async () => {
              await reload();
              setNotice(
                `${selectedItems.length} ${
                  selectedItems.length === 1 ? 'item' : 'items'
                } updated.`,
              );
            }}
          />
        )}
      </div>

      {deletingItem && (
        <GalleryDeleteDialog
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={async () => {
            setDeletingItem(null);
            setEditorOpen(false);
            setSelectedIds(new Set());
            await reload();
            setNotice('Media and its stored file were permanently removed.');
          }}
        />
      )}
    </section>
  );
}
