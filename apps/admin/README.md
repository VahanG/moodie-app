# Moodie Admin

Moodie’s standalone React + Vite administration app. It shares Supabase
identity and explicitly documented API contracts with the supporter app, while
owning its UI, dependencies, configuration, build, and deployment.

## Prerequisites

- Node.js `>=22.13.0`

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the two public Supabase values in `.env.local`. Never add a service-role key
or database credentials to this application.

## Security boundary

- Supabase Auth establishes the browser session.
- `public.is_admin()` verifies the current session’s private admin membership.
- Every data mutation must enforce admin authorization through RLS or a trusted
  backend function.
- Rendering the dashboard is not an authorization boundary.
- Published affirmation content is readable by supporter clients.
- Category, affirmation, and background mutations are enforced by table RLS
  using the current authenticated admin membership.

## Content operations

The Content section manages affirmation categories, affirmation text, and
backgrounds. New records start as drafts unless an administrator explicitly
publishes them. Ordering and publication changes are read by the supporter app
from Supabase and become its cached last-known-good payload after validation.

## Render

The repository-root `render.yaml` deploys this directory as a Render Static
Site. Render must be configured with:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Both values are substituted into the browser bundle at build time.

## Commands

- `npm run dev`: start local development.
- `npm run build`: type-check and create the static build.
- `npm test`: build and verify the generated site.
- `npm run lint`: run static checks.
- `npm run preview`: preview the production build locally.
