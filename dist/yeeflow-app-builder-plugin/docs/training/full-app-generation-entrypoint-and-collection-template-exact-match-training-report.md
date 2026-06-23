# Full-App Generation Entrypoint And Collection Template Exact-Match Training Report

## Trigger

A clean-room Office Asset Loan Management generation validation using active `yeeflow-app-builder@yeeflow 0.8.13` stopped before generated-final package creation. Planning passed, but the report found two issues:

1. The plugin did not expose a machine-checkable full-app generation entrypoint contract, so clean-room validation could not distinguish skill-orchestrated full-app generation from validators, delivery helpers, runtime-proof demos, and sample-specific generators.
2. `validate-dashboard-dataset-presentation-golden-references.mjs` used substring matching for App Plan Collection template references. Long IDs such as `collection_control_grid_table_with_multiselect` and `collection_control_grid_table_with_search` also matched `collection_control_grid_table`.

## Changes

- Added `docs/reference/full-app-generation-entrypoints.json`.
- Added `docs/standards/full-app-generation-entrypoint-standard.md`.
- Added `scripts/inspect-full-app-generation-entrypoints.mjs`.
- Added `scripts/test-full-app-generation-entrypoint-gates.mjs`.
- Updated Dashboard dataset presentation validation to use exact template-token matching rather than substring matching.
- Expanded Dashboard dataset presentation tests so long grid-table IDs are actually parsed and validated.
- Registered the full-app entrypoint gate in aggregate UI hard gates and YAPK cache artifact checks.
- Updated application-builder, application-generator, YAPK package generator, and package-validator skill guidance.

## Behavior After Training

- Clean-room validation must run `scripts/inspect-full-app-generation-entrypoints.mjs` before claiming that the plugin has no full-app generation path.
- `skill:yeeflow-application-builder` and `skill:yeeflow-application-generator` are declared as skill-orchestrated full-app generation entrypoints.
- `scripts/yeeflow-application-delivery-workflow.mjs`, `scripts/yeeflow-package-api-automation.mjs`, focused `generate-*-runtime-proof.mjs` scripts, and sample-specific generators are explicitly not generic full-app generators.
- App Plans may safely use `collection_control_grid_table_with_multiselect` and `collection_control_grid_table_with_search` without being falsely counted as also selecting `collection_control_grid_table`.

## Proof Boundary

This training does not claim a new standalone one-command CLI that automatically generates a complete business `.yapk` from Markdown. It makes the plugin generation entrypoint contract explicit and prevents helper-script misclassification. Generated-final package correctness still requires the existing generated-final package validators, signing proof, install/import proof, and runtime proof when those stages are authorized.

## Validation

Required validation:

- `node --check` for changed `.mjs` files.
- `node scripts/test-dashboard-dataset-presentation-golden-references.mjs`.
- `node scripts/test-full-app-generation-entrypoint-gates.mjs`.
- Dashboard v1.1, dashboard golden-reference, generated-final, YAPK package/cache, planning, app icon, approval/export-shaped YAP, and aggregate UI hard-gate suites.
- Metadata inspection for the current training baseline.
- Source/dist mirror checks.
- Release safety audit and private/forbidden artifact scan.
