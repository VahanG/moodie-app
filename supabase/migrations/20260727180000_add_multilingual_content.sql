create table public.supported_languages (
  code text primary key,
  english_name text not null,
  native_name text not null,
  text_direction text not null default 'ltr',
  sort_order integer not null default 0,
  is_enabled boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supported_languages_code_format
    check (code ~ '^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$'),
  constraint supported_languages_english_name_not_blank
    check (btrim(english_name) <> ''),
  constraint supported_languages_native_name_not_blank
    check (btrim(native_name) <> ''),
  constraint supported_languages_text_direction_valid
    check (text_direction in ('ltr', 'rtl')),
  constraint supported_languages_sort_order_nonnegative
    check (sort_order >= 0),
  constraint supported_languages_default_enabled
    check (not is_default or is_enabled)
);

create unique index supported_languages_one_default_idx
  on public.supported_languages (is_default)
  where is_default;

create index supported_languages_enabled_order_idx
  on public.supported_languages (sort_order, code)
  where is_enabled;

insert into public.supported_languages
  (code, english_name, native_name, sort_order, is_enabled, is_default)
values
  ('en', 'English', 'English', 10, true, true);

create table public.affirmation_topic_translations (
  topic_id text not null
    references public.affirmation_topics (id) on delete cascade,
  language_code text not null
    references public.supported_languages (code) on update cascade on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (topic_id, language_code),
  constraint affirmation_topic_translations_name_not_blank
    check (btrim(name) <> '')
);

create index affirmation_topic_translations_language_idx
  on public.affirmation_topic_translations (language_code, topic_id);

create table public.affirmation_translations (
  affirmation_id uuid not null
    references public.affirmations (id) on delete cascade,
  language_code text not null
    references public.supported_languages (code) on update cascade on delete restrict,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (affirmation_id, language_code),
  constraint affirmation_translations_text_not_blank
    check (btrim(text) <> '')
);

create index affirmation_translations_language_idx
  on public.affirmation_translations (language_code, affirmation_id);

create table public.affirmation_background_translations (
  background_id text not null
    references public.affirmation_backgrounds (id) on delete cascade,
  language_code text not null
    references public.supported_languages (code) on update cascade on delete restrict,
  tags text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (background_id, language_code),
  constraint affirmation_background_translations_tags_not_empty
    check (cardinality(tags) > 0),
  constraint affirmation_background_translations_tags_not_blank
    check (array_position(tags, '') is null)
);

create index affirmation_background_translations_language_idx
  on public.affirmation_background_translations (language_code, background_id);

create table public.app_text_translations (
  language_code text not null
    references public.supported_languages (code) on update cascade on delete restrict,
  text_key text not null,
  text_value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (language_code, text_key),
  constraint app_text_translations_key_format
    check (text_key ~ '^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+$'),
  constraint app_text_translations_value_not_blank
    check (btrim(text_value) <> '')
);

insert into public.app_text_translations
  (language_code, text_key, text_value)
