# Dashboard Multiselect Template Fidelity And Materialization Training Report

This training closes the remaining 0.8.23 regression findings from the Office Asset Loan clean-room recheck.

## Trigger

Active `yeeflow-app-builder@yeeflow 0.8.23` improved card/grid multiselect validator routing and App Plan parsing, but the generated-final preflight still stopped before signing because:

- the card and grid multiselect source template artifacts still contained Text controls without complete `attrs.heads.ty` / plain-string `attrs.heads.color` metadata
- `collection_control_grid_table_with_multiselect` still allowed wrapper gap drift and `link: "default"` row-detail placeholders
- generated dashboards could still materialize Collection templates while omitting the full Dashboard Page Layouts v1.1 shell, planned Summary/KPI controls, or planned Data Filter controls

## Changes

- Added source-template fidelity checks to `scripts/validate-dashboard-dataset-presentation-golden-references.mjs`.
- The registry gate now validates the card/grid multiselect template files themselves, not only generated packages.
- Fixed the source templates so exported Text controls preserve typography and color metadata.
- Hardened the grid-table multiselect source artifact with:
  - `grid_table_col_multiselect_wrapper.attrs.container.gap = 0`
  - `attrs.style.gap = [null, 0]`
  - `attrs.data.link = "{{DetailLayoutID}}"`
  - `attrs.data.opentype = "slide"`
  - `attrs.data.modalsize = 2`
- Added focused regression cases for missing Text metadata, wrapper gap drift, and invalid detail-link source contract.
- Updated Dashboard dataset-presentation and v1.1 standards plus generator/validator skills so planned Summary/KPI metrics and filters must materialize as real controls, not disappear behind a Collection-only dashboard.

## Validator Behavior

The dataset-presentation validator now fails source artifacts before release/cache smoke if:

- a multiselect template Text control lacks `attrs.heads`
- a Text control lacks `attrs.heads.ty`
- a Text control lacks plain-string `attrs.heads.color`
- grid-table multiselect root gap metadata is missing or not the canonical zero-gap form
- grid-table multiselect uses `link: "default"`, an empty link, or misses `opentype = "slide"`

Generated packages remain blocked by existing generated-final gates if App Plan-declared Summary/KPI metrics or filters are not materialized.

## Classification

This is a partial follow-up to earlier 0.8.x template training. The earlier work correctly introduced full card/grid multiselect templates and avoided applying grid-table rules to card templates, but it did not make source-template fidelity a hard gate and left a grid detail-link placeholder that could propagate into generated-final packages.

## Proof Boundary

This training is validator/source-template/skill guidance only. It does not sign, install, import, upgrade, or runtime-test an application package. Runtime proof remains required before claiming installed dashboard behavior.
