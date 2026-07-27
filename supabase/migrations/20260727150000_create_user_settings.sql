create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme_preference text not null default 'system',
  reminder_enabled boolean not null default false,
  reminder_hour smallint not null default 9,
  reminder_minute smallint not null default 0,
  selected_topic_ids text[] not null default '{}',
  background_mode text not null default 'free',
  background_id text,
  liked_affirmation_keys text[] not null default '{}',
  updated_at timestamptz not null default now(),
  constraint user_settings_theme_preference_valid
    check (theme_preference in ('system', 'light', 'dark')),
  constraint user_settings_reminder_hour_valid
    check (reminder_hour between 0 and 23),
  constraint user_settings_reminder_minute_valid
    check (reminder_minute between 0 and 59),
  constraint user_settings_selected_topics_limit
    check (cardinality(selected_topic_ids) <= 100),
  constraint user_settings_background_mode_valid
    check (background_mode in ('free', 'fixed')),
  constraint user_settings_fixed_background_present
    check (background_mode = 'free' or background_id is not null),
  constraint user_settings_liked_affirmations_limit
    check (cardinality(liked_affirmation_keys) <= 10000)
);

comment on table public.user_settings is
  'Current-user settings synchronized across authenticated Moodie clients.';
comment on column public.user_settings.liked_affirmation_keys is
  'Stable affirmation UUID strings; legacy local topic/text keys are accepted during client migration.';

create or replace function public.set_user_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function public.set_user_settings_updated_at() from public;
revoke all on function public.set_user_settings_updated_at() from anon;
revoke all on function public.set_user_settings_updated_at() from authenticated;

create trigger user_settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_user_settings_updated_at();

alter table public.user_settings enable row level security;

revoke all on table public.user_settings from public, anon, authenticated;
grant select, insert, update on table public.user_settings to authenticated;

create policy "users read own settings"
on public.user_settings
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users create own settings"
on public.user_settings
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "users update own settings"
on public.user_settings
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
