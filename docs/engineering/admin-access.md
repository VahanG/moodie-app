# Admin Access

Admin membership is authoritative in Postgres. The mobile/web client has no
operation that can grant, update, or revoke the role.

## Data and API boundary

- `private.admin_users` stores one active membership per Supabase Auth user ID.
- The `private` schema is not exposed through the Supabase Data API.
- Anonymous and authenticated database roles have no table privileges.
- `public.is_admin()` is the only client operation. It takes no arguments,
  derives the user from `auth.uid()`, and returns `false` when there is no
  authenticated or matching user.
- Future admin-only RLS policies should use `(select public.is_admin())`.
  Hiding controls in the app is not an authorization boundary.

## Admin web application

The web-only admin client lives in `apps/admin` as a React + Vite SPA and
authenticates against the same Supabase project as the supporter app. It has
its own Supabase browser client and environment configuration so it can be
built and deployed independently.

The initial shell supports existing-user email/password and Google sign-in. It
checks `public.is_admin()` after session restoration and after every
authentication change, and fails closed when the RPC is unavailable or returns
anything other than `true`.

The dashboard Content section manages affirmation categories, affirmation
text, and selectable backgrounds. These operations use public Supabase tables
with RLS-protected administrator mutations. Future catalog, commerce,
analytics, or release operations must still have a documented contract and a
database RLS policy or trusted server boundary before their UI is enabled.

The Content section also owns supported languages, per-language editorial
translations, and keyed application-text overrides. The supporter app may read
only enabled languages and their published translated content. Administrators
can read and mutate all language and translation rows through policies guarded
by `(select public.is_admin())`.

### Affirmation content authorization

- Anonymous and authenticated supporter clients can select only published
  rows from `affirmation_topics`, `affirmations`, and
  `affirmation_backgrounds`.
- Authenticated clients receive table mutation grants, but RLS permits a
  mutation only when `(select public.is_admin())` succeeds.
- Administrators can create drafts, edit, order, publish, unpublish, and
  delete records in the Content section.
- Deleting a category cascades to its affirmation records and requires an
  explicit browser confirmation.
- A service-role key is not used by or exposed to the admin browser.

Required admin web environment values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

For local development, the admin Vite config also reads the repository-root
`.env` and maps the existing `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values. This keeps one local public
configuration for both clients. Render continues to supply the `VITE_` values
independently at build time.

Only the Supabase publishable key may be exposed to the browser. Service-role
keys and direct database credentials must never be added to the admin web
application.

Supabase Auth URL Configuration must allow these exact redirects:

```text
http://localhost:5173
https://admin.moodie.am
moodie-app://auth/callback
```

The static host serves the sign-in shell publicly. This does not grant access
to admin data: every privileged database read and write must still derive the
current Supabase user and enforce admin membership through RLS or a trusted
function.

## Assign an administrator

Run this in the Supabase SQL Editor or through an authorized direct database
connection. Use the immutable Auth user UUID shown in Authentication > Users:

```sql
insert into private.admin_users (user_id, granted_by)
values ('00000000-0000-0000-0000-000000000000', 'operator@example.com')
on conflict (user_id) do nothing;
```

The `granted_by` value should identify the operator or change ticket. It is
stored for auditing and is never supplied by the app.

## Revoke an administrator

```sql
delete from private.admin_users
where user_id = '00000000-0000-0000-0000-000000000000';
```

The affected user loses admin access on the next check. Sign the user out when
immediate UI refresh is required.

## Verification

As a signed-in client, call the no-argument RPC:

```sql
select public.is_admin();
```

Direct SQL sessions do not carry a Supabase Auth JWT, so the function normally
returns `false` in the SQL Editor even when the target membership exists.
