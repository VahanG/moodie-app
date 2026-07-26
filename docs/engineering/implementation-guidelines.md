# Implementation Guidelines

- Docs update comes first, then implementation.
- Reference source docs in PR descriptions.
- Prefer incremental changes and explicit acceptance criteria.
- Add focused unit tests for validation and critical business flows.
- Run `npm test` while developing and `npm run test:coverage` before opening a PR.
- Treat coverage thresholds as a regression floor; prioritize boundary cases and failure behavior over increasing the percentage alone.
