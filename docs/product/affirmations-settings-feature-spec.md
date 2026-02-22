# Affirmations + Calendar + Settings Feature Spec

## Summary
Keep the three-page swipe experience (Affirmations, Calendar, Settings), and upgrade Affirmations with configurable topics and background behavior.

## Problem
Users currently see a single generic affirmation stream. The product now needs a lightweight way to personalize affirmations by topic while keeping the immersive visual style.

## Screen-level specs
- Affirmations screen: `docs/product/affirmations-screen-spec.md`
- Topic selection screen: `docs/product/topic-selection-screen-spec.md`
- Background selection screen: `docs/product/background-selection-screen-spec.md`

## Scope
- In
  - Existing swipe navigation between Affirmations, Calendar, and Settings.
  - Topic-aware affirmations on the Affirmations screen.
  - Dedicated topic selection and background selection experiences.
  - Persistent user selections across app sessions.
- Out
  - Advanced personalization beyond topic and background mode.
  - Topic recommendation engine.
  - Gallery-image and affirmation-text strict one-to-one matching.

## Product requirements (high level)
1. The default landing page remains Affirmations.
2. Users can open topic selection quickly from Affirmations.
3. Selected topic persists across sessions until the user changes it.
4. Affirmations page displays only texts from the selected topic.
5. Users can choose between fixed background mode and Free mode.
6. Fixed background mode overrides topic/text background suggestions.
7. Free mode uses affirmation-text-connected backgrounds.
8. Calendar and Settings behavior from v1 remains unchanged by this update.

## Acceptance criteria
- Requirement statement: Topic switching is discoverable and fast.
  - User impact: Personalization feels accessible during normal use.
  - Measurable success condition: QA can reach topic selection from Affirmations in one tap and return with updated content.
- Requirement statement: Topic choice is sticky across restarts.
  - User impact: Users do not need to reconfigure every session.
  - Measurable success condition: Relaunching the app preserves the last selected topic.
- Requirement statement: Background mode behavior is deterministic.
  - User impact: Users understand when custom vs adaptive visuals are used.
  - Measurable success condition: Fixed mode always shows chosen background; Free mode shows text-connected background.
