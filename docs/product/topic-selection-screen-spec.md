# Topic Selection Screen Spec

## Purpose
Let users choose zero, one, or more affirmation topics that power the Affirmations screen.

## Entry and exit
- Entry should be easy and quick from the Affirmations screen.
- Selection surface should take almost the full screen for easier browsing (target at least ~90% of screen height).
- After selection, user can return to Affirmations and immediately see texts from selected topics.

## UI requirements
1. Display multiple topics in a scannable list or grid.
2. Each topic tile/card must include:
   - Topic name.
   - Topic-related background image.
3. Selected topics must be visually highlighted.

## Selection behavior
1. Tapping a topic toggles it selected/unselected.
2. Users may leave all topics unselected; this means all topics become active for affirmations.
3. Selected topics (or all topics when none are selected) become the active source set for affirmation texts.
4. Selected topics are saved and reused in future app sessions until changed again.

## Success checks
- Users can recognize selected topics at a glance.
- Reopening the app retains the same selected topic set.
- Affirmations screen shows only texts from selected topics, or all topics when none are selected.
