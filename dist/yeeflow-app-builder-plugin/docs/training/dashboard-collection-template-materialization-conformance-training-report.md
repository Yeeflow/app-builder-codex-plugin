# Dashboard Collection Template Materialization Conformance Training Report

## Summary

This training closes the gap where an App Plan can select multiple approved Dashboard Collection presentation templates, but generation materializes every Dashboard Collection as the same effective template.

The selected Collection presentation reference is now treated as a region-level implementation contract. When both an App Plan and generated package are available, validation compares each planned Dashboard dataset region against the generated Dashboard Collection region.

## Source Analysis

The training is based on the Office Asset Loan Management 0.8.19 validation report:

- `plugin-defect-analysis-dashboard-collection-template-materialization.md`
- `plugin-defect-analysis-dashboard-collection-template-materialization.json`

The report showed that the App Plan selected:

- `Event Pipeline Grid-Table`
- `collection_control_grid_table_with_multiselect`
- `collection_control_responsive_card_grid`
- `collection_control_grid_table`
- `collection_control_card_with_multiselect_toolbar`
- `collection_control_grid_table_with_search`

But the generated package materialized all Dashboard Collections as `Event Pipeline Grid-Table`.

## New Enforcement

`scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now performs App Plan-to-package conformance when both `--app-plan` and `--package` are provided.

New hard-gate findings:

- `DASH_DATASET_APP_PLAN_TEMPLATE_NOT_MATERIALIZED`
- `DASH_DATASET_REGION_TEMPLATE_MISMATCH`
- `DASH_DATASET_TEMPLATE_DIVERSITY_COLLAPSED`
- `DASH_DATASET_COLLECTION_REGION_MISSING`
- `DASH_DATASET_COLLECTION_EXPLICIT_PROVENANCE_MISSING`

## Generator Contract

Generation must:

- parse each App Plan Dashboard dataset region
- use the selected Collection presentation reference as the dispatch key
- generate the matching approved template structure for that exact region
- emit explicit Collection-root template provenance
- avoid fallbacking every Collection to `Event Pipeline Grid-Table`, generic grid-table, cards, or any other single default builder

## Regression Coverage

`scripts/test-dashboard-dataset-presentation-golden-references.mjs` now proves:

- valid App Plan-to-package region/template conformance passes
- planned template diversity collapsed to one generated template fails
- App Plan-selected templates not materialized fail
- region-level template mismatches fail
- region matches with ancestor-only template inference fail explicit provenance

## Classification

Plugin defect:

- The App Plan was clear and selected exact approved templates.
- The generator collapsed multiple template choices to one effective template.
- Previous validators checked App Plan legality and package legality independently, so the mismatch could pass.

This training adds the missing generated-final conformance proof before signing, install/import, upgrade, runtime proof, or handoff.

## Proof Boundary

This gate proves local package conformance to the App Plan's selected Dashboard Collection templates. It does not prove live Yeeflow rendering, search behavior, multiselect mutation, action execution, or browser/runtime visual fidelity.
