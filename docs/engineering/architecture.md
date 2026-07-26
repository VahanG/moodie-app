# Engineering Architecture

## Current app layout
- `src/screens`: UI composition.
- `src/features`: business logic/services.
- `src/types`: shared typings.
- `apps/admin`: independently built and deployed web-only administration app.

## Guideline
Keep screens thin, move logic into feature services, and document new module boundaries before coding.

## Admin web boundary

The admin panel is a standalone React + Vite single-page application under
`apps/admin`. It does not import React Native screens, navigation, state, theme
tokens, or feature services from the supporter app.

The two applications share only these contracts:

- the Supabase project and Auth identities;
- public database operations explicitly designed for both clients, currently
  only `public.is_admin()`;
- framework-neutral schemas or generated API types when those are introduced.

Each application owns its dependencies, environment variables, UI, routing,
tests, build, and deployment. Admin authorization is enforced by Postgres RLS
or trusted backend functions for every protected data operation; rendering an
admin route or hiding a control is never sufficient authorization.

The admin app is built as static assets and targeted at a Render Static Site
with `admin.moodie.am` as its production domain. It does not require SSR or an
application server. The existing private prototype deployment should remain
available until the Render deployment, DNS, authentication callbacks, and
admin membership flow have been verified.
