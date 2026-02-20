# Contributing — Developer guidelines

This repository follows a few simple principles to keep the codebase readable, maintainable and easy to scale.

Principles
- Keep files short and focused (prefer components < ~300 LOC when feasible).
- One component per file for non-trivial components.
- Separate concerns: UI in components/screens, styles in sibling *.styles.ts files, and side-effects/business logic in `src/features/*` services.
- Export shared types from `src/types` and prefer small, composable functions.
- Write small, incremental PRs; run type checks and basic smoke tests before opening a PR.
- Add unit tests for validation logic and critical flows (e.g., time validation, scheduling).

Developer workflow
- When refactoring, move behavior into services and keep screens/components as thin as possible.
- Update `AGENTS.MD` when agent responsibilities or workflows change.
- Follow docs-first delivery: update or add `docs/` artifacts before implementing behavior changes.
- In implementation PRs, link the relevant `docs/*.md` paths or provide explicit rationale when docs are not affected (`No docs impact: ...`).
- Keep documentation and code changes in the same PR when behavior changes.

If unsure, prefer a brief RFC or small PR so the team can review the change quickly.
