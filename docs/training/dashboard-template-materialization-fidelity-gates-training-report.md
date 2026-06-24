# Dashboard Template Materialization Fidelity Gates Training Report

## Source Analysis

This training addresses the Office Asset Loan Management clean full E2E final analysis report from the 0.8.24/0.8.25 validation run.

The report showed that generated applications could select trained Dashboard Collection and KPI templates in planning, yet still materialize simplified helper-built controls in generated resources. The affected areas were especially:

- `collection_control_grid_table_with_multiselect`
- Dashboard KPI cards / Summary-backed KPI regions
- Search/filter condition shape
- source-domain text replacement
- selected-item action/temp-variable preservation
- normalizer drift of locked template spacing

The root issue is a generator fidelity gap: approved templates were treated as visual references instead of mandatory export-shaped source-of-truth modules.

## Training Scope

This training makes approved Dashboard Collection/KPI modules clone-and-map contracts:

- clone approved template subtrees from registry/template artifacts
- replace only allowed business slots
- reject helper-created lookalikes
- reject source-domain template residue in unrelated apps
- reject locked layout/style drift caused by normalizers
- reject static multiselect checkbox controls without select/toggle actions
- reject Designer-incompatible filter condition shapes
- reject KPI wrappers that omit approved KPI row/card provenance

## Validator Updates

`scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now adds generated-package checks for:

- `DASH_DATASET_GRID_MULTISELECT_FULL_WIDTH_CONTRACT_MISSING`
- `DASH_DATASET_GRID_MULTISELECT_LOCKED_STYLE_DRIFT`
- `DASH_DATASET_GRID_MULTISELECT_TEMPLATE_RESIDUE`
- `DASH_DATASET_GRID_MULTISELECT_SELECT_ACTION_MISSING`
- `DASH_DATASET_GRID_MULTISELECT_SELECT_ACTION_UNRESOLVED`
- `DASH_DATASET_GRID_MULTISELECT_FILTER_CONDITION_SHAPE_INVALID`
- `DASH_DATASET_GRID_MULTISELECT_FILTER_BINDING_UNCONSUMED`
- `DASH_DATASET_KPI_MODULE_ROW_MISSING`
- `DASH_DATASET_KPI_HELPER_CARD_FORBIDDEN`

The focused regression suite now proves passing behavior for a valid Office Asset style grid-table multiselect module and failure behavior for the known regressions from the report.

## Documentation And Skill Updates

Updated standards and skills now state:

- Dashboard Collection/KPI templates are source-of-truth artifacts, not suggestions.
- Generator entrypoints must clone approved modules and map business content.
- Old helper functions must not rebuild "similar" KPI cards, grid tables, checkbox columns, toolbars, or filters.
- `collection_control_grid_table_with_multiselect` must keep full-width wrapper/caption/content layers, locked spacing, action-bound selection control, selected-state variables/actions, and Designer-compatible filter condition shape.
- KPI sections must clone `kpi_cards_kpi_row` and `event_portfolio_kpi_planned_events`; helper-created `ops_kpi_*` cards are forbidden.

## Classification

- Pre-existing generator gap: generation paths could bypass trained templates and manually reconstruct controls.
- Newly exposed by recent training: stronger planning/template selection gates made it visible that selected templates were not always materialized faithfully.
- Validator gap fixed here: conformance now checks module fidelity, not just template ID selection and broad structural presence.

## Validation

Required validation for this training includes:

- `git diff --check`
- changed `.mjs` syntax checks
- `node scripts/test-dashboard-dataset-presentation-golden-references.mjs`
- dashboard hard gates
- generated-final materialization/completeness suites
- YAPK schema/package/cache gates
- Functional Spec/App Plan/planning suites
- app icon gates
- approval/export-shaped YAP validators
- aggregate UI hard gates
- metadata inspection for the current version
- source/dist mirror checks
- release safety audit
- changed-file private/forbidden artifact scan

## Safety

This training is validator/standard/skill/report scope only. It does not move `stable`, create tags/releases/plugin archives, call live Yeeflow APIs, sign packages, install/import apps, or modify user-generated app packages.