values
  ('en', 'common.done', 'Done'),
  ('en', 'common.closeNamed', 'Close {{title}}'),
  ('en', 'common.selected', 'Selected'),
  ('en', 'common.tryAgain', 'Try again'),
  ('en', 'navigation.primary', 'Primary navigation'),
  ('en', 'navigation.today', 'Today'),
  ('en', 'navigation.calendar', 'Calendar'),
  ('en', 'navigation.settings', 'Settings'),
  ('en', 'affirmations.loadingTitle', 'Loading your affirmations…'),
  ('en', 'affirmations.loadingDescription', 'Fetching the latest published content.'),
  ('en', 'affirmations.unavailableTitle', 'Affirmations are unavailable'),
  ('en', 'affirmations.unavailableDescription', 'Check your connection and try again.'),
  ('en', 'affirmations.today', 'Today'),
  ('en', 'affirmations.chooseBackground', 'Choose affirmation background'),
  ('en', 'affirmations.chooseTopic', 'Choose affirmation topic. Current topic {{topic}}'),
  ('en', 'affirmations.like', 'Like affirmation'),
  ('en', 'affirmations.unlike', 'Unlike affirmation'),
  ('en', 'affirmations.share', 'Share affirmation'),
  ('en', 'affirmations.swipe', 'Swipe for another'),
  ('en', 'topics.title', 'Select topics'),
  ('en', 'backgrounds.title', 'Backgrounds'),
  ('en', 'backgrounds.mode', 'Background mode'),
  ('en', 'backgrounds.free', 'Free'),
  ('en', 'backgrounds.fixed', 'Fixed'),
  ('en', 'backgrounds.searchLabel', 'Search backgrounds'),
  ('en', 'backgrounds.searchPlaceholder', 'Try calm, ocean, or focus'),
  ('en', 'backgrounds.backToTags', 'Back to tags'),
  ('en', 'backgrounds.use', 'Use {{tags}} background'),
  ('en', 'backgrounds.empty', 'No backgrounds found for this tag search.'),
  ('en', 'calendar.title', 'Calendar'),
  ('en', 'calendar.subtitle', 'A gentle view of the day in front of you.'),
  ('en', 'calendar.today', 'Today'),
  ('en', 'calendar.reflection', 'Daily reflection'),
  ('en', 'calendar.message', 'Your day is unfolding perfectly.'),
  ('en', 'settings.title', 'Settings'),
  ('en', 'settings.subtitle', 'Personalize your experience and account.'),
  ('en', 'appearance.title', 'Appearance'),
  ('en', 'appearance.description', 'Choose how Moodie looks on this device.'),
  ('en', 'appearance.system', 'System'),
  ('en', 'appearance.light', 'Light'),
  ('en', 'appearance.dark', 'Dark'),
  ('en', 'appearance.accessibility', 'Application appearance'),
  ('en', 'appearance.saveError', 'Could not save your appearance preference.'),
  ('en', 'language.title', 'Language'),
  ('en', 'language.description', 'Choose the language used by Moodie and its content.'),
  ('en', 'language.change', 'Change'),
  ('en', 'language.modalTitle', 'Choose language'),
  ('en', 'language.saveError', 'Could not save your language preference.'),
  ('en', 'notifications.title', 'Notifications'),
  ('en', 'notifications.description', 'Choose when Moodie gently checks in.'),
  ('en', 'notifications.loading', 'Loading reminder settings...'),
  ('en', 'notifications.daily', 'Daily reminders'),
  ('en', 'notifications.currentTime', 'Current time: {{time}} (local time)'),
  ('en', 'notifications.enableAccessibility', 'Enable daily reminders'),
  ('en', 'notifications.hour', 'Hour'),
  ('en', 'notifications.hourHelp', '0–23'),
  ('en', 'notifications.minute', 'Minute'),
  ('en', 'notifications.minuteHelp', '0–59'),
  ('en', 'notifications.saving', 'Saving...'),
  ('en', 'notifications.saveTime', 'Save reminder time'),
  ('en', 'notifications.channelName', 'Daily reminders'),
  ('en', 'notifications.reminderTitle', 'Moodie daily reminder'),
  ('en', 'notifications.reminderMessage', 'Come back and check Moodie today.'),
  ('en', 'account.title', 'Account'),
  ('en', 'account.description', 'Sign in and manage your Moodie identity.'),
  ('en', 'account.unconfigured', 'Sign-in is unavailable until Supabase is configured.'),
  ('en', 'account.loading', 'Loading account...'),
  ('en', 'account.signedIn', 'Signed in as {{email}}'),
  ('en', 'account.defaultUser', 'Moodie user'),
  ('en', 'account.checkingAdmin', 'Checking admin access...'),
  ('en', 'account.administrator', 'Administrator'),
  ('en', 'account.signingOut', 'Signing out...'),
  ('en', 'account.signOut', 'Sign out'),
  ('en', 'account.email', 'Email'),
  ('en', 'account.emailPlaceholder', 'you@example.com'),
  ('en', 'account.password', 'Password'),
  ('en', 'account.signingIn', 'Signing in...'),
  ('en', 'account.signInPassword', 'Sign in with password'),
  ('en', 'account.useCode', 'Use a one-time code'),
  ('en', 'account.verificationCode', 'Verification code'),
  ('en', 'account.sixDigitCode', 'Six-digit code'),
  ('en', 'account.verifying', 'Verifying...'),
  ('en', 'account.verifyCode', 'Verify code'),
  ('en', 'account.sendNewCode', 'Send a new code'),
  ('en', 'account.sending', 'Sending...'),
  ('en', 'account.sendCode', 'Send one-time code'),
  ('en', 'account.usePassword', 'Use password instead'),
  ('en', 'account.or', 'or'),
  ('en', 'account.openingGoogle', 'Opening Google...'),
  ('en', 'account.google', 'Continue with Google'),
  ('en', 'status.settingsLoadError', 'Could not load app settings.'),
  ('en', 'status.reminderSaveError', 'Failed to save reminder settings.'),
  ('en', 'status.remindersOff', 'Daily reminders are off.'),
  ('en', 'status.permissionRequired', 'Notification permission is required to enable daily reminders.'),
  ('en', 'status.reminderEnabled', 'Daily reminder enabled for {{time}}.'),
  ('en', 'status.reminderUpdateError', 'Failed to update daily reminder status.'),
  ('en', 'status.invalidTime', 'Use a valid 24-hour time (HH:MM).'),
  ('en', 'status.reminderTimeUpdated', 'Reminder time updated to {{time}}.'),
  ('en', 'status.reminderTimeSaved', 'Saved reminder time {{time}}. Turn reminders on to start notifications.'),
  ('en', 'status.reminderTimeError', 'Failed to update reminder time.'),
  ('en', 'status.topicSaveError', 'Failed to save selected topic.'),
  ('en', 'status.backgroundSaveError', 'Failed to save background preference.'),
  ('en', 'status.likeSaveError', 'Failed to save liked affirmation.'),
  ('en', 'auth.enterCredentials', 'Enter both your email and password.'),
  ('en', 'auth.signInError', 'Could not sign in.'),
  ('en', 'auth.enterEmail', 'Enter your email to receive a sign-in code.'),
  ('en', 'auth.codeSent', 'Check your email for the six-digit sign-in code.'),
  ('en', 'auth.sendCodeError', 'Could not send a sign-in code.'),
  ('en', 'auth.enterCode', 'Enter the six-digit code from your email.'),
  ('en', 'auth.verifyError', 'Could not verify the code.'),
  ('en', 'auth.googleCanceled', 'Google sign-in was canceled.'),
  ('en', 'auth.googleError', 'Could not sign in with Google.'),
  ('en', 'auth.signOutError', 'Could not sign out.'),
  ('en', 'auth.sessionLoadError', 'Could not load your account session.'),
  ('en', 'auth.adminCheckError', 'Could not verify admin access.');

