import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const adminRoot = new URL("../", import.meta.url);

test("builds a static admin entry document", async () => {
  const html = await readFile(new URL("dist/index.html", adminRoot), "utf8");

  assert.match(html, /<title>Moodie Admin<\/title>/i);
  assert.match(html, /name="robots" content="noindex, nofollow"/i);
  assert.match(html, /https:\/\/admin\.moodie\.am\/og\.png/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /<script[^>]+type="module"/i);
  await access(new URL("dist/og.png", adminRoot));
});

test("keeps the admin app independent and client-only", async () => {
  const [portal, main, packageJson, viteConfig] = await Promise.all([
    readFile(new URL("src/components/AdminPortal.tsx", adminRoot), "utf8"),
    readFile(new URL("src/main.tsx", adminRoot), "utf8"),
    readFile(new URL("package.json", adminRoot), "utf8"),
    readFile(new URL("vite.config.ts", adminRoot), "utf8"),
  ]);

  assert.match(portal, /verifyCurrentAdmin/);
  assert.match(main, /createRoot\(root\)\.render/);
  assert.match(packageJson, /"vite":/);
  assert.doesNotMatch(packageJson, /"next"|"vinext"|"wrangler"/);
  assert.doesNotMatch(portal, /src\/screens|src\/theme|react-native/);
  assert.doesNotMatch(viteConfig, /cloudflare|sites\(\)|vinext/);

  await assert.rejects(access(new URL("app", adminRoot)));
  await assert.rejects(access(new URL(".openai/hosting.json", adminRoot)));
});
