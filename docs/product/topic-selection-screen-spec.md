# Topic Selection Screen Spec

## Purpose
Let users choose which affirmation topic powers the Affirmations screen.

## Entry and exit
- Entry should be easy and quick from the Affirmations screen.
- After selection, user can return to Affirmations and immediately see topic-filtered texts.

## UI requirements
1. Display multiple topics in a scannable list or grid.
2. Each topic tile/card must include:
   - Topic name.
   - Topic-related background image.
3. The currently selected topic must be visually highlighted.

## Selection behavior
1. Tapping a topic marks it as selected and unselects the previous one.
2. Selected topic becomes the active source for affirmation texts.
3. Active topic is saved and reused in future app sessions until changed again.

## Success checks
- Users can recognize the selected topic at a glance.
- Reopening the app retains the same selected topic.
- Affirmations screen shows only texts from the selected topic.
