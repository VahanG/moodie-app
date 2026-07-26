# Admin Hosting

## Target

The Moodie admin is a React + Vite static site hosted independently on Render.
Its production domain is `admin.moodie.am`.

## Render contract

The repository-root `render.yaml` defines a static site with:

- root directory: `apps/admin`;
- build command: `npm ci && npm run build`;
- publish directory: `dist`;
- SPA fallback rewrite to `index.html`;
- custom domain: `admin.moodie.am`;
- environment values supplied through Render rather than committed to source.

Required build-time values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Both values are intentionally public browser configuration. Service-role keys,
database passwords, and other privileged credentials are prohibited.

## Cutover

1. Deploy the Render Static Site from the repository.
2. Set both Vite environment values in Render and trigger a clean build.
3. Add the DNS records supplied by Render for `admin.moodie.am`.
4. Add `https://admin.moodie.am` to the Supabase Auth redirect allowlist.
5. Verify email/password sign-in, Google sign-in, denied access, and a granted
   admin account.
6. Retire the previous private prototype only after the Render deployment is
   stable.
