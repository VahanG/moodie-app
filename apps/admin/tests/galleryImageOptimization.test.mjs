import assert from 'node:assert/strict';
import { File } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/lib/galleryImageOptimization.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const {
  GALLERY_IMAGE_MAX_WIDTH,
  GALLERY_IMAGE_WEBP_QUALITY,
  calculateGalleryImageSize,
  galleryWebpFilename,
  optimizeGalleryUploadFile,
} = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

test('limits JPEG width without upscaling and preserves aspect ratio', () => {
  assert.deepEqual(calculateGalleryImageSize(3000, 4500), {
    width: 1440,
    height: 2160,
  });
  assert.deepEqual(calculateGalleryImageSize(900, 1350), {
    width: 900,
    height: 1350,
  });
  assert.equal(GALLERY_IMAGE_MAX_WIDTH, 1440);
  assert.equal(GALLERY_IMAGE_WEBP_QUALITY, 0.8);
});

test('creates a WebP filename from JPEG names', () => {
  assert.equal(galleryWebpFilename('Morning.Light.JPG'), 'Morning.Light.webp');
  assert.equal(galleryWebpFilename('image'), 'image.webp');
});

test('converts a JPEG to an optimized WebP file in the browser', async () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap;
  const originalDocument = globalThis.document;
  const calls = { quality: null, type: null, width: 0, height: 0 };
  const bitmap = {
    closeCalled: false,
    height: 4500,
    width: 3000,
    close() {
      this.closeCalled = true;
    },
  };
  const canvas = {
    height: 0,
    width: 0,
    getContext() {
      return { drawImage() {} };
    },
    toBlob(callback, type, quality) {
      calls.type = type;
      calls.quality = quality;
      calls.width = this.width;
      calls.height = this.height;
      callback(new Blob(['optimized'], { type: 'image/webp' }));
    },
  };

  globalThis.createImageBitmap = async () => bitmap;
  globalThis.document = {
    createElement(tagName) {
      assert.equal(tagName, 'canvas');
      return canvas;
    },
  };

  try {
    const input = new File(['jpeg'], 'affirmation.jpg', {
      type: 'image/jpeg',
      lastModified: 123,
    });
    const result = await optimizeGalleryUploadFile(input);

    assert.equal(result.file.name, 'affirmation.webp');
    assert.equal(result.file.type, 'image/webp');
    assert.equal(result.originalWidth, 3000);
    assert.equal(result.originalHeight, 4500);
    assert.equal(result.optimized, true);
    assert.deepEqual(calls, {
      quality: 0.8,
      type: 'image/webp',
      width: 1440,
      height: 2160,
    });
    assert.equal(bitmap.closeCalled, true);
  } finally {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    globalThis.document = originalDocument;
  }
});

test('leaves non-JPEG files unchanged', async () => {
  const input = new File(['webp'], 'ready.webp', { type: 'image/webp' });
  const result = await optimizeGalleryUploadFile(input);

  assert.equal(result.file, input);
  assert.equal(result.originalWidth, null);
  assert.equal(result.originalHeight, null);
  assert.equal(result.optimized, false);
});
