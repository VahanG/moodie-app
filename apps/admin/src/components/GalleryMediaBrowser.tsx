import { type GalleryMedia } from '../lib/gallery';
import styles from './GalleryManager.module.css';

function formatSize(bytes: number | null): string {
  if (bytes === null) return 'Awaiting file';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GallerySearch({
  query,
  onQueryChange,
  autoFocus = false,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <input
      aria-label="Search media"
      autoFocus={autoFocus}
      className={styles.search}
      onChange={event => onQueryChange(event.target.value)}
      placeholder="Search names, descriptions, or tags"
      type="search"
      value={query}
    />
  );
}

export function GalleryMediaGrid({
  items,
  totalItems,
  loading,
  selectedIds,
  selectionType,
  onSelect,
  actionLabel,
  onAction,
  emptyLibraryText = 'Upload images or videos to start the library.',
}: {
  items: GalleryMedia[];
  totalItems: number;
  loading: boolean;
  selectedIds: ReadonlySet<string>;
  selectionType: 'checkbox' | 'radio';
  onSelect: (id: string) => void;
  actionLabel: string;
  onAction: (item: GalleryMedia) => void;
  emptyLibraryText?: string;
}) {
  if (loading) return <div className={styles.empty}>Loading gallery…</div>;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <strong>{totalItems === 0 ? 'No media yet' : 'No matches'}</strong>
        <span>
          {totalItems === 0
            ? emptyLibraryText
            : 'Try a different name, description, or tag.'}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map(item => {
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
                name={selectionType === 'radio' ? 'gallery-media' : undefined}
                onChange={() => onSelect(item.id)}
                type={selectionType}
              />
            </label>
            <div className={styles.mediaPreview}>
              {!item.objectPath ? (
                <div className={styles.pendingPreview}>
                  <strong>Awaiting upload</strong>
                  <span>{item.assetId}</span>
                </div>
              ) : item.mimeType?.startsWith('video/') ? (
                <video muted preload="metadata" src={item.previewUrl} />
              ) : (
                <img alt={item.name} loading="lazy" src={item.previewUrl} />
              )}
              {item.objectPath && (
                <span>
                  {item.mimeType?.startsWith('video/') ? 'Video' : 'Image'}
                </span>
              )}
            </div>
            <div className={styles.cardBody}>
              <strong title={item.name}>{item.name}</strong>
              <small className={styles.assetId}>{item.assetId}</small>
              <p>{item.description || 'No description yet'}</p>
              <div className={styles.tags}>
                {item.tags.length > 0 ? (
                  item.tags
                    .slice(0, 3)
                    .map(tag => <span key={tag}>{tag}</span>)
                ) : (
                  <span className={styles.missingTag}>No tags</span>
                )}
              </div>
              <div className={styles.cardFooter}>
                <small>{formatSize(item.sizeBytes)}</small>
                <button onClick={() => onAction(item)} type="button">
                  {actionLabel}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
