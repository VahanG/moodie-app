# Background Selection Screen Spec

## Purpose
Allow users to control how affirmation backgrounds are chosen.

## Entry and exit
- Entry should be accessible from the Affirmations screen.
- After changing background mode, user returns to Affirmations and sees the new behavior immediately.

## Modes
1. Fixed background mode
   - User selects one background image.
   - The selected image is always shown on the Affirmations screen.
   - This behavior ignores topic/text background suggestions.
2. Free mode
   - User selects "Free" instead of a fixed image.
   - The app shows an affirmation-text-connected background for the current text.

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
