# Full-App Data Analytics Materialization Runtime Gates Training Report

## Context

Office Asset Loan Management clean E2E on plugin `0.8.46` stopped before signing because generated-final preflight failed. The App Plan selected all approved Data Analytics golden reference templates, but the generated package materialized none of them and the Data Analytics validator still passed.

## Training Scope

This training fixes the generated-final boundary for planned Data Analytics controls and related runtime-safe materialization issues:

- App Plan-selected Data Analytics templates must be materialized in the generated package.
- The Data Analytics validator must fail when a selected template is missing from the package.
- First-generation preflight must pass the App Plan into the Data Analytics golden-reference gate.
- Full-app materialization must clone approved analytics template trees into Dashboard Page Layouts v1.1 `2_columns_section` or `3_columns_section` areas.
- Generated chart and pivot controls must carry runtime model metadata tied to included data-list fields.
- Choice/select fields must have runtime-visible choices even when the App Plan omits explicit option values.
- User/identity fields in dashboard dynamic content must render as `dynamic-user`, not generic `dynamic-field`.
- Collection detail links must not leak unresolved `{{DetailLayoutID}}` or `default` template placeholders.
- Sample data must be emitted as a post-install companion artifact, not embedded in generated-final `.yapk` package content.

## New Enforcement

- `validate-data-analytics-golden-references.mjs` now supports `--plan` / `--app-plan`.
- The validator parses `Data Analytics Template Selection` tables and rejects missing planned templates with `DATA_ANALYTICS_PLANNED_TEMPLATE_NOT_MATERIALIZED`.
- `yapk-first-generation-preflight.mjs` forwards the App Plan to the Data Analytics gate.
- `materialize-full-app-generated-final.mjs` parses Dashboard analytics selections and materializes the selected approved template subtree with legal source binding, field mapping, provenance, and runtime model markers.
- The materializer emits a `*.generated-final.seed-data.json` companion artifact for post-install sample rows.

## Regression Coverage

- Focused Data Analytics golden-reference tests now cover package/App Plan pass and missing-template fail cases.
- Full-app materialization tests now include Data Analytics template selections and verify:
  - planned analytics records are parsed;
  - selected analytics templates appear in decoded resources;
  - Data Analytics validator passes with `--plan`;
  - first-generation preflight passes with Summary, Dashboard, Collection, and Data Analytics gates;
  - seed rows are separated into a post-install companion artifact.

## Safety Boundary

No signing, install/import, upgrade, Version Management polling, browser runtime proof, live write APIs, tags, releases, or stable movement are part of this training change.
