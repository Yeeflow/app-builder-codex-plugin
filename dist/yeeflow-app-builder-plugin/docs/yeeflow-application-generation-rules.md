# Yeeflow Application Generation Rules

## Data Filter Controls

Use `docs/studies/data-filter-controls.md` before generating Data Filter controls. The Sales and CRM learning passes are dashboard export-proven only: value-producing filters bind to embedded dashboard `page.filterVars[]` through `binding = "__filter_" + filterVarId`, and downstream data-bound controls consume those variables through expression-token arrays in data filter conditions.

Generation rules:

- Generate Data Filter controls only when data-bound controls need user-driven filtering.
- Define filter variables before any control or consumer references them.
- Wire every value-producing filter control to one existing filter variable.
- Wire downstream data tables, collections, lookups, charts/reports, summaries, or other data-bound controls to those variables through data filter conditions.
- Prefer value-change/default behavior for lightweight filters.
- Use click-apply behavior for multiple or heavier filters, and include a valid Apply button whenever any filter requires it.
- Include Remove filters only when a reset affordance is useful, and validate explicit reset targets when the export shape is known.
- Use Search filters for text/fulltext search paths such as dashboard `attrs.data.fulltext[]`.
- Use Radio filters for single-choice list-backed options with `attrs.data.list`, `attrs.display_f`, and `attrs.value_f`.
- Use Hierarchy filters only when hierarchical source data is available; keep list/display/value/parent/child field wiring together.
- Use Sorting filters for user-selected sort presets; CRM exports the control type as `sorting-filters`, with options in `attrs.sort_list[]` and consumers in `attrs.data.sortingfilter[]`.
- Do not generate unsupported Data Filter control types without export/runtime schema proof.

These rules apply to generated new-application `.yap` packages.

## YAP App Materialization Rules

The Custom Code Template Showcase investigation proved that Yeeflow can import a package shell while dropping app resources or data-list fields when ID ownership is wrong. Generated packages must satisfy these rules before runtime import:

- Every `ListID` must be unique.
- Every `FieldID` must be unique across the whole application.
- Every `field.ListID` must equal the parent data list `ListID`.
- Every `FieldName`, `InternalName`, and `DisplayName` must be unique inside its own data list.
- Do not remap `TenantID`, `CreatedBy`, or `ModifiedBy` as generated app-resource IDs.
- Do not include `TenantID`, `CreatedBy`, or `ModifiedBy` in `Resource.ReplaceIds`.
- Allocate fields from a global app-level field ID allocator, not a per-list reset.
- Build `ReplaceIds` from generated local app/list/field/layout/form/sample IDs only.
- Root Type `103` dashboard/page layouts must be owned by the root app/ListSet `ListID`.
- Root navigation must reference packaged dashboard/page, data-list, and approval-form resources that actually exist.
- Run package validation, graph validation, and `scripts/inspect-yap-materialization.mjs` before runtime import.
- Do not runtime-test custom code controls until app materialization passes.

## Runtime Language

Use "locally validated" when validators pass. Use "materialized" only after Yeeflow import/open confirms the app is not blank and generated data-list fields appear. Use "runtime-proven" for custom code controls only after component render, interaction, writeback, and persistence behavior are tested in the intended context.
