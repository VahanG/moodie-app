# Affirmations Screen Spec

## Purpose
Deliver a focused affirmation experience that users can personalize by topic and background behavior.

## Core UI
- Full-screen visual background.
- Centered affirmation text for readability.
- Quick entry points to:
  - Topic selection screen.
  - Background selection screen.

## Content behavior
1. The screen reads the active topic selected by the user.
2. Only affirmations belonging to that topic are eligible for display.
3. Affirmation text is not strictly bound to gallery images.
4. Each affirmation text should have one or more weakly connected background images for adaptive visuals.

## Background behavior
- Fixed mode
  - If the user selected a specific background, always render that background.
  - This override applies regardless of selected topic or current affirmation text.
- Free mode
  - If the user selected "Free", render an affirmation-text-connected background.
  - Topic still controls text selection; Free mode controls background choice.

## Persistence
- The screen uses saved user preferences for:
  - Active topic.
  - Background mode and selected fixed background (if applicable).

## Success checks
- Topic change immediately updates eligible affirmation texts.
- Fixed mode always keeps the same background.
- Free mode updates background according to displayed text.
