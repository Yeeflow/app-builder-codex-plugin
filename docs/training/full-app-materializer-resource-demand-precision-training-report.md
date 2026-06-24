# Full-App Materializer Resource-Demand Precision Training Report

## Summary

This training follows the `0.8.32` clean-room revalidation of Office Asset Loan Management.

Version `0.8.32` correctly stopped the unsafe `0.8.31` behavior: it no longer emitted a placeholder package and no longer reported `signingEligible: true` for a nontrivial App Plan. The remaining issue was precision and actionability. The standalone materializer reported inflated planned-resource counts because its resource-demand parser counted non-resource table rows such as data-list fields, dashboard sections, metrics, filters, and item-template rows.

The materializer now reports exact planned resource categories and missing generated-final output surfaces when it cannot materialize the full resource graph.

## Source Finding

The clean-room revalidation showed:

- active plugin and cache were `0.8.32`;
- OAuth and `flowcraft / Codex Mini` workspace discovery passed;
- API-issued ID allocation passed;
- standalone materializer inspection passed;
- materialization failed closed with `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED`;
- no package was emitted and signing/install/runtime proof were correctly skipped;
- resource-demand counts were inflated for a rich App Plan;
- generated-final resource completeness regression coverage needed to remain explicit for planned approval forms with `Forms: []`.

## Changes

- Tightened `scripts/materialize-full-app-generated-final.mjs` resource-demand parsing.
- Resource headings are authoritative when present.
- Canonical table fallback is limited to resource-name headers.
- Field tables, dashboard section rows, filter rows, metric rows, item-template rows, validator commands, and explanatory prose no longer inflate planned-resource counts.
- `FULL_APP_MATERIALIZATION_RESOURCE_GRAPH_NOT_IMPLEMENTED` now includes:
  - exact planned counts;
  - parsed planned resource names;
  - `missingResourceGraph[]` entries with required output surfaces;
  - `packageEmitted: false`;
  - `signingEligible: false`.
- The materializer does not create an output directory or placeholder package for nontrivial App Plans it cannot fully generate.

## Regression Coverage

`scripts/test-full-app-materialization-entrypoint-gates.mjs` now includes a rich Office Asset style App Plan with:

- four data lists;
- two approval forms;
- one FormNewReport;
- two custom data list forms;
- two dashboard pages;
- three navigation groups;
- data-list field rows and dashboard business-region rows that must not be counted as resources.

The test proves the materializer fails closed with exact resource counts, parsed resource names, missing resource graph details, no output package, and `signingEligible: false`.

`scripts/test-generated-final-resource-completeness-gates.mjs` remains the focused guard for generated-final package validation, including planned approval forms with decoded `Forms: []`.

## Safety Boundary

This training does not claim that the standalone materializer can fully generate nontrivial App Plans. It makes the blocker precise and machine-readable, keeps incomplete package generation blocked, and preserves the hard stop before signing, install/import, upgrade, Version Management, seed data, and browser/runtime proof.
