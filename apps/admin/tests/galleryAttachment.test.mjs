import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/lib/galleryAttachment.ts', import.meta.url),
  'utf8',
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { planGalleryMediaAttachments } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

const image = (name, overrides = {}) => ({
  name,
  size: 1024,
  type: 'image/jpeg',
  ...overrides,
});

const asset = (id, assetId, objectPath = null) => ({
  id,
  assetId,
  objectPath,
});

test('matches an exact case-sensitive Asset ID contained in a filename', () => {
  const result = planGalleryMediaAttachments(
    [image('edited-6fOIh-UfV5U-original.jpg')],
    [asset('one', '6fOIh-UfV5U')],
  );

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].asset.id, 'one');
  assert.deepEqual(result.rejected, []);

  const wrongCase = planGalleryMediaAttachments(
    [image('edited-6foih-ufv5u-original.jpg')],
    [asset('one', '6fOIh-UfV5U')],
  );
  assert.equal(wrongCase.matches.length, 0);
  assert.equal(wrongCase.rejected[0].code, 'unmatched_asset');
});

test('rejects ambiguous, already-attached, and unknown filenames', () => {
  const result = planGalleryMediaAttachments(
    [image('abc-long.jpg'), image('attached-id.jpg'), image('unknown.jpg')],
    [
      asset('short', 'abc'),
      asset('long', 'abc-long'),
      asset('attached', 'attached-id', 'admin/path.jpg'),
    ],
  );

  assert.deepEqual(
    result.rejected.map(rejection => rejection.code),
    ['ambiguous_asset', 'already_attached', 'unmatched_asset'],
  );
  assert.equal(result.matches.length, 0);
});

test('rejects every duplicate file for one Asset ID', () => {
  const result = planGalleryMediaAttachments(
    [image('asset-one.jpg'), image('copy-asset-one.png')],
    [asset('one', 'asset-one')],
  );

  assert.equal(result.matches.length, 0);
  assert.deepEqual(
    result.rejected.map(rejection => rejection.code),
    ['duplicate_asset', 'duplicate_asset'],
  );
});

test('rejects invalid files before filename matching', () => {
  const result = planGalleryMediaAttachments(
    [
      image('asset-one.jpg', { size: 0 }),
      image('asset-one.txt', { type: 'text/plain' }),
      image('asset-one-large.jpg', { size: 50 * 1024 * 1024 + 1 }),
    ],
    [asset('one', 'asset-one')],
  );

  assert.deepEqual(
    result.rejected.map(rejection => rejection.code),
    ['empty_file', 'unsupported_type', 'oversized_file'],
  );
  assert.equal(result.matches.length, 0);
});
