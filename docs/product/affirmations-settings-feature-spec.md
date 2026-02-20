# Affirmations + Settings Feature Spec

## Summary
Deliver a two-page swipe experience with an immersive Affirmations page and a lightweight Settings page focused on notification setup.

## Problem
Moodie needs a simple, high-clarity first experience that delivers affirmation content while still giving users quick access to essential app controls.

## Scope
- In
  - Affirmations page with full-screen background image.
  - Centered affirmation text (horizontally and vertically).
  - Settings page with notification setup controls (v1 only).
  - Swipe navigation between Affirmations and Settings pages.
  - Persistent, minimal footer page indicator with icons (including gear for Settings).
- Out
  - Advanced settings categories beyond notifications.
  - Multi-page affirmation feed or history browsing.
  - Remote personalization logic for affirmation layout.

## Requirements
1. The default landing page is Affirmations.
2. The Affirmations page renders a full-screen image without visible layout gaps.
3. Affirmation copy is centered both horizontally and vertically on top of the image.
4. Users can navigate between Affirmations and Settings by swiping.
5. The Settings page includes notification setup entry points (permission/status/toggle behavior defined by implementation detail doc).
6. A compact footer remains visible as a UI hint that multiple pages exist.
7. Footer includes page icons, with a gear icon representing Settings.
8. Footer height and spacing should be minimized while preserving tap/accessibility viability.

## Acceptance criteria
- Requirement statement: Users understand there are two pages and can move between them by swipe.
  - User impact: Navigation is discoverable without onboarding friction.
  - Measurable success condition: In QA, first-time users can reach Settings from Affirmations in one swipe without prompts.
- Requirement statement: Affirmation content remains legible and centered on all supported phone sizes.
  - User impact: Core affirmation moment feels intentional and premium.
  - Measurable success condition: Visual QA confirms centered alignment and no clipping on supported breakpoints.
- Requirement statement: Notification setup is reachable from Settings in one interaction.
  - User impact: Users can enable reminder behavior quickly.
  - Measurable success condition: QA can access notification controls from Settings with no dead-end states.
- Requirement statement: Footer indicator is present but visually unobtrusive.
  - User impact: Users get navigation cues without sacrificing immersion.
  - Measurable success condition: Footer is always visible and occupies minimal vertical space per design token threshold.

## Dependencies
- Experience & Navigation agent: pager/swipe implementation and footer interaction design.
- Commerce/Infra not required for v1 of this feature.
- Data & Insights agent: optional event tracking for swipe-to-settings conversion.

## Rollout and fallback
- Rollout as a default two-page home experience behind a feature flag if needed.
- Fallback: if swipe container fails on specific devices, retain tab/icon tap navigation between the same two pages.
