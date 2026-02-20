# Docs-to-Code Generation (Phase 2 Proposal)

## Goal
Generate strongly typed scaffolding from approved docs artifacts.

## Proposed scope
- Generate TypeScript interfaces from `docs/domain/catalog-model.md` and contract docs.
- Generate stub services/contracts for integrations.
- Validate generated files against schema changes in CI.

## Prerequisites
- Stable docs templates and naming conventions.
- Explicit schema sections in domain docs.
