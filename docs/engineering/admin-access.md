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

The dashboard currently exposes no privileged mutations. Each future catalog,
content, commerce, analytics, or release operation must have a documented
contract and a database RLS policy or trusted server boundary before its UI is
enabled.

Required admin web environment values:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Only the Supabase publishable key may be exposed to the browser. Service-role
keys and direct database credentials must never be added to the admin web
application.

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
