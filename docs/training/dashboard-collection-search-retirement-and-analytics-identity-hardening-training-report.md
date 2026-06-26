# Dashboard Collection Search Retirement And Analytics Identity Hardening Training Report

## Summary

This training retires `collection_control_grid_table_with_search` as a standalone Dashboard Collection golden reference. The approved Dashboard Collection template set is now:

- `collection_control_responsive_card_grid`
- `collection_control_card_with_multiselect_toolbar`
- `collection_control_grid_table`
- `collection_control_grid_table_with_multiselect`
- `Event Pipeline Grid-Table`

Search/fulltext remains allowed as a behavior inside the selected approved Collection template's editable toolbar or filter region. It must not be represented as a separate template ID in the App Plan, generated resource provenance, or package validation.

## Covered Issues

- A validation run showed Data Analytics runtime `ReportIds[]` and `exts[]` gates working, but generated-final was still blocked by Collection template ID leakage, a retired search-only Collection reference, a non-UUID Pivot Table control ID, and an analytics identity validator false positive.
- Source Collection templates can contain export-origin `ListSetID`, `ListID`, or detail-layout placeholders. Generation must recursively rewrite these to current package IDs before signing readiness.
- Pivot Table controls must receive UUID-shaped runtime-safe IDs and the same ID must be registered in `ReportIds[]` and `exts[].i`.
- Data Analytics validators must not treat display labels such as `series[].name` or business questions as source field references. Only field-bearing keys such as `field`, `fieldName`, `FieldName`, `FieldID`, and `fieldId` are field references.

## New Rules

- `collection_control_grid_table_with_search` is retired and must fail as an unknown Dashboard Collection template ID.
- App Plan generation must choose one of the current approved Collection templates, then describe search/fulltext as behavior within that selected template when needed.
- Full-app materialization must not map retired template IDs to active templates.
- Full-app materialization must recursively remap source-template IDs and placeholders inside Collection clones, including action payloads, data-source references, row-open links, and nested JSON strings.
- Data Analytics controls generated from templates must use UUID-shaped control IDs. Existing non-UUID template IDs must be replaced during materialization.
- Data Analytics identity validation must ignore display-only names and business-question labels when checking field references.

## Validation Expectations

- `validate-dashboard-dataset-presentation-golden-references.mjs --registry` must report the retired search template absent from the approved set.
- App Plans that still select `collection_control_grid_table_with_search` must fail.
- Generated packages that still emit `collection_control_grid_table_with_search` provenance must fail.
- Generated packages must not leak source-template large IDs in Dashboard resources.
- Pivot Table controls must have UUID-shaped IDs and matching runtime registration.
- Data Analytics field-reference validation must still fail unresolved real fields, while allowing display labels in `series[].name`.
