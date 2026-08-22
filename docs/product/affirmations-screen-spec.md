# Affirmations Screen Spec

## Purpose

Deliver a focused affirmation experience that users can personalize by topic and background behavior.

## Core UI

- Full-screen visual background.
- On mobile, the visual extends edge to edge across the app canvas and beneath the system bars without a card border, radius, or surrounding page background; controls remain safely inset.
- Mobile controls and bottom navigation use surface-free icon targets over the image; tablet and web layouts may retain labeled surfaces.
- Centered affirmation text for readability.
- Two action icons directly below the affirmation text:
  - Heart-shaped Like icon.
  - Share icon.
- Vertical swipe gestures on the Affirmations page for text navigation.
- Quick entry points to:
  - Topic selection screen.
  - Background selection screen.

## Content behavior

1. The screen reads the active topic set selected by the user.
2. Only affirmations belonging to selected topics are eligible for display.
3. If no topics are selected, affirmations from all topics are eligible for display.
4. Affirmation text is not strictly bound to gallery images.
5. Each affirmation text should have one or more weakly connected background images for adaptive visuals.
6. Topic button label shows the topic of the currently displayed affirmation text.

## Affirmation navigation behavior

1. Swiping up shows the next affirmation text from selected topics (or all topics when none are selected).
2. Swiping down shows the previous affirmation text from selected topics (or all topics when none are selected).
3. When multiple topics are selected, adjacent affirmations should come from different topics whenever possible.
4. Navigation wraps around at boundaries (last -> first, first -> last).

## Swipe transition animation

1. Swipe navigation should animate the affirmation page content to match gesture direction.
2. Swiping up should transition the next affirmation by sliding content upward and fading in.
3. Swiping down should transition the previous affirmation by sliding content downward and fading in.
4. Animation should complete quickly to keep the flow responsive.
5. The current background should remain visible while the next background loads, preventing an empty or neutral-colored frame between images.
6. Once ready, the next background should crossfade over the current background in approximately 220 milliseconds.
7. A successfully prefetched background should begin its crossfade immediately.
8. The app should prefetch at most the immediate previous and next resolved affirmation backgrounds, including catalog fallbacks, so adjacent swipes feel responsive without maintaining a large in-memory image window.

## Background behavior

- Fixed mode
  - If the user selected a specific background, always render that background.
  - This override applies regardless of selected topic or current affirmation text.
- Free mode
  - If the user selected "Free", render an affirmation-text-connected background.
  - Topic still controls text selection; Free mode controls background choice.

## Persistence

- The screen uses saved user preferences for:
  - Active topic set.
  - Background mode and selected fixed background (if applicable).
- The screen stores liked affirmations so the liked state remains consistent across app restarts.
- Liked affirmations are persisted now and will be surfaced in a dedicated "My Favorites" view in a later update.

## Affirmation actions behavior

1. Tapping the heart icon toggles like/unlike for the currently displayed affirmation.
2. The heart icon reflects state:
   - Unfilled when the current affirmation is not liked.
   - Filled when the current affirmation is liked.
3. Tapping the share icon opens the native share sheet with the currently displayed affirmation text.

## Success checks

- Topic change immediately updates eligible affirmation texts.
- Swipe up/down always moves to next/previous text in the selected topic set.
- Swipe up/down shows a direction-aware transition animation before the new affirmation fully settles.
- The current background remains visible until the incoming background is ready, with no neutral frame between them.
- The incoming background crossfades smoothly over the current image and prefetched backgrounds begin immediately.
- Only the two adjacent resolved background URLs are considered for prefetch at any position.
- Fixed mode always keeps the same background.
- Free mode updates background according to displayed text.
- Heart and share icons are visible below the affirmation text.
- Like toggle updates icon state immediately and persists between sessions.
- Share action opens the native share UI with the current affirmation text.
- Mobile renders the affirmation image edge to edge and keeps overlaid controls free of card, pill, and navigation backgrounds.
