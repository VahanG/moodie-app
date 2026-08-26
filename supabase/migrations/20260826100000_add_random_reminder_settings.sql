alter table public.user_settings
  add column random_reminder_enabled boolean not null default false,
  add column random_reminder_start_hour smallint not null default 9,
  add column random_reminder_start_minute smallint not null default 0,
  add column random_reminder_end_hour smallint not null default 17,
  add column random_reminder_end_minute smallint not null default 0,
  add constraint user_settings_reminder_mode_valid
    check (not (reminder_enabled and random_reminder_enabled)),
  add constraint user_settings_random_reminder_start_hour_valid
    check (random_reminder_start_hour between 0 and 23),
  add constraint user_settings_random_reminder_start_minute_valid
    check (random_reminder_start_minute between 0 and 59),
  add constraint user_settings_random_reminder_end_hour_valid
    check (random_reminder_end_hour between 0 and 23),
  add constraint user_settings_random_reminder_end_minute_valid
    check (random_reminder_end_minute between 0 and 59),
  add constraint user_settings_random_reminder_range_valid
    check (
      random_reminder_end_hour * 60 + random_reminder_end_minute
        > random_reminder_start_hour * 60 + random_reminder_start_minute
    );

comment on column public.user_settings.random_reminder_enabled is
  'Enables randomized local reminders instead of the fixed daily reminder.';

create table public.notification_delivery_settings (
  id text primary key default 'global',
  random_reminders_per_day smallint not null default 3,
  updated_at timestamptz not null default now(),
  constraint notification_delivery_settings_singleton
    check (id = 'global'),
  constraint notification_delivery_settings_random_count_valid
    check (random_reminders_per_day between 1 and 8)
);

comment on table public.notification_delivery_settings is
  'Public delivery limits configured by Moodie administrators.';

insert into public.notification_delivery_settings
  (id, random_reminders_per_day)
values
  ('global', 3);

create trigger notification_delivery_settings_set_updated_at
before update on public.notification_delivery_settings
for each row execute function public.set_content_updated_at();

alter table public.notification_delivery_settings enable row level security;

revoke all on table public.notification_delivery_settings
from public, anon, authenticated;
grant select on table public.notification_delivery_settings
to anon, authenticated;
grant update (random_reminders_per_day)
on table public.notification_delivery_settings
to authenticated;

create policy "notification delivery settings are readable"
on public.notification_delivery_settings
for select
to anon, authenticated
using (true);

create policy "admins update notification delivery settings"
on public.notification_delivery_settings
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.app_text_translations
  (language_code, text_key, text_value)
values
  ('en', 'notifications.random', 'Random reminders'),
  ('en', 'notifications.randomRange', '{{count}} per day between {{start}} and {{end}} (local time)'),
  ('en', 'notifications.randomDescription', 'Moodie varies the times each day and keeps reminders at least one hour apart.'),
  ('en', 'notifications.enableRandomAccessibility', 'Enable random reminders'),
  ('en', 'notifications.startHour', 'Start hour'),
  ('en', 'notifications.startMinute', 'Start minute'),
  ('en', 'notifications.endHour', 'End hour'),
  ('en', 'notifications.endMinute', 'End minute'),
  ('en', 'notifications.saveRange', 'Save time range'),
  ('en', 'notifications.randomReminderTitle', 'A moment from Moodie'),
  ('en', 'status.randomRemindersOff', 'Random reminders are off.'),
  ('en', 'status.randomPermissionRequired', 'Notification permission is required to enable random reminders.'),
  ('en', 'status.randomReminderEnabled', 'Random reminders enabled: {{count}} per day between {{start}} and {{end}}.'),
  ('en', 'status.randomReminderUpdateError', 'Failed to update random reminder status.'),
  ('en', 'status.invalidRandomRange', 'Choose a valid same-day range wide enough for {{count}} reminders at least one hour apart.'),
  ('en', 'status.randomRangeUpdated', 'Random reminder range updated to {{start}}–{{end}}.'),
  ('en', 'status.randomRangeSaved', 'Saved {{start}}–{{end}}. Turn random reminders on to start notifications.'),
  ('en', 'status.randomRangeError', 'Failed to update the random reminder range.');
