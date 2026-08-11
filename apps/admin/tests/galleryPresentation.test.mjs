import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/lib/galleryPresentation.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { galleryMediaContentUri, galleryMediaMatchesQuery } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

const item = {
  id: 'media-id',
  assetId: 'asset-123',
  objectPath: 'admin-id/image.jpg',
  name: 'Calm sunrise',
  description: 'Warm mountains at dawn',
  tags: ['calm', 'morning'],
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  sourceProvider: 'unsplash',
  creatorName: 'A Photographer',
  creatorHandle: 'photographer',
  licenseName: 'Unsplash License',
  licenseCheckedOn: '2026-08-01',
  downloadedOn: '2026-08-02',
  originalWidth: 1000,
  originalHeight: 1500,
  assetStatus: 'approved',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
  previewUrl: 'https://signed.example/image.jpg',
};

test('gallery search matches the same metadata used by the gallery page', () => {
  assert.equal(galleryMediaMatchesQuery(item, 'SUNRISE'), true);
  assert.equal(galleryMediaMatchesQuery(item, 'morning'), true);
  assert.equal(galleryMediaMatchesQuery(item, 'asset-123'), true);
  assert.equal(galleryMediaMatchesQuery(item, 'published'), false);
});

test('content selection stores a stable gallery reference', () => {
  assert.equal(
    galleryMediaContentUri(item),
    'gallery://admin-id/image.jpg',
  );
  assert.throws(
    () => galleryMediaContentUri({ ...item, objectPath: null }),
    /uploaded file/,
  );
});
