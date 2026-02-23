# Affirmations Screen Spec

## Purpose
Deliver a focused affirmation experience that users can personalize by topic and background behavior.

## Core UI
- Full-screen visual background.
- Centered affirmation text for readability.
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

## Success checks
- Topic change immediately updates eligible affirmation texts.
- Swipe up/down always moves to next/previous text in the selected topic set.
- Swipe up/down shows a direction-aware transition animation before the new affirmation fully settles.
- Fixed mode always keeps the same background.
- Free mode updates background according to displayed text.
