create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table private.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by text not null default current_user
);

comment on table private.admin_users is
  'Admin memberships managed only through authorized direct database access.';
comment on column private.admin_users.granted_by is
  'Operator identity or change reference supplied during a direct database grant.';

alter table private.admin_users enable row level security;

revoke all on table private.admin_users from public;
revoke all on table private.admin_users from anon;
revoke all on table private.admin_users from authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from private.admin_users
      where user_id = (select auth.uid())
    );
$function$;

comment on function public.is_admin() is
  'Returns whether the current authenticated user has a database-managed admin membership.';

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
