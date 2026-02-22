# Affirmations + Calendar + Settings Feature Spec

## Summary
Deliver a three-page swipe experience with immersive Affirmations and Calendar pages plus a lightweight Settings page focused on notification setup.

## Problem
Moodie needs a simple, high-clarity first experience that delivers affirmation content while still giving users quick access to essential app controls.

## Scope
- In
  - Affirmations page with full-screen background image.
  - Centered affirmation text (horizontally and vertically).
  - Calendar page with full-screen background image.
  - Centered calendar text (horizontally and vertically) matching Affirmations layout treatment.
  - Bottom date row on Calendar in `25 Feb [small logo] Monday` style.
  - Settings page with notification setup controls (v1 only).
  - Swipe navigation between Affirmations, Calendar, and Settings pages.
  - Persistent, minimal footer page indicator with icons (including gear for Settings).
- Out
  - Advanced settings categories beyond notifications.
  - Multi-page affirmation feed or history browsing.
  - Remote personalization logic for affirmation layout.

## Requirements
1. The default landing page is Affirmations.
2. The Affirmations page renders a full-screen image without visible layout gaps.
3. Affirmation copy is centered both horizontally and vertically on top of the image.
4. The Calendar page renders a full-screen image without visible layout gaps.
5. Calendar copy is centered both horizontally and vertically on top of the image.
6. Calendar includes a bottom-aligned date row in `25 Feb [small logo] Monday` style.
7. Users can navigate between Affirmations, Calendar, and Settings by swiping.
8. The Settings page includes notification setup entry points (permission/status/toggle behavior defined by implementation detail doc).
9. A compact footer remains visible as a UI hint that multiple pages exist.
10. Footer includes page icons, with a gear icon representing Settings.
11. Footer height and spacing should be minimized while preserving tap/accessibility viability.

## Acceptance criteria
- Requirement statement: Users understand there are three pages and can move between them by swipe.
  - User impact: Navigation is discoverable without onboarding friction.
  - Measurable success condition: In QA, first-time users can reach Calendar and Settings from Affirmations via swipe without prompts.
- Requirement statement: Affirmation content remains legible and centered on all supported phone sizes.
  - User impact: Core affirmation moment feels intentional and premium.
  - Measurable success condition: Visual QA confirms centered alignment and no clipping on supported breakpoints.
- Requirement statement: Calendar content remains legible and centered, and bottom date row remains visible on all supported phone sizes.
  - User impact: Daily context is clear while preserving immersive layout quality.
  - Measurable success condition: Visual QA confirms centered calendar text and visible bottom date row (`25 Feb [small logo] Monday`) on supported breakpoints.
- Requirement statement: Notification setup is reachable from Settings in one interaction.
  - User impact: Users can enable reminder behavior quickly.
  - Measurable success condition: QA can access notification controls from Settings with no dead-end states.
- Requirement statement: Footer indicator is present but visually unobtrusive.
  - User impact: Users get navigation cues without sacrificing immersion.
  - Measurable success condition: Footer is always visible and occupies minimal vertical space per design token threshold.

## Dependencies
- Experience & Navigation agent: pager/swipe implementation and footer interaction design.
- Commerce/Infra not required for v1 of this feature.
- Data & Insights agent: optional event tracking for swipe-to-calendar and swipe-to-settings conversion.

## Rollout and fallback
- Rollout as a default three-page home experience behind a feature flag if needed.
- Fallback: if swipe container fails on specific devices, retain tab/icon tap navigation between the same three pages.
