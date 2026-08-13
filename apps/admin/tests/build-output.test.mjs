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
    galleryStyles,
    galleryBrowser,
    galleryPicker,
    galleryEditor,
    galleryService,
    galleryAttachment,
    galleryImageOptimization,
    galleryDelete,
    imageUrlField,
    topicEditor,
    affirmationEditor,
    backgroundEditor,
    portal,
    main,
    packageJson,
    viteConfig,
  ] = await Promise.all([
    readFile(new URL('src/lib/auth.ts', adminRoot), 'utf8'),
    readFile(new URL('src/lib/config.ts', adminRoot), 'utf8'),
    readFile(new URL('src/components/AdminDashboard.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/components/GalleryManager.tsx', adminRoot), 'utf8'),
    readFile(
      new URL('src/components/GalleryManager.module.css', adminRoot),
      'utf8',
    ),
    readFile(
      new URL('src/components/GalleryMediaBrowser.tsx', adminRoot),
      'utf8',
    ),
    readFile(
      new URL('src/components/GalleryImagePicker.tsx', adminRoot),
      'utf8',
    ),
    readFile(new URL('src/components/GalleryEditor.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/lib/gallery.ts', adminRoot), 'utf8'),
    readFile(new URL('src/lib/galleryAttachment.ts', adminRoot), 'utf8'),
    readFile(new URL('src/lib/galleryImageOptimization.ts', adminRoot), 'utf8'),
    readFile(
      new URL('src/components/GalleryDeleteDialog.tsx', adminRoot),
      'utf8',
    ),
    readFile(new URL('src/components/ImageUrlField.tsx', adminRoot), 'utf8'),
    readFile(new URL('src/components/TopicEditor.tsx', adminRoot), 'utf8'),
    readFile(
      new URL('src/components/AffirmationEditor.tsx', adminRoot),
      'utf8',
    ),
    readFile(new URL('src/components/BackgroundEditor.tsx', adminRoot), 'utf8'),
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
  assert.match(gallery, /GalleryMediaGrid/);
  assert.match(gallery, /Attach by Asset ID/);
  assert.match(gallery, /Files not saved/);
  assert.match(
    galleryStyles,
    /\.editor\s*\{[^}]*max-height:[^;}]+;[^}]*overflow-y:\s*auto;/s,
    'the gallery editor must scroll independently within the viewport',
  );
  assert.match(galleryBrowser, /Awaiting upload/);
  assert.match(galleryBrowser, /Search names, descriptions, or tags/);
  assert.match(galleryPicker, /GalleryMediaGrid/);
  assert.match(galleryPicker, /galleryMediaMatchesQuery/);
  assert.match(imageUrlField, /Select from gallery/);
  assert.match(topicEditor, /ImageUrlField/);
  assert.match(affirmationEditor, /ImageUrlField/);
  assert.match(backgroundEditor, /ImageUrlField/);
  assert.match(galleryEditor, /Asset ID/);
  assert.match(galleryEditor, /Source and licensing/);
  assert.match(galleryService, /asset_id: crypto\.randomUUID\(\)/);
  assert.match(galleryService, /attach_gallery_media_uploads/);
  assert.match(galleryService, /optimizeGalleryUploadFiles/);
  assert.match(galleryService, /removeGalleryObjects/);
  assert.match(galleryService, /if \(!objectPath\) return \{ deleted: true \}/);
  assert.match(galleryAttachment, /planGalleryMediaAttachments/);
  assert.match(galleryImageOptimization, /image\/webp/);
  assert.match(galleryImageOptimization, /GALLERY_IMAGE_MAX_WIDTH = 1440/);
  assert.match(galleryDelete, /getGalleryMediaReferences/);
  assert.match(galleryDelete, /deleteGalleryMedia/);
  assert.match(galleryDelete, /Removal is blocked/);
  assert.match(portal, /verifyCurrentAdmin/);
  assert.match(
    portal,
    /verifiedAdminId\.current === session\.user\.id/,
    'repeated auth events for the verified admin must retain the dashboard',
  );
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
