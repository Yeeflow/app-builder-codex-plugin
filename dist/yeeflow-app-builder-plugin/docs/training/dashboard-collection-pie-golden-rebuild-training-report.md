# Dashboard Collection And Pie Golden Rebuild Training Report

## Context

This training captures the Office Asset Loan Management dashboard repair documented in the local validation report for the Asset Loan Operations Collection and Pie Golden Reference rebuild.

The local dashboard-only repair rebuilt `Asset Loan Operations Dashboard` so the multiselect grid-table region used the approved `collection_control_grid_table_with_multiselect` Golden Reference and the pie chart used the approved `data_analytics_pie_chart_with_title` Golden Reference. Focused dashboard and data analytics validators passed after the repair, but global first-generation preflight correctly remained blocked by an unrelated legacy Approval workflow condition shape.

## Classification

- Generator gap: `collection_control_grid_table_with_multiselect` clone-and-map could lose the real Collection root and leave only inner row/grid controls, which makes Designer/runtime select the wrong node.
- Generator gap: cloned template subtrees could preserve source UUID-like control/action values across pages and repeated sections, creating duplicate runtime identities.
- Validator gap: dataset presentation validation checked wrapper and slot shape but did not require the real `grid_table_col_body` Collection root identity.
- Existing hard gate behavior: global first-generation preflight is still correct to block signing when unrelated Approval workflow resources are invalid. Dashboard-only upgrade flows need explicit unchanged-resource proof, not silent bypass of global signing gates.

## New Requirements

1. `collection_control_grid_table_with_multiselect` generation must clone the full `grid_table_col_multiselect_wrapper` subtree and preserve the real Collection root identity `grid_table_col_body`.
2. Generated packages must fail if the selected grid-table multiselect template materializes only inner `grid_col_item`, `flex_grid`, checkbox, or visual wrapper controls without the Collection root.
3. Template clone logic must recursively re-instantiate source UUID-like values while preserving repeated internal references within one clone.
4. Dashboard Data Analytics controls may claim `runtimeModelProven: true` only when the generated resource has matching `ReportIds[]`, `exts[]`, source list metadata, and resolved rows/values fields.
5. Scope-aware dashboard-only upgrade reporting must keep unrelated legacy Approval workflow defects separate from dashboard repair evidence. It must not claim first-generation signing eligibility when global preflight fails.

## Implemented Changes

- `scripts/materialize-full-app-generated-final.mjs`
  - Re-instantiates UUID-like template values after cloning Collection template roots.
- `scripts/validate-dashboard-dataset-presentation-golden-references.mjs`
  - Adds `DASH_DATASET_GRID_MULTISELECT_COLLECTION_ROOT_IDENTITY_MISSING`.
- `scripts/test-dashboard-dataset-presentation-golden-references.mjs`
  - Adds a regression case proving the grid-table multiselect Collection root identity is required.
- Standards and skills now state that approved Dashboard Collection templates are clone-and-map source-of-truth assets, not visual suggestions.

## Validation Expectations

Run at minimum:

```sh
node --check scripts/materialize-full-app-generated-final.mjs
node --check scripts/validate-dashboard-dataset-presentation-golden-references.mjs
node --check scripts/test-dashboard-dataset-presentation-golden-references.mjs
node scripts/test-dashboard-dataset-presentation-golden-references.mjs
node scripts/test-full-app-materialization-entrypoint-gates.mjs
node scripts/test-yapk-dashboard-runtime-materialization-preflight-gates.mjs
node scripts/test-dashboard-generation-hard-gates.mjs
node scripts/test-data-analytics-golden-reference-gates.mjs
node scripts/test-yapk-live-install-readiness-gates.mjs
node scripts/test-yapk-hard-gate-cache-artifacts.mjs
```

Generated-final packages that fail these gates are not eligible for signing, install/import, upgrade, runtime proof, or handoff.
