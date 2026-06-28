# Full-App Materializer Template Coverage Hardening Training Report

Date: 2026-06-28

## Trigger

Clean E2E validation with active plugin `yeeflow-app-builder@yeeflow 0.8.74` passed planning gates but stopped at generated-final validation. The package was not signed or installed.

Observed blockers:

- Duplicate custom form `LayoutID` allocation and ID provenance path drift.
- Navigation group ID emitted as `undefined`.
- Dashboard Collection materialization collapsed planned templates into a single grid-table style.
- Planned Data Table golden references were not materialized.
- Dashboard KPI/Summary and filter runtime contracts were incomplete.
- Approval form and Data List form layout surfaces were not consistently aligned with the App Plan.

## Training Goal

The full-app materializer must consume App Plan template selections as source-of-truth and produce generated-final resources that are eligible for local preflight validation before signing. It must not silently collapse approved template choices, invent placeholder sections, or emit ID paths that cannot be proven by API-issued provenance.

## Changes

- Added App Plan extraction for Dashboard Data Table template selections.
- Materialized all planned Dashboard Collection template records for a page instead of only the first matching dataset.
- Materialized approved Data Table golden references in Dashboard slots.
- Preserved Workbench custom data-list form template selection through custom form layout creation.
- Aligned custom form layout ID allocation with actual decoded layout positions.
- Added a default navigation group ID path when an App Plan does not explicitly list navigation groups.
- Allowed approved Data Table controls to satisfy Dashboard business-content gates.
- Pruned unplanned Data List form operation containers so unused template shells do not remain visible.

## Required Runtime Boundary

This training does not sign, install, import, or claim browser runtime proof. It only hardens generated-final materialization and local preflight readiness. Signing and install remain gated by generated-final preflight and live tenant proof.

## Regression Coverage

The focused full-app materialization regression now verifies:

- Generated-final artifact creation for a nontrivial App Plan.
- API-issued ID provenance for generated resources.
- Navigation runtime metadata.
- Data List schema and custom form layout placement.
- Approval form fields and workflow publish-readiness.
- Dashboard Page Layouts v1.1 shell conformance.
- Multiple Dashboard Collection template materialization.
- Data Analytics and Data Table golden reference materialization.
- Dashboard Golden Reference and aggregate hard gates.
- Dashboard Summary hidden-host and field metadata contract.
- First-generation preflight pass before signing readiness handoff.

## Safety

- No version bump.
- No stable movement.
- No tags, releases, or plugin archives.
- No live Yeeflow writes.
- No signing, install, import, upgrade, seed data, or runtime proof.
