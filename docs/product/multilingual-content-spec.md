# Multilingual App and Content Spec

## Purpose

Moodie supports a user-selected language for application UI and remotely
managed editorial content. Language support must scale without requiring a
native release for every new language or content translation.

## Language lifecycle

- Administrators create and manage supported languages in the admin workspace.
- A language has a normalized BCP-47-style code, English name, native name,
  sort order, enabled state, and optional right-to-left direction.
- Only enabled languages are offered to supporter-app users.
- English (`en`) is the initial and default language.
- The user's selection is stored on the device and, when authenticated, in
  `public.user_settings`.
- If a previously selected language is disabled, the app returns to the
  configured default language.

## Application UI text

Application UI strings use stable keys.

- Bundled locale JSON files under `src/locales/` are the local source used by
  developers and local AI translation workflows.
- Administrators can provide or override UI strings per enabled language in
  the admin workspace.
- Remote UI strings take priority over bundled strings.
- A missing remote string can use the same-language bundled value and then the
  bundled English value. This fallback exists only to keep application
  controls usable.
- String interpolation uses named placeholders such as `{{time}}`.

Adding a language in admin can therefore make it immediately selectable.
Before enabling it, administrators should populate its app-text translations
or developers should add the matching bundled locale.

## Editorial content

Topics, affirmations, and background tags are translated independently from
their language-neutral records:

- topic translation: localized topic name;
- affirmation translation: localized motivation/affirmation text;
- background translation: localized tags used for browsing, labels, search,
  and accessibility.

Editorial content never falls back to another language. For the selected
language:

- a topic without a nonblank translation is absent;
- an affirmation without a nonblank translation is absent;
- a topic with no visible translated affirmations is absent;
- a background without translated tags is absent.

Publication and translation completeness are separate. An administrator may
publish the language-neutral record while translations are incomplete; the
supporter app exposes it only in languages where all text required for that
record exists.

## Admin behavior

The admin Content area provides:

- language creation and enable/disable controls;
- translation fields for every supported language when editing topics,
  affirmations, and backgrounds;
- an app-text editor organized by stable text key and language;
- clear completeness counts so missing translations are visible before
  publication.

All mutations are protected by `public.is_admin()` RLS checks. The admin
browser uses only the Supabase publishable key.

## Offline behavior

- The enabled-language catalog and UI messages use a last-known-good
  device cache.
- Editorial content is cached separately per language.
- A cached payload for one language must never be shown for another.
- If no valid selected-language content exists remotely or in that
  language's cache, the existing retryable unavailable state is shown.

## Acceptance criteria

- A user can choose any enabled language from Settings and the selection
  survives restart and authenticated-device synchronization.
- Admin can add a language without a schema or app release.
- Admin can enter topic, affirmation, background-tag, and app UI translations
  per supported language.
- Selecting a language reloads editorial content in that language.
- No editorial item is visible when its required selected-language
  translation is missing or blank.
- Disabling a language removes it from selection and causes affected users to
  return to the default language.
- Remote UI text overrides bundled UI text without an app release.