insert into public.affirmation_topic_translations
  (topic_id, language_code, name)
select id, 'en', name
from public.affirmation_topics;

insert into public.affirmation_translations
  (affirmation_id, language_code, text)
select id, 'en', text
from public.affirmations;

insert into public.affirmation_background_translations
  (background_id, language_code, tags)
select id, 'en', tags
from public.affirmation_backgrounds;

alter table public.affirmation_topics
  drop constraint affirmation_topics_name_not_blank,
  drop column name;

alter table public.affirmations
  drop constraint affirmations_text_not_blank,
  drop column text;

alter table public.affirmation_backgrounds
  drop constraint affirmation_backgrounds_tags_not_empty,
  drop column tags;

alter table public.user_settings
  add column language_code text not null default 'en'
    references public.supported_languages (code) on update cascade on delete restrict;

create trigger supported_languages_set_updated_at
before update on public.supported_languages
for each row execute function public.set_content_updated_at();

create trigger affirmation_topic_translations_set_updated_at
before update on public.affirmation_topic_translations
for each row execute function public.set_content_updated_at();

create trigger affirmation_translations_set_updated_at
before update on public.affirmation_translations
for each row execute function public.set_content_updated_at();

create trigger affirmation_background_translations_set_updated_at
before update on public.affirmation_background_translations
for each row execute function public.set_content_updated_at();

create trigger app_text_translations_set_updated_at
before update on public.app_text_translations
for each row execute function public.set_content_updated_at();

alter table public.supported_languages enable row level security;
alter table public.affirmation_topic_translations enable row level security;
alter table public.affirmation_translations enable row level security;
alter table public.affirmation_background_translations enable row level security;
alter table public.app_text_translations enable row level security;

revoke all on table public.supported_languages from public, anon, authenticated;
revoke all on table public.affirmation_topic_translations from public, anon, authenticated;
revoke all on table public.affirmation_translations from public, anon, authenticated;
revoke all on table public.affirmation_background_translations from public, anon, authenticated;
revoke all on table public.app_text_translations from public, anon, authenticated;

grant select on table public.supported_languages to anon, authenticated;
grant select on table public.affirmation_topic_translations to anon, authenticated;
grant select on table public.affirmation_translations to anon, authenticated;
grant select on table public.affirmation_background_translations to anon, authenticated;
grant select on table public.app_text_translations to anon, authenticated;

grant insert, update on table public.supported_languages to authenticated;
grant insert, update, delete on table public.affirmation_topic_translations to authenticated;
grant insert, update, delete on table public.affirmation_translations to authenticated;
grant insert, update, delete on table public.affirmation_background_translations to authenticated;
grant insert, update, delete on table public.app_text_translations to authenticated;

create policy "enabled languages are readable"
on public.supported_languages
for select
to anon, authenticated
using (is_enabled);

create policy "admins manage languages"
on public.supported_languages
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "published topic translations are readable"
on public.affirmation_topic_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.affirmation_topics
    where affirmation_topics.id = topic_id
      and affirmation_topics.is_published
  )
  and exists (
    select 1
    from public.supported_languages
    where supported_languages.code = language_code
      and supported_languages.is_enabled
  )
);

create policy "admins manage topic translations"
on public.affirmation_topic_translations
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "published affirmation translations are readable"
on public.affirmation_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.affirmations
    where affirmations.id = affirmation_id
      and affirmations.is_published
  )
  and exists (
    select 1
    from public.supported_languages
    where supported_languages.code = language_code
      and supported_languages.is_enabled
  )
);

create policy "admins manage affirmation translations"
on public.affirmation_translations
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "published background translations are readable"
on public.affirmation_background_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.affirmation_backgrounds
    where affirmation_backgrounds.id = background_id
      and affirmation_backgrounds.is_published
  )
  and exists (
    select 1
    from public.supported_languages
    where supported_languages.code = language_code
      and supported_languages.is_enabled
  )
);

create policy "admins manage background translations"
on public.affirmation_background_translations
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "enabled app text translations are readable"
on public.app_text_translations
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.supported_languages
    where supported_languages.code = language_code
      and supported_languages.is_enabled
  )
);

create policy "admins manage app text translations"
on public.app_text_translations
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
