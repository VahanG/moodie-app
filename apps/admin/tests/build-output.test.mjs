import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const adminRoot = new URL('../', import.meta.url);

test('builds a static admin entry document', async () => {
  const html = await readFile(new URL('dist/index.html', adminRoot), 'utf8');

  assert.match(html, /<title>Moodie Admin<\/title>/i);
  assert.match(html, /name="robots" content="noindex, nofollow"/i);
  assert.match(html, /https:\/\/admin\.moodie\.am\/og\.png/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /<script[^>]+type="module"/i);
  await access(new URL('dist/og.png', adminRoot));
});

test('keeps the admin app independent and client-only', async () => {
  const [
    auth,
    config,
    dashboard,
    gallery,
    galleryEditor,
    galleryService,
    galleryDelete,
    portal,
    main,
    packageJson,
    viteConfig,
  ] = await Promise.all([
    readFile(new URL('src/lib/auth.ts', adminRoot), 'utf8'),
    readFile(new URL('src/lib/config.ts', adminRoot), 'utf8'),
    readFile(new URL('src/components/AdminDashboard.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/components/GalleryManager.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/components/GalleryEditor.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/lib/gallery.ts', adminRoot), 'utf8'),
    readFile(
      new URL('src/components/GalleryDeleteDialog.tsx', adminRoot),
      'utf8',
    ),
    readFile(new URL('src/components/AdminPortal.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/main.tsx', adminRoot), 'utf8'),
    readFile(new URL('package.json', adminRoot), 'utf8'),
    readFile(new URL('vite.config.ts', adminRoot), 'utf8'),
  ]);

  assert.match(auth, /redirectTo: window\.location\.origin/);
  assert.match(config, /EXPO_PUBLIC_SUPABASE_URL/);
  assert.match(config, /EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(dashboard, /GalleryManager/);
  assert.match(gallery, /multiple/);
  assert.match(gallery, /setEditorOpen\(true\)/);
  assert.match(gallery, /Awaiting upload/);
  assert.match(galleryEditor, /Asset ID/);
  assert.match(galleryEditor, /Source and licensing/);
  assert.match(galleryService, /asset_id: crypto\.randomUUID\(\)/);
  assert.match(galleryService, /if \(!objectPath\) return \{ deleted: true \}/);
  assert.match(galleryDelete, /getGalleryMediaReferences/);
  assert.match(galleryDelete, /deleteGalleryMedia/);
  assert.match(galleryDelete, /Removal is blocked/);
  assert.match(portal, /verifyCurrentAdmin/);
  assert.match(main, /createRoot\(root\)\.render/);
  assert.match(packageJson, /"vite":/);
  assert.match(viteConfig, /envDir: "\.\.\/\.\."/);
  assert.match(viteConfig, /EXPO_PUBLIC_SUPABASE_/);
  assert.doesNotMatch(packageJson, /"next"|"vinext"|"wrangler"/);
  assert.doesNotMatch(portal, /src\/screens|src\/theme|react-native/);
  assert.doesNotMatch(viteConfig, /cloudflare|sites\(\)|vinext/);

  await assert.rejects(access(new URL('app', adminRoot)));
  await assert.rejects(access(new URL('.openai/hosting.json', adminRoot)));
});
