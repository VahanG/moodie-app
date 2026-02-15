# Moodie Agents Guide

## Purpose
Moodie’s supporter app pairs digital analogs of Moodie products with in-app purchasing and remote content delivery. This guide keeps every agent aligned on vision, responsibilities, workflows, and upcoming work.

## Product Pillars
- **Digital Twins**: Curate accurate, media-rich analogs for every Moodie product line.
- **Commerce Compliance**: Support native IAP flows on iOS/Android with receipt validation and audit trails.
- **Dynamic Content**: Ship remotely managed content (catalog updates, campaigns, themes) so users rarely need forced upgrades.
- **Insights Loop**: Capture engagement and conversion telemetry to inform the next content drop.

## Agent Roster & Responsibilities
### 1. Product Analog Agent
- Owns product schemas, asset pipelines, 3D/AR placeholders, and QA of catalog data.
- Inputs: brand briefs, SKU sheets, photography.
- Outputs: synced entries in `content/products.json` (or remote CMS), asset download manifests.

### 2. Commerce & Fulfillment Agent
- Manages `react-native-iap` setup, store listings, price tiers, and sandbox coverage.
- Keeps purchase hooks (`src/features/commerce`) aligned with backend fulfillment and receipt verification service.
- Escalates compliance or policy changes to leadership.

### 3. Dynamic Content & CMS Agent
- Operates remote content source (Firebase, Supabase, or custom CMS) and versioning.
- Defines cache invalidation rules and fallback stories for offline mode.
- Publishes release notes for each content push in `docs/releases/`.

### 4. Experience & Navigation Agent
- Leads React Native UI flows, navigation stacks, and Safe Area strategy (`App.tsx`, `src/navigation/*`).
- Ensures feature flags or remote config toggles gracefully degrade when offline.

### 5. Data & Insights Agent
- Owns analytics schema, privacy reviews, and dashboard reporting.
- Aligns event names between app (`src/analytics`) and data warehouse.
- Flags anomalies to the team during weekly reviews.

### 6. Infra & Release Agent
- Maintains build pipelines, certificates, provisioning profiles, and OTA delivery (CodePush/AppCenter if adopted).
- Oversees `android/` and `ios/` native configs, ensuring CI parity.

## Core Workflows
### Daily Cadence
- Async standup in `#moodie-agents` Slack: blockers, deploys, incidents.
- Content diffs reviewed via pull request + CMS change log.

### Backlog & Planning
- Product Analog + Experience agents co-own feature tickets in Linear/Jira.
- Commerce agent reviews every item tagged `iap`, ensuring SKU readiness before merge.

### Content Drops
1. Dynamic Content agent stages new catalog entries.
2. Product Analog agent validates assets + metadata.
3. Release agent triggers OTA or app store release only if native change required.
4. Data agent updates experiment dashboards.

### Purchase SKU Updates
- Sandbox test cases documented in `docs/testing/iap.md`.
- Receipt verification smoke tests executed before store submission.

### Incident / Escalation
- P0 incidents triaged by Infra agent, handed to responsible owner within 15 minutes.
- Postmortems logged under `docs/incidents/`.

## Integrations & References
- React Native app (`App.tsx`, `src/` tree) for front-end logic.
- Remote CMS / Firestore for dynamic catalog payloads.
- Payment backends + receipt validation microservice.
- Analytics stack (e.g., Segment + BigQuery).
- Monitoring: Sentry for runtime errors, Firebase Performance for latency.

## Next Steps
1. Stand up the remote content service schema (owner: Dynamic Content agent).
2. Draft initial digital analog templates + sample assets (owner: Product Analog agent).
3. Spike `react-native-iap` integration with sandbox SKUs (owner: Commerce agent).
4. Decide on OTA strategy (CodePush vs. in-app CMS only) before first release (owner: Infra agent).

## Open Questions
- Do we need region-specific pricing rules or tax handling beyond store defaults?
- Which backend service will host receipt validation, and who owns SLAs?
- Should analytics events aggregate per campaign or per SKU variant for reporting?
