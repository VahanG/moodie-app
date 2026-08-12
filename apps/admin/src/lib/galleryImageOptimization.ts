export const GALLERY_IMAGE_MAX_WIDTH = 1440;
export const GALLERY_IMAGE_WEBP_QUALITY = 0.8;

const JPEG_MIME_TYPE = 'image/jpeg';
const WEBP_MIME_TYPE = 'image/webp';

export type GalleryUploadFile = {
  file: File;
  originalWidth: number | null;
  originalHeight: number | null;
  optimized: boolean;
};

export function calculateGalleryImageSize(
  width: number,
  height: number,
  maxWidth = GALLERY_IMAGE_MAX_WIDTH,
): { width: number; height: number } {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0 ||
    !Number.isFinite(maxWidth) ||
    maxWidth <= 0
  ) {
    throw new Error('The JPEG has invalid dimensions.');
  }

  if (width <= maxWidth) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const scale = maxWidth / width;
  return {
    width: Math.round(maxWidth),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function galleryWebpFilename(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '').trim();
  return `${base || 'image'}.webp`;
}

function canvasToWebp(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          reject(new Error('The JPEG could not be encoded as WebP.'));
          return;
        }
        if (blob.type !== WEBP_MIME_TYPE) {
          reject(
            new Error(
              'This browser cannot encode WebP images. Use a current browser and try again.',
            ),
          );
          return;
        }
        resolve(blob);
      },
      WEBP_MIME_TYPE,
      GALLERY_IMAGE_WEBP_QUALITY,
    );
  });
}

export async function optimizeGalleryUploadFile(
  file: File,
): Promise<GalleryUploadFile> {
  if (file.type !== JPEG_MIME_TYPE) {
    return {
      file,
      originalWidth: null,
      originalHeight: null,
      optimized: false,
    };
  }

  let image: ImageBitmap;
  try {
    image = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`${file.name} could not be decoded as a JPEG.`);
  }

  try {
    const originalWidth = image.width;
    const originalHeight = image.height;
    const outputSize = calculateGalleryImageSize(originalWidth, originalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = outputSize.width;
    canvas.height = outputSize.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error(`${file.name} could not be prepared for optimization.`);
    }

    context.drawImage(image, 0, 0, outputSize.width, outputSize.height);
    const webp = await canvasToWebp(canvas);
    if (webp.size === 0) {
      throw new Error(`${file.name} produced an empty optimized image.`);
    }

    return {
      file: new File([webp], galleryWebpFilename(file.name), {
        type: WEBP_MIME_TYPE,
        lastModified: file.lastModified,
      }),
      originalWidth,
      originalHeight,
      optimized: true,
    };
  } finally {
    image.close();
  }
}

export async function optimizeGalleryUploadFiles(
  files: File[],
): Promise<GalleryUploadFile[]> {
  const optimized: GalleryUploadFile[] = [];

  // Decode sequentially so a large batch does not hold several full-resolution
  // image bitmaps in memory at once.
  for (const file of files) {
    optimized.push(await optimizeGalleryUploadFile(file));
  }

  return optimized;
}
