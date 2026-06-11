# Pivot Table Control Runtime Proof

## Scope

This is a focused runtime proof pass for Dashboard Pivot Table Data Analytics controls.

- Branch: `codex/pivot-table-control-runtime-proof`
- Generated package: `pivot-table-control-runtime-proof.v1.yap`
- Downloads copy: `/Users/Renger/Downloads/pivot-table-control-runtime-proof.v1.yap`
- Follow-up package: `pivot-table-control-runtime-proof-with-sample-data.v2.yap`
- Follow-up Downloads copy: `/Users/Renger/Downloads/pivot-table-control-runtime-proof-with-sample-data.v2.yap`
- Runtime site: `https://<yourdomain>.yeeflow.com`
- App name: `Pivot Table Runtime Proof`
- Dashboard page: `Dashboard`
- Source learning baseline: `docs/studies/pivot-table-control.md`

## Proof Boundary

- Dashboard Pivot Table schema remains export-proven from `CRM - Customer relationship management (1).yap`.
- The generated package is locally validator-backed for Pivot Table data source, row, column, value, aggregation, and date-grouping references.
- Runtime import/open/empty-render behavior is runtime-proven for the generated representative Dashboard package.
- The v2 follow-up package is user-confirmed to work well after manual import, and adding new items in its data list is user-confirmed successful.
- Populated Pivot Table rendering is user-confirmed at package level, but this pass does not separately prove exhaustive aggregation correctness or every individual value.
- Data List form Pivot Table behavior, alternate data source classes, Data Filter variable interaction, permissions, security, large-data performance, and workflow behavior are not runtime-proven.
- Data mutation proof is limited to adding new items in the v2 package's `Deals Analytics Runtime Test` data list; do not generalize it to other lists, workflows, permissions, or bulk operations.

## Generated Package

The generator script `generate-pivot-table-control-runtime-proof.mjs` creates a small synthetic Yeeflow app with one data list and three Dashboard Pivot Table controls:

| Pivot Table | Rows | Columns | Value | Purpose |
| --- | --- | --- | --- | --- |
| Count by Deal Type and Owner | Deal Type | Deal Owner | `COUNT(ListDataID)` | count-based representative Pivot Table |
| Sum Amount by Lead Source and Year | Lead Source | Close Date grouped by `YEAR` | `SUM(Amount)` | numeric/date-grouped representative Pivot Table |
| Average Amount by Stage and Deal Type | Stage | Deal Type | `AVG(Amount)` | additional numeric aggregation representative |

The package uses synthetic fields and local-safe sample row definitions only. The source export and decoded payloads are not committed.

The v2 follow-up package uses the same three Pivot Table controls and includes 20 safe synthetic sample rows in `Deals Analytics Runtime Test`. It also fixes the generated field definition alignment by cloning data-list field definitions by `FieldName`, so exported `FieldID` / `FieldName` / row-cell references stay aligned after import.

## Local Validation

Local validation passed the strict generated-app readiness gate with zero errors.

- `node --check generate-pivot-table-control-runtime-proof.mjs`: pass
- `node --check scripts/inspect-pivot-table-controls.mjs`: pass
- Pivot Table inspector: pass, 3 Pivot Tables, 0 findings
- Dashboard/page inspector: pass
- YAP schema-standard inspector: pass, 0 errors
- App-creation rules inspector: pass, 0 errors
- Strict package validator: `pass_with_warnings`, 0 errors
- Strict graph validator: pass, 0 errors
- Materialization inspector: `pass_with_warnings`, 0 errors; one expected dashboard-only `NO_FORMS` warning
- Aggregate import-readiness inspector: `pass_with_warnings`, 0 errors

Non-blocking warnings were limited to small proof-app presentation warnings such as empty app theme/arbitrary design colors and the expected dashboard-only no-forms warning.

## Runtime Result

The generated package imported successfully into Yeeflow.

The imported app opened successfully, and the `Dashboard` page opened without a dashboard crash. The three Pivot Table controls rendered in the Dashboard shell with visible control titles and row header bindings:

- `Deal Type`
- `Lead Source`
- `Stage`

No visible missing data source error, missing row/column/value binding error, or dashboard render crash appeared during the Dashboard open.

## Runtime Blocker

The package-defined `ListDatas` sample rows were not present in the imported data list at runtime. The imported `Deals Analytics Runtime Test` list opened and showed the expected field headers, but no rows.

A manual attempt to add one safe synthetic row through the Yeeflow UI reached the add form and populated fields, but Yeeflow returned `Add failed`. Because this proof pass is not a data-mutation investigation, the failure is recorded as a blocker for populated Pivot Table rendering rather than converted into a broader data-list mutation claim.

