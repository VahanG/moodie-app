import { useCallback, useId, useState } from 'react';
import { GalleryImagePicker } from './GalleryImagePicker';
import styles from './ContentEditor.module.css';

export function ImageUrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(
    null,
  );
  const closePicker = useCallback(() => setPickerOpen(false), []);

  return (
    <div className={styles.imageField}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.imageInputRow}>
        <input
          id={inputId}
          onChange={event => {
            setSelectedPreviewUrl(null);
            onChange(event.target.value);
          }}
          required
          type="url"
          value={value}
        />
        <button
          className={styles.galleryButton}
          onClick={() => setPickerOpen(true)}
          type="button"
        >
          Select from gallery
        </button>
      </div>
      {selectedPreviewUrl && (
        <div className={styles.imageSelection}>
          <img alt="Selected gallery item" src={selectedPreviewUrl} />
          <span>Gallery image selected</span>
        </div>
      )}
      {pickerOpen && (
        <GalleryImagePicker
          currentValue={value}
          onClose={closePicker}
          onSelect={(imageUri, previewUrl) => {
            onChange(imageUri);
            setSelectedPreviewUrl(previewUrl);
          }}
        />
      )}
    </div>
  );
}
