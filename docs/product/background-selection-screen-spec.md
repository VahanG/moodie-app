# Background Selection Screen Spec

## Purpose
Allow users to control how affirmation backgrounds are chosen and quickly find a preferred background in a large gallery.

## Entry and exit
- Entry should be accessible from the Affirmations screen.
- After changing background mode, user returns to Affirmations and sees the new behavior immediately.

## Gallery content model
- Background data is managed in the Moodie admin workspace and retrieved from Supabase.
- Each background image has:
  - Stable id.
  - Image asset reference.
  - One or more tags.
- Only published backgrounds are visible in the supporter app.

## Modes
1. Fixed background mode
    - User selects one background image.
    - The selected image is always shown on the Affirmations screen.
    - This behavior ignores topic/text background suggestions.
2. Free mode
    - User selects "Free" instead of a fixed image.
    - The app shows an affirmation-text-connected background for the current text.
3. Mode switching UX
    - The screen includes a clear switch/toggle control for fast switching between Free mode and Fixed background mode.
    - Switching mode applies immediately and should not require re-selecting previously chosen fixed background.

## Gallery browsing and discovery
1. The background gallery supports large catalogs.
2. Backgrounds are grouped by tags to make browsing easier.
3. Users can search backgrounds by tag.
4. Search results are based on tag matches only.
5. A background can appear in multiple tag groups if it has multiple tags.
6. Selecting a background from any group or search result sets Fixed background mode automatically.

## Persistence
- Chosen mode and fixed background choice (if any) are saved across sessions.
- Preference remains active until the user changes it.

## Interaction with topics
- Topic selection defines which texts can appear.
- Background mode defines which image appears.
- In Free mode, background follows text; in Fixed mode, background is constant.

## Success checks
- Fixed mode remains constant when topic or text changes.
- Free mode varies based on the displayed affirmation text.
- Users can toggle between Free and Fixed modes in one obvious action.
- Users can locate backgrounds through tag groups and tag-based search.
- Selecting a background from the gallery immediately updates Affirmations to use that background for all texts.