As a result, this pass does not prove:

- populated count-based Pivot Table value cells
- populated `SUM(Amount)` Pivot Table value cells
- populated date-grouped Pivot Table value cells
- grand total row or column display with values
- aggregation correctness

## V2 Follow-Up Result

After the v1 blocker, the generator produced `pivot-table-control-runtime-proof-with-sample-data.v2.yap` with 20 safe synthetic data-list rows and field definitions cloned by field name instead of by array position.

Local validation for v2 passed with zero errors:

- `node --check generate-pivot-table-control-runtime-proof.mjs`: pass
- Pivot Table inspector: pass, 3 Pivot Tables, 0 findings
- Aggregate import-readiness inspector: `pass_with_warnings`, 0 errors

The v2 package was copied to `/Users/Renger/Downloads/pivot-table-control-runtime-proof-with-sample-data.v2.yap` for manual import testing.

The user confirmed that the regenerated package works well and that new items can be added successfully in the data list. This resolves the v1 data-list sample/add blocker for the focused v2 package.

The confirmation is intentionally narrow:

- generated v2 package import/open/use is user-confirmed
- data-list sample/add behavior is user-confirmed for this v2 app
- Dashboard Pivot Table package behavior is user-confirmed at practical smoke-test level
- exhaustive aggregation correctness, every aggregation function, every date grouping mode, alternate data source classes, Data Filter variable interaction, Data List form hosting, permissions, security, large-data performance, and workflow behavior remain unproven

## v1 to v2 Data List Seed/Add Readiness Root Cause

The v1 failure is strongly indicated by the v1/v2 package and generator diff rather than by a Yeeflow server trace. The reusable issue is generic generated Data List seed/add readiness, not Pivot Table schema.

What failed in v1:

- the package imported and the Dashboard opened
- Pivot Table controls rendered structurally
- imported `ListDatas` rows did not appear in the runtime data list
- manual add of a safe synthetic row returned `Add failed`

What changed in v2:

- the data-list field definitions are cloned by `FieldName` instead of by array position
- the same list carries 20 safe synthetic rows
- the user confirmed that rows appeared, Pivot Tables worked with sample data, and adding new list items succeeded

Strongest identified cause:

- v1 reused template `Defs[]` by array position after replacing the field names
- this crossed storage metadata:
  - `Text1` and `Text2` kept `FieldType: Datetime`
  - `Datetime1` kept `FieldType: Text`
  - `Decimal1` kept `FieldType: Text`
- seeded rows used keys such as `Text1`, `Datetime1`, and `Decimal1`, but the field storage metadata no longer matched those keys
- v2 selected the template field definition by `FieldName`, restoring `Text* -> Text`, `Datetime* -> Datetime`, and `Decimal* -> Decimal`

Exact generator rule learned:

- when generating or repurposing data-list fields, never clone field definition templates by array position
- select the source/template field definition by the target `FieldName` storage family, then rewrite display metadata, internal name, ID, and list ownership
- seeded `ListDatas` rows must use keys that resolve to fields whose `FieldName`, `FieldType`, and `Type` agree with the runtime value format
- analytics/demo apps that depend on populated dashboard controls should validate seed rows and add-ready list metadata before handoff

Validator/import-readiness rule added:

- generated-final validation now hard-errors on `FIELD_NAME_FIELDTYPE_MISMATCH`
- the app-creation rules inspector also hard-errors the same mismatch
- the aggregate import-readiness gate inherits this check through package validation and app-creation rules

Proof boundary:

- v2 rows visible, Pivot Tables working with sample data, and add-new-item success are user-confirmed
- the root cause is strongly indicated by the v1/v2 diff and by v2 recovery after field definition alignment, but no server-side import/add trace was captured
- this is not exhaustive proof for all data-list field types, custom forms, permissions, lookup values, bulk imports, or all analytics aggregations

## Runtime Observations

Observed at runtime:

- package import succeeded
- app appeared in the workspace
- app opened
- Dashboard opened
- Dashboard Pivot Table controls did not crash
- row header bindings rendered for the three representative Pivot Tables
- no visible missing data source or missing binding error appeared

Not observed in this pass:

- exhaustive aggregation correctness
- all supported aggregation functions
- all supported date grouping modes
- Data Filter variable interaction
- alternate data source classes
- Data List form Pivot Table hosting

## Next Step

If broader proof is needed, run a dedicated aggregation-correctness pass with known expected values, plus separate focused passes for Data List form hosting, Data Filter variable interaction, and alternate data sources such as Document Library, Form Report, and Data Report.
