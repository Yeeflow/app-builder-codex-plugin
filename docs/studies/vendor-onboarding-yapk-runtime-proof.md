# Vendor Onboarding YAPK Runtime Proof Candidate

## Summary

This study records the local generation and validation status for the Vendor Onboarding & Compliance Management YAPK candidate generated from the approved UI implementation spec.

- Approved spec: `docs/generated-app-plans/vendor-onboarding-compliance-ui-implementation-spec.md`
- V1 output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.yapk`
- V1.1 signed output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-signed.yapk`
- V1.2 install-compatibility output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-install-compatible.yapk`
- V1.3 export-shape output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-export-shape.yapk`
- V1.4 field-category fixed YAPK package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk`
- YAP fallback output package: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.yap`
- YAP numeric `MainListType` candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap`
- YAP data-model isolation candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap`
- YAP schema-direct candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap`
- YAP field-category fixed schema-direct candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`
- YAP product-schema result candidate without lookups: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result-no-lookups.yap`
- YAP product-schema result candidate with lookups: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result.yap`
- YAP unique-ID product-schema result candidate without lookups: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids-no-lookups.yap`
- YAP unique-ID product-schema result candidate with lookups: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids.yap`
- Generator: `generate-vendor-onboarding-compliance-yapk.mjs`
- Install-compatibility generator: `generate-vendor-onboarding-install-compatible-yapk.mjs`
- Branch: `codex/vendor-onboarding-yapk-runtime-proof`
- Package type: YAPK
- V1 generated status: local validation candidate with placeholder signature shape
- V1.1 generated status: server-signed and verified locally, but rejected by Yeeflow install as an incorrect package
- V1.2 generated status: server-signed install-compatibility candidate using API-issued IDs and Yeeflow-style Brotli flush encoding; Yeeflow created an application tile but marked the install failed during materialization
- V1.3 generated status: server-signed export-shape candidate that keeps the V1.2 accepted wrapper/signing/encoding pattern and restores export-like list, field, and layout metadata
- V1.4 generated status: server-signed export-shape YAPK and schema-direct YAP with every `Field.Category` normalized to an integer
- YAP V1.4 product-schema result status: generated after product team supplied the corrected YAP v1 schema requiring decoded `Resource` to be `ListExportResult`
- YAP V1.5 unique-ID product-schema result status: generated after product team identified duplicated `LayoutID` values; uses safe unique JSON integer IDs
- YAP fallback status: generated from the same decoded application resource for normal application import testing after the YAPK path failed materialization
- YAP V1.1 status: same full generated application as V1 YAP with `Resource.MainListType` normalized from string `classes` to numeric `1024`
- YAP V1.2 data-model status: import-isolation candidate that removes the rich dashboard/custom-page surfaces and app groups, keeping the five data lists, fields, simple list forms, list views, and a minimal Home page
- YAP V1.3 schema-direct status: generated after reviewing the supplied standard YAP schema; `Resource` decodes directly to `ListExportInfo` instead of the older `Resource.Data` envelope

## Implemented Data Lists

- Vendors
- Vendor Documents
- Compliance Reviews
- Vendor Tasks
- Vendor Activity / History

The package defines 59 fields across the five data lists, including vendor identity, risk/status fields, compliance review fields, document review/expiry fields, task assignment/status fields, and vendor activity timeline fields. Vendor-related child lists include lookup rules back to the Vendors list.

## Implemented Pages And Forms

- Vendor Management Dashboard
- Compliance Review Workspace
- Vendor Detail View Page
- New Vendor Request Form
- Vendor Print Page

The package also includes supporting maintenance forms for Vendor Documents, Compliance Reviews, Vendor Tasks, and Vendor Activity / History so each generated data list has a safe add/edit/view form reference.

## Implemented Major Controls

- KPI cards using Container/Grid/Text controls
- Progress circle
- Progress bar
- Alert boxes
- Kanban boards with meaningful card template fields
- Data tables with configured display columns
- Icon list
- Vertical timeline
- Tabs
- Steps bar
- Dynamic field controls
- Dynamic user controls
- Dynamic file controls
- Document embed
- Dynamic Sub List for required document checklist
- Collection cards with local collection actions
- Bulk operation toolbar pattern
- QR Code
- Barcode
- Divider
- Safe outer padding, card structure, and grid layout
- Scoped custom CSS intent is represented in the page/card layout and remains subject to runtime visual review

## Validation Results

Validation was run on the generated V1.1 signed YAPK, the decoded app resource, and a temporary YAP-format validation wrapper around the same decoded app graph for legacy import-readiness inspectors. After V1.1 failed in Yeeflow install, V1.2 was generated to match the successful fresh-install YAPK evidence from the earlier Customer Satisfaction Survey study.

| Check | Result | Notes |
| --- | --- | --- |
| YAPK wrapper decode/parse | Pass | V1.1 Resource Brotli-decodes and validates as AppPackageInfo. |
| YAPK schema standard inspection | Pass | No wrapper/schema errors. |
| Strict generated package validation | Pass with warnings | 0 errors, warnings are schema-support/proof-boundary items for generated fields and advanced controls. |
| Graph validation | Pass with warnings | 0 errors, no unresolved lookup or graph edges. |
| Generated UI quality inspection | Pass | 0 errors, 0 warnings; dashboards, custom forms, data tables, and item templates detected. |
| Spec coverage inspection | Pass with warnings | 0 errors; manual review warnings remain for print page and advanced visual elements. |
| Import-readiness suite | Pass with warnings | 0 errors using the temporary validation wrapper; warnings remain for runtime proof boundaries and generated-control caution. |
| internal tenant URL scan | Pass | No hard-coded internal tenant URL found in generated package or generator. |

## Install Failure Follow-Up

The V1.1 server-signed package reached the Yeeflow install dialog but failed after clicking install with: `The package you uploaded is incorrect, please check and try again.`

The likely cause is package shape rather than signature validity. V1.1 used locally invented `7601...` IDs, finalized standard Brotli encoding, wrapper `AppID` as a string, and many inner identity values as quoted strings. A prior successful fresh-installable YAPK in this workspace required a closer Yeeflow-generated shape:

- API-issued IDs from `/utils/generate/ids`
- text-level ID remapping to avoid large numeric ID rounding
- wrapper `AppID` preserved as a number
- BOM-prefixed wrapper JSON
- Yeeflow-style Brotli flush-before-dispose Resource encoding, which tolerant-decodes to complete JSON but strict sync decode ends with `Z_BUF_ERROR`

V1.2 applies those install-compatibility changes.

V1.2 local proof:

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-install-compatible.yapk`
- Version: `1.2-install-compatible`
- API-issued/remapped large IDs: 83
- Server signing: passed
- Server verification: passed
- Signature shape: 32-byte base64 value
- Wrapper `AppID` type: number
- Resource encoding: Yeeflow-style Brotli flush-before-dispose compatible
- Tolerant Resource decode: complete parseable `AppPackageInfo`
- Strict sync decode: expected `Z_BUF_ERROR`
- Counts: 2 pages, 5 child lists, 59 fields, 14 layouts, 4 Data tables, 8 item-template controls
- Empty Data tables: 0
- Empty item templates: 0

## V1.2 Runtime Result And V1.3 Follow-Up

The V1.2 package was accepted far enough for Yeeflow to create an application tile named `Vendor Onboarding & Compliance Management`, but the tile showed `Install failed`. This is different from the V1.1 package-level rejection and narrows the issue to inner application materialization rather than wrapper parsing, signature shape, or upload acceptance.

V1.2 inspection found that its inner app package had been over-pruned while trying to match installable wrapper behavior:

- `ListSet` and child `List` resources were missing export-style keys such as `IsItemPerm`, `IsVerRecord`, `HasComment`, `Perms`, `AdvancePerms`, `Items`, and `Ext3`.
- Layout resources were missing export-style keys such as `Title`, `Ext3`, `IsDefault`, `IsItemPerm`, and `Perms`.
- Field resources still had a generated `Title` key that is absent from the successful fresh-installable YAPK comparison package.

V1.3 restores those export-like list, field, and layout metadata keys while preserving:

- API-issued ID remapping
- wrapper `AppID` as a number
- BOM-prefixed wrapper JSON
- Yeeflow-style Brotli flush-before-dispose Resource encoding
- 32-byte server signature
- successful `verifysign`

V1.3 local proof:

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-export-shape.yapk`
- Version: `1.3-export-shape`
- Server signing: passed
- Server verification: passed
- Signature shape: 32-byte base64 value
- Wrapper `AppID` type: number
- Resource encoding: Yeeflow-style Brotli flush-before-dispose compatible
- Tolerant Resource decode: complete parseable `AppPackageInfo`
- Strict sync decode: expected `Z_BUF_ERROR`
- Counts: 2 pages, 5 child lists, 59 fields, 14 layouts
- Export-like key check: root list set, child lists, fields, pages, and layouts now include the same key families as the successful fresh-install comparison package
- Hard-coded internal tenant URL: none detected

## YAP Fallback Package

After the V1.3 YAPK still showed `Install failed`, the same generated application resource was wrapped as a standard `.yap` application package for direct import testing instead of version-package installation.

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.yap`
- Package type: `.yap`
- Source resource: `.tmp/vendor-onboarding-compliance-management/vendor-onboarding-compliance-management.decoded-resource.json`
- Build command: `node build-yap-wrapper.js ... --validation-mode generator`
- Wrapper build status: pass
- Wrapper round trip: pass
- Package validation: pass with warnings, 0 errors
- Graph validation: pass with warnings, 0 errors
- Import-readiness suite: pass with warnings, 0 errors
- Generated UI quality inspection: pass, 0 errors
- Spec inspection: pass with warnings for manual print-page and advanced visual-element review
- Inventory: 5 data lists, 59 fields, 2 dashboards, 14 layouts, 4 app user groups
- Hard-coded internal tenant URL: none detected

This `.yap` package is the recommended next manual import candidate because the `.yapk` path is now known to fail during application materialization.

The first `.yap` import test also failed with `Created failed`. Inspection found that the wrapper was accepted into the import dialog but the create step still rejected the generated application resource. Two follow-up `.yap` candidates were generated:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.1-mainlisttype.yap`
  - Changes only `Resource.MainListType` from string `classes` to numeric `1024`.
  - Keeps the full rich UI payload.
  - Use this only to test whether the root app type encoding was the blocker.
- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.2-data-model.yap`
  - Recommended next test.
  - Uses numeric `MainListType = 1024`.
  - Removes the rich dashboard, rich custom forms, advanced UI controls, and app groups.
  - Keeps 5 data lists, 59 fields, lookup relationships, simple list views/forms, and one minimal Home page.
  - Import-readiness suite passed with warnings and 0 errors.
  - Inspection summary: 5 child lists, 0 app groups, 1 root layout, 15 child layouts, 79 replace IDs.

If V1.2 data-model imports, the failure is isolated to the rich UI/dashboard/custom-form layer rather than the core data model.

The V1.2 data-model import test created an application tile but still showed `Import failed`. A review against `/Users/Renger/Downloads/yap-v1-schema_v2.json` found a standard-schema mismatch in the fallback packages: the schema describes the wrapper `Resource` as fixed gzip prefix plus `Gzip(UTF8 JSON(ListExportInfo))`, and its decoded-resource schema points directly to `ListExportInfo`. The earlier fallback wrapped the app data in a legacy object with `AppID`, `MainListType`, `Data`, `ReplaceIds`, `ReportIds`, and `FormKeys`, which the standard schema rejects as additional properties.

The V1.3 schema-direct YAP candidate fixes that schema mismatch:

- Output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap`
- Package type: `.yap`
- Wrapper fields: `Title`, `Description`, `IconUrl`, `IsListSet`, `Resource`
- Decoded `Resource`: direct `ListExportInfo`
- Child lists: 5
- Fields: 59
- Layouts: 16
- `PortalInfo`: omitted because it is optional in `ListExportInfo` and cannot be `null` when present
- Field/list/layout metadata: normalized to the supplied schema types and allowed properties
- Standard schema validation using `/Users/Renger/Downloads/yap-v1-schema_v2.json`: pass, 0 errors
- Yeeflow schema-standard inspector: pass, 0 errors, 0 warnings

The V1.3 schema-direct YAP is now the recommended next manual import candidate. If it still creates a tile but shows `Import failed`, the next blocker is likely inside server-side materialization semantics that are not expressed by the provided JSON schema, and Yeeflow server-side import diagnostics will be needed.

If V1.3 still fails, use the isolation matrix in `docs/studies/vendor-onboarding-import-isolation-matrix.md`. It provides six schema-direct `.yap` packages that add one capability layer at a time, from one data list through five lists, lookups, simple forms, a Data table dashboard, and a Kanban dashboard.

## V1.4 Field Category Type Fix

Product team feedback on `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-export-shape.yapk` identified a concrete materialization issue:

> `Childs[0].Fields[0].Category` must be an int type.

The safe decoded inspection found that the V1.3 export-shape YAPK had 59 fields with `Category` serialized as the string value `List`. The schema-direct YAP candidate already had 59 fields with integer `Category: 0`. Prior generated app resources and normalized field references also use integer `Category: 0`, so `0` is the observed export-compatible default used for generated data-list fields.

Root cause:

- The YAPK install-compatibility normalizer changed field `Category` from the base app package integer value into the string `"List"`.
- Local validators did not previously enforce integer `Field.Category`, so the YAPK passed local checks while still violating server-side import/materialization expectations.

Generator fix:

- `generate-vendor-onboarding-install-compatible-yapk.mjs` now normalizes every field `Category` to an integer before encoding/signing.
- `generate-vendor-onboarding-yap-fallbacks.mjs` now normalizes every schema-direct YAP field `Category` to an integer.
- Missing, null, empty, or legacy `"List"` category values are normalized to the observed export-compatible integer default `0`; numeric strings are converted to integers; invalid non-numeric values fail generation.

Validator hardening:

- `validate-yap-package.js`
- `validate-yapk-package.js`
- `scripts/inspect-yap-schema-standard.mjs`
- `scripts/inspect-yapk-schema-standard.mjs`
- `scripts/validate-standard-package-schema.mjs`

All now report `FIELD_CATEGORY_NOT_INT` when a generated YAP/YAPK field has a missing, string, null, array, object, or otherwise non-integer `Category`.

Regression smoke:

- `scripts/smoke-field-category-validation.mjs` creates temporary synthetic YAP and YAPK wrappers with `Category: "0"` and `Category: 0`.
- The string case is detected as `FIELD_CATEGORY_NOT_INT`.
- The integer case does not trigger `FIELD_CATEGORY_NOT_INT`.

V1.4 local proof:

- YAPK output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk`
- YAP output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`
- YAPK server signing: passed
- YAPK server verification: passed
- YAPK signature shape: 32-byte base64 value
- YAPK Resource: Yeeflow-style Brotli flush-before-dispose compatible; tolerant decode succeeds, strict sync decode still shows the expected `Z_BUF_ERROR`
- Standard YAP schema validation: pass, 0 errors
- Standard YAPK schema validation: pass, 0 errors
- YAP schema-standard inspector: pass, 0 errors, 0 warnings
- YAPK schema-standard inspector: pass, 0 errors, 0 warnings
- YAP package validator: pass with warnings, 0 errors
- YAP graph validator: pass with warnings, 0 errors
- YAP import-readiness suite: pass with warnings, 0 errors
- YAPK package validator: pass, 0 errors
- Category audit: 59 fields checked in each package; all `Category` values are integer `0`; `Childs[0].Fields[0].Category` is integer `0`
- Hard-coded internal tenant URL: none detected

Recommended next manual test:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yapk` first because it directly fixes the product-team-reported YAPK materialization issue.
2. If the YAPK still fails, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-category-fixed.yap`.
3. If both still fail, continue with the import isolation matrix to locate the next server-side materialization blocker.

## YAP V1.4 Product Schema Result Fix

After the V1.3 schema-direct YAP failed, product team feedback stated that the previous YAP structure was completely wrong and supplied a corrected schema:

- Schema used: `/Users/Renger/Downloads/yap-v1-schema.json`
- Wrapper must include: `Title`, `Description`, `IconUrl`, `IsListSet`, `Resource`
- `Resource` must be `[______gizp______] + Gzip(UTF8 JSON(ListExportResult))`
- Decoded `Resource` must be `ListExportResult`, not direct `ListExportInfo`
- `ListExportResult.Data` may be a JSON serialized `ListExportInfo` string or a `ListExportInfo` object
- For export compatibility, generated candidates use `Data` as a JSON serialized `ListExportInfo` string

Root cause:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.3-schema-direct.yap` decoded `Resource` directly to `ListExportInfo`.
- The updated product schema requires a `ListExportResult` wrapper around the `ListExportInfo` payload.
- The older local schema validator accepted the direct shape, so it did not catch the product-side structure issue.

Generator fix:

- `generate-vendor-onboarding-yap-fallbacks.mjs` now writes corrected product-schema YAP candidates with `ListExportResult`.
- The conservative first candidate removes lookup relationships by converting lookup fields to schema-compatible text inputs and clearing lookup rules.
- The second candidate preserves the four vendor lookup relationships for follow-up testing after the no-lookup package proves the base import layer.

Validator hardening:

- `scripts/validate-standard-package-schema.mjs` now defaults YAP validation to `/Users/Renger/Downloads/yap-v1-schema.json`.
- It validates the top-level wrapper, decodes `Resource`, validates decoded `ListExportResult`, parses `Data`, validates `Data` as `ListExportInfo`, and fails direct `ListExportInfo` resources with `YAP_RESOURCE_NOT_LIST_EXPORT_RESULT`.
- `scripts/inspect-yap-schema-standard.mjs` now treats direct `ListExportInfo` resource shape as invalid for wrapped YAP files and reports `YAP_RESOURCE_NOT_LIST_EXPORT_RESULT`.
- `validate-yap-package.js`, `validate-yap-graph.js`, and `scripts/inspect-yap-materialization.mjs` now recognize `wrapped-yap-list-export-result` so product-schema packages are not incorrectly failed for schema-incompatible legacy expectations such as `ListModel.ListType` or nonempty `ReplaceIds`.

Regression smoke:

- Direct `Resource -> ListExportInfo` fails with `YAP_RESOURCE_NOT_LIST_EXPORT_RESULT`.
- `Resource -> ListExportResult` with `Data` as a JSON string is accepted by the standard schema path.
- `Resource -> ListExportResult` with `Data` as an object is accepted where the schema allows it.
- `Defs: null` fails.
- `Layouts: null` fails.
- `FieldName` suffix mismatch fails.
- `Field.Category` as a string fails when present.

YAP V1.4 product-schema local proof:

- No-lookup output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result-no-lookups.yap`
- Lookup output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result.yap`
- Decoded `Resource` shape: `ListExportResult`
- `ListExportResult.Data` shape: JSON string
- `Data` payload shape: `ListExportInfo`
- Child lists: 5
- Fields: 59
- Layouts: 16
- No-lookup candidate lookup fields: 0
- Lookup candidate lookup fields: 4
- Standard schema validation using `/Users/Renger/Downloads/yap-v1-schema.json`: pass, 0 errors for both candidates
- YAP schema-standard inspector: pass, 0 errors, 0 warnings for both candidates
- Package validator: pass with warnings, 0 errors for both candidates
- Graph validator: pass with warnings, 0 errors for both candidates
- Import-readiness suite: pass with warnings, 0 errors for both candidates
- Field category audit: all 59 fields have integer `Category: 0`
- Direct `ListExportInfo` resource shape: absent
- Legacy nested `Resource.Data` envelope inside `ListExportInfo`: absent
- Hard-coded internal tenant URL: none detected

Recommended next manual test for YAP:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result-no-lookups.yap` first.
2. If it imports, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.4-yap-schema-result.yap` to test lookup materialization.
3. Do not return to rich UI generation until the schema-correct base import layer succeeds.

## YAP V1.5 Unique ID Fix

After the V1.4 product-schema YAP still failed import, product team feedback identified a duplicated layout ID:

- Feedback: `layout id 重复了, 7601000000000001063`
- Meaning: `LayoutID` values must be unique for importer materialization.

Root cause:

- Earlier Vendor Onboarding YAP candidates reused Yeeflow-style large numeric IDs above JavaScript's safe integer range.
- During JSON parsing/stringifying, several IDs rounded to repeated values, which collapsed distinct `ListID`, `FieldID`, `LayoutID`, and layout-resource IDs.
- The local validators checked schema shape but did not enforce global uniqueness or safe JSON integer ranges for generated IDs.

Generator fix:

- `generate-vendor-onboarding-yap-fallbacks.mjs` now creates V1.5 YAP candidates with a deterministic safe integer ID allocator.
- Generated IDs are below `Number.MAX_SAFE_INTEGER`.
- `ListID`, `FieldID`, `LayoutID`, and `LayoutInResources[].ID` values are unique in their package domains.
- List view columns are rebuilt after ID allocation so view `FieldID` and `FieldName` references resolve to the regenerated fields.

Validator hardening:

- `scripts/validate-standard-package-schema.mjs` now reports:
  - `DUPLICATE_LAYOUT_ID`
  - `DUPLICATE_LIST_ID`
  - `DUPLICATE_FIELD_ID`
  - `DUPLICATE_RESOURCE_ID`
  - `UNSAFE_INTEGER_ID`
  - `INVALID_ID_TYPE`
- `scripts/inspect-yap-schema-standard.mjs` now performs the same generated YAP ID uniqueness checks.
- `validate-yap-package.js` now hard-errors duplicate generated `LayoutID`, `ListID`, `FieldID`, layout resource IDs, unsafe integer IDs, invalid ID types, and duplicate field indexes.

Regression smoke:

- Two layouts with the same `LayoutID` fail with `DUPLICATE_LAYOUT_ID`.
- Two child lists with the same `ListID` fail with `DUPLICATE_LIST_ID`.
- Two fields with the same `FieldID` fail with `DUPLICATE_FIELD_ID`.
- An integer ID above `Number.MAX_SAFE_INTEGER` fails with `UNSAFE_INTEGER_ID`.
- A unique-ID synthetic YAP passes the uniqueness checks.

YAP V1.5 unique-ID local proof:

- No-lookup output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids-no-lookups.yap`
- Lookup output: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids.yap`
- Decoded `Resource` shape: `ListExportResult`
- `ListExportResult.Data` shape: JSON string
- Child lists: 5
- Fields: 59
- Layouts: 16
- List IDs: 6 unique values, 0 duplicates
- Field IDs: 59 unique values, 0 duplicates
- Layout IDs: 16 unique values, 0 duplicates
- Layout resource IDs: 11 unique values, 0 duplicates
- Specific duplicated product-reported ID `7601000000000001063`: absent
- All emitted IDs are safe JSON integers
- Standard schema validation using `/Users/Renger/Downloads/yap-v1-schema.json`: pass, 0 errors for both candidates
- YAP schema-standard inspector: pass, 0 errors, 0 warnings for both candidates
- Package validator: pass with warnings, 0 errors for both candidates
- Graph validator: pass with warnings, 0 errors for both candidates
- Import-readiness suite: pass with warnings, 0 errors for both candidates
- Field category audit: all 59 fields have integer `Category: 0`
- Hard-coded internal tenant URL: none detected

Recommended next manual test for YAP:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids-no-lookups.yap` first.
2. If it imports, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.5-unique-ids.yap` to test lookup materialization.
3. Keep the V1.4 candidates only as historical failure references; V1.5 is the next recommended retry.

## YAP V1.6 Yeeflow API ID Isolation

After the V1.5 no-lookup package installed successfully and the V1.5 lookup package still failed import, product guidance was to use the Yeeflow admin generate-unique-ids API for generated package IDs, app IDs, list IDs, layout IDs, field IDs, and related app/list/layout structure IDs.

Confirmed runtime input:

- V1.5 no-lookups installed successfully.
- V1.5 no-lookups showed only one blank/minimal dashboard, which is expected for that isolation package because rich UI was intentionally removed.
- V1.5 with lookup relationships still failed import.
- Lookup materialization is therefore the current isolation target.

API use:

- API base URL: `https://api.yeeflow.com/v1`
- Endpoint: `GET /utils/generate/ids`
- Query: `count=<number of ids>`
- Authentication: `apiKey` header loaded from local `.env.local`
- The helper never prints the API key or raw API response.
- API responses observed for this run returned 19-digit numeric IDs as strings. These IDs are larger than JavaScript's safe integer range, so the generator preserves them as strings internally and writes them as raw JSON integer tokens in the YAP payload without converting them through JavaScript `Number`.

Generator update:

- Added `scripts/yeeflow-id-api-utils.mjs` for safe environment loading and batched ID requests.
- `generate-vendor-onboarding-yap-fallbacks.mjs` now uses API-issued IDs for the real import candidates.
- The local deterministic ID allocator remains only as a historical/offline fallback for V1.5 style isolation candidates.
- V1.6 creates separate API ID batches for each candidate so the three generated packages do not reuse the same generated IDs.

Validator hardening:

- `scripts/validate-standard-package-schema.mjs` preserves large raw JSON integer tokens during parsing and accepts them as schema integer values.
- `scripts/inspect-yap-schema-standard.mjs` preserves large raw integer IDs and no longer treats API-issued raw integer tokens as JavaScript unsafe-number failures.
- `validate-yap-package.js` preserves large raw integer IDs, reports `ID_SOURCE_NOT_API` for generated-final packages using the local fallback ID range, and reports `LOOKUP_TARGET_LIST_UNRESOLVED` plus `LOOKUP_FIELD_SCHEMA_UNPROVEN` for lookup diagnostics.
- Regression smoke covers Field.Category typing, ListExportResult resource shape, duplicate IDs, raw large API integer tokens, and local fallback ID detection.

Generated V1.6 candidates:

- No-lookups API-ID candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.6-api-ids-no-lookups.yap`
- Lookup API-ID candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.6-api-ids-with-lookups.yap`
- Simple-dashboard API-ID candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.6-api-ids-simple-dashboard.yap`

V1.6 local validation:

- API IDs requested/received: 246 total, split into three 82-ID batches.
- ID shape: 19-digit numeric strings from the API, emitted as raw JSON integer tokens in YAP Resource/Data text.
- Standard schema validation: pass, 0 errors for all three candidates, using the local product-schema fallback `/Users/Renger/Downloads/yap-schema_v2.json` because `/Users/Renger/Downloads/yap-v1-schema.json` was not present in this session.
- Decoded Resource shape: `ListExportResult` for all three candidates.
- `ListExportResult.Data` shape: JSON string parsed to `ListExportInfo` for all three candidates.
- YAP schema-standard inspector: pass, 0 errors, 0 warnings for all three candidates.
- Package validator: pass with warnings, 0 errors for all three candidates.
- Graph validator: pass with warnings, 0 errors for all three candidates.
- Import-readiness suite: pass with warnings, 0 errors for all three candidates.
- Generated UI quality inspector: pass with warnings for all three candidates; plan/spec warnings are expected because these are import-isolation packages, not the full rich UI package.
- Hard-coded internal tenant URL: none detected.

Lookup diagnostics for the V1.6 lookup candidate:

- Lookup fields: 4.
- Source lists: Vendor Documents, Compliance Reviews, Vendor Tasks, Vendor Activity / History.
- Target list: Vendors.
- Lookup fields use `Type = lookup`, `FieldType = Text`, and display field `Text0`.
- Rule keys present: `appid`, `listsetid`, `listid`, `listfield`, `displayField`.
- Target list references resolve locally.
- Display field references resolve locally.
- Validator warning: `LOOKUP_FIELD_SCHEMA_UNPROVEN`, because this generated lookup structure remains import-experimental until product confirms the correct generated lookup shape.
- Validator warning: `LOOKUP_TARGET_LIST_EMPTY`, because the isolation package does not include sample vendor records.

Recommended next manual test for YAP:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.6-api-ids-no-lookups.yap`.
2. If it imports, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.6-api-ids-with-lookups.yap`.
3. If both import, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.6-api-ids-simple-dashboard.yap`.
4. Do not return to the full rich UI package until the API-ID base layer and lookup layer are proven in Yeeflow import.

## YAP V1.7 Fixed AppID Plus API IDs

After the V1.6 no-lookup candidate still failed application creation, product team clarified:

- Feedback: `那个AppID 不需要生成，这个应该是固定的41。`
- Meaning: `AppID` should not be generated. It should remain fixed at `41`.

Root cause:

- V1.6 treated `AppID` as part of the generate-unique-ids pool.
- The generated YAP therefore used API-issued 19-digit IDs for `Resource.AppID` and `ListModel.AppID`.
- Product team expects generated YAP application/list structures to keep `AppID = 41` and use generated IDs only for package/list/layout/field/resource identity values.

Generator fix:

- `generate-vendor-onboarding-yap-fallbacks.mjs` now sets `AppID = 41` for `ListExportResult.AppID`, root `ListModel.AppID`, child `ListModel.AppID`, field `AppID`, layout `AppID`, navigation metadata, and lookup rules.
- The generate-unique-ids API is still used for root ListID, child ListIDs, FieldIDs, LayoutIDs, and layout resource IDs.
- V1.7 requests 81 API IDs per package candidate instead of 82 because `AppID` is no longer requested.

Validator hardening:

- `validate-yap-package.js` now fails generated-final YAP packages when `Resource.AppID` or any `ListModel.AppID` is not fixed at `41`.
- `scripts/validate-standard-package-schema.mjs` and `scripts/inspect-yap-schema-standard.mjs` also report `LISTMODEL_APPID_NOT_FIXED_41` for generated YAP data where a list model uses a generated AppID.
- Regression smoke now includes a generated-AppID failure case.

Generated V1.7 candidates:

- Fixed-AppID no-lookups candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.7-fixed-appid-api-ids-no-lookups.yap`
- Fixed-AppID lookup candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.7-fixed-appid-api-ids-with-lookups.yap`
- Fixed-AppID simple-dashboard candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.7-fixed-appid-api-ids-simple-dashboard.yap`

V1.7 local validation:

- API IDs requested/received: 243 total, split into three 81-ID batches.
- `Resource.AppID`: `41` for all three candidates.
- Unique AppID values across Resource and ListModels: `41` only.
- Standard schema validation: pass, 0 errors for all three candidates, using the local product-schema fallback `/Users/Renger/Downloads/yap-schema_v2.json` because `/Users/Renger/Downloads/yap-v1-schema.json` was not present in this session.
- Decoded Resource shape: `ListExportResult` for all three candidates.
- `ListExportResult.Data` shape: JSON string parsed to `ListExportInfo` for all three candidates.
- YAP schema-standard inspector: pass, 0 errors, 0 warnings for all three candidates.
- Package validator: pass with warnings, 0 errors for all three candidates.
- Graph validator: pass with warnings, 0 errors for all three candidates.
- Import-readiness suite: pass with warnings, 0 errors for all three candidates.
- Regression smoke: pass, 25 checks.
- Hard-coded internal tenant URL: none detected.

Lookup diagnostics for the V1.7 lookup candidate:

- Lookup fields: 4.
- Source lists: Vendor Documents, Compliance Reviews, Vendor Tasks, Vendor Activity / History.
- Target list: Vendors.
- Lookup fields use `Type = lookup`, `FieldType = Text`, and display field `Text0`.
- Rule keys present: `appid`, `listsetid`, `listid`, `listfield`, `displayField`.
- Lookup rule `appid` is fixed at `41`.
- Target list references resolve locally.
- Display field references resolve locally.
- Validator warning: `LOOKUP_FIELD_SCHEMA_UNPROVEN`, because this generated lookup structure remains import-experimental until product confirms the correct generated lookup shape.
- Validator warning: `LOOKUP_TARGET_LIST_EMPTY`, because the isolation package does not include sample vendor records.

Recommended next manual test for YAP:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.7-fixed-appid-api-ids-no-lookups.yap`.
2. If it imports, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.7-fixed-appid-api-ids-with-lookups.yap`.
3. If both import, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.7-fixed-appid-api-ids-simple-dashboard.yap`.
4. Keep V1.6 only as the historical failure reference for generated AppID.

## YAP V1.8 ReplaceIds Collection Fix

After the V1.7 no-lookup candidate still failed application creation, product team clarified:

- Feedback: `这个ReplaceIds 要把所有生成id的收集到这里。FormKeys 是所有的流程Key`
- Meaning: `ReplaceIds` must collect all generated IDs. `FormKeys` must contain all process/workflow keys.

Root cause:

- V1.7 fixed `AppID = 41` but still wrote `ReplaceIds: []`.
- The importer expects the generated IDs used inside the ListExportResult/ListExportInfo payload to be listed in `ReplaceIds` so it can remap them during app creation.
- These isolation packages do not contain process forms or workflows, so `FormKeys` should remain `[]`.

Generator fix:

- `writeSchemaResultYap()` now calls `collectGeneratedReplaceIds(data)` and writes all generated IDs into `ReplaceIds`.
- The collector includes generated ListIDs, FieldIDs, LayoutIDs, layout resource IDs/RefIds, public form IDs, reminder/workflow mapping IDs, sample row IDs if present, and app metadata/group/tag/theme/component IDs if present.
- The collector excludes fixed/system values such as `AppID = 41`, `TenantID = 0`, status values, user IDs, and field indexes.
- `writeSchemaResultYap()` now calls `collectFormKeys(data)` for `FormKeys`; the V1.8 isolation candidates have no process forms, so `FormKeys` is empty.

Validator hardening:

- `validate-yap-package.js` now treats layout resource IDs and RefIds as generated IDs that must be covered by `ReplaceIds`.
- The previous root-page warning that separate page resource IDs should not be in `ReplaceIds` was removed because product guidance is now to collect all generated IDs.

Generated V1.8 candidates:

- ReplaceIds-fixed no-lookups candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.8-replaceids-fixed-no-lookups.yap`
- ReplaceIds-fixed lookup candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.8-replaceids-fixed-with-lookups.yap`
- ReplaceIds-fixed simple-dashboard candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.8-replaceids-fixed-simple-dashboard.yap`

V1.8 local validation:

- `Resource.AppID`: `41` for all three candidates.
- Unique AppID values across Resource and ListModels: `41` only.
- API IDs requested/received: 243 total, split into three 81-ID batches.
- `ReplaceIds`: 81 IDs for each candidate.
- `FormKeys`: 0 keys for each candidate, expected because the candidates include no process forms.
- Standard schema validation: pass, 0 errors for all three candidates.
- YAP schema-standard inspector: pass, 0 errors, 0 warnings for all three candidates.
- Package validator: pass with warnings, 0 errors for all three candidates.
- ReplaceIds coverage warnings/errors: none.
- Graph validator: pass with warnings, 0 errors for all three candidates.
- Import-readiness suite: pass with warnings, 0 errors for all three candidates.
- Regression smoke: pass, 25 checks.

Recommended next manual test for YAP:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.8-replaceids-fixed-no-lookups.yap`.
2. If it imports, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.8-replaceids-fixed-with-lookups.yap`.
3. If both import, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.8-replaceids-fixed-simple-dashboard.yap`.
4. Keep V1.7 only as the historical failure reference for empty `ReplaceIds`.

## YAP V1.9 ListSite CustomType Fix

After the V1.8 no-lookup candidate still failed application creation, product team identified another generated-ID mismatch:

- Feedback: `ListSite_这里的Id没有换成 生成的应用id`
- Meaning: child `ListModel.CustomType` values such as `ListSite_<id>` must use the generated application/ListSet ID, not an old source ID.

Root cause:

- The generator normalized `ListModel.CustomType` from the source payload and then replaced `ListID`, `FieldID`, and `LayoutID` values.
- It did not rewrite child `CustomType` after assigning the generated root ListSet ID.
- The importer therefore saw child lists whose `CustomType` still pointed to the old source app/list-set identity.

Generator fix:

- Root `ListModel.CustomType` is now forced to an empty string.
- Every child list `ListModel.CustomType` is now set to `ListSite_<generated root ListID>`.
- This applies to both local safe-ID candidates and API-ID candidates, although the recommended path remains API-ID candidates.

Validator hardening:

- `validate-yap-package.js` now fails generated-final YAP packages if root `CustomType` is not empty.
- It also fails generated-final YAP packages if a child list `CustomType` does not exactly match `ListSite_<root ListID>`.

Generated V1.9 candidates:

- CustomType-fixed no-lookups candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-no-lookups.yap`
- CustomType-fixed lookup candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-with-lookups.yap`
- CustomType-fixed simple-dashboard candidate: `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-simple-dashboard.yap`

V1.9 local validation:

- `Resource.AppID`: `41` for all three candidates.
- Root `ListModel.CustomType`: empty string.
- Child `ListModel.CustomType`: `ListSite_<generated root ListID>` for all child lists.
- `ReplaceIds`: 81 IDs for each candidate.
- `FormKeys`: 0 keys for each candidate, expected because the candidates include no process forms.
- Standard schema validation: pass, 0 errors for all three candidates.
- YAP schema-standard inspector: pass, 0 errors, 0 warnings for all three candidates.
- Package validator: pass with warnings, 0 errors for all three candidates.
- CustomType warnings/errors: none.
- ReplaceIds coverage warnings/errors: none.
- Graph validator: pass with warnings, 0 errors for all three candidates.
- Import-readiness suite: pass with warnings, 0 errors for all three candidates.
- Regression smoke: pass, 25 checks.

Recommended next manual test for YAP:

1. Try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-no-lookups.yap`.
2. If it imports, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-with-lookups.yap`.
3. If both import, try `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.9-customtype-fixed-simple-dashboard.yap`.
4. Keep V1.8 only as the historical failure reference for stale `ListSite_` custom type IDs.

## YAP V1.10 Current Dashboard Shell Study

After the V1.9 generated YAP files imported successfully, the generated `Home` dashboard still appeared to use an older dashboard shell. The user manually added a current-version dashboard named `New Dashboard` and exported the updated app as:

- `/Users/Renger/Downloads/Vendor Onboarding & Compliance Managementv1.93.yap`

The raw export is not committed. The normalized findings are stored under:

- `docs/studies/normalized/vendor-onboarding-dashboard-version/`

### Dashboard learning

- Old generated `Home` dashboard:
  - root `Item.Layouts[]` entry
  - `Type = 103`
  - `LayoutView = ""`
  - `Ext2 = ""`
  - `LayoutInResources` null or missing after export
- User-created current `New Dashboard`:
  - root `Item.Layouts[]` entry
  - `Type = 103`
  - `LayoutView = null`
  - `Ext2 = "{\"src\":true}"`
  - `LayoutInResources = []`

### Generator fix

The Vendor Onboarding YAP generator now emits the current-dashboard shell for generated root dashboard pages:

- `LayoutView: null`
- `Ext2: "{\"src\":true}"`
- `LayoutInResources: []`

The candidate generated from this learning is:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.10-current-dashboard.yap`

### Validator hardening

`validate-yap-package.js` now reports generated-final dashboard shell issues with:

- `DASHBOARD_USES_LEGACY_SCHEMA`
- `DASHBOARD_CURRENT_VERSION_MARKER_MISSING`

The existing `ROOT_APP_PAGE_RESOURCE_MISSING` gate still applies when an empty dashboard shell does not match the export-proven current pattern.

`scripts/inspect-yap-materialization.mjs` and `scripts/inspect-generated-ui-quality.mjs` now recognize the export-proven current blank dashboard shell so a current empty dashboard is not incorrectly failed as a missing legacy inline page resource.

Strict JSON-schema validation still reports one mismatch for V1.10: `Item.Layouts[0].LayoutView` is `null` while the supplied schema declares it as `string`. The user-edited v1.93 export has the same current-dashboard `LayoutView: null` shape, so this is recorded as schema/export drift rather than a blocker in the package-specific validators.

### Manual test recommendation

Import `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.10-current-dashboard.yap` and verify that `Home` uses the new/current dashboard version. This candidate intentionally uses the current blank dashboard shell rather than a rich inline dashboard resource, because the v1.93 export proves the current shell but does not yet prove current-dashboard rich control storage.

## YAP V1.11 Current Dashboard With Simple Content

The V1.10 package imported successfully and proved that generated `Home` can use the current dashboard version. It was intentionally blank because the v1.93 export proved the current shell but not rich current-dashboard content.

The previous simple-dashboard candidate contained:

- a padded `Content` container
- a `Vendor Management Dashboard` heading
- one `Data table` control bound to the `Vendors` list
- six configured columns: `Vendor Name`, `Vendor Type`, `Country / Region`, `Primary Contact`, `Email`, and `Phone`

V1.11 adds that same simple dashboard function back onto the current dashboard shell:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.11-current-dashboard-data-table.yap`

This is a focused test to determine whether the current dashboard version can still accept inline `LayoutInResources` page content. If it imports and renders, the next step is to progressively add richer dashboard controls. If it imports but renders blank or fails, export a current-version dashboard with one manually added Text/Data table control so the exact current content storage pattern can be learned.

V1.11 imported and opened the new dashboard version, but the Data table rendered:

- `Field(s) ,,,,, have been deleted. Please check the query configuration.`

Diagnosis:

- The Data table sidebar showed the intended labels: `Vendor Name`, `Vendor Type`, `Country / Region`, `Primary Contact`, `Email`, and `Phone`.
- The generated column entries used `FieldName` for the internal source field and omitted the export-proven `Field` binding.
- Runtime-proven dashboard Data table exports use `attrs.listarr[].Field` for the query field and `attrs.listarr[].FieldName` for the visible column label.
- The missing `Field` values explain the empty field names in the runtime error text.

V1.12 fixes the Data table column binding shape:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.12-current-dashboard-data-table-fields-fixed.yap`
- Home dashboard keeps the current dashboard shell: `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and one inline page resource.
- The Vendors Data table uses `attrs.data.list` with `AppID`, `ListID`, `Type`, `Title`, and `ListSetID`.
- The six table columns use `Field` bindings: `Text0`, `Text1`, `Text2`, `Text3`, `Text4`, and `Text5`.
- The visible labels remain `Vendor Name`, `Vendor Type`, `Country / Region`, `Primary Contact`, `Email`, and `Phone`.

Runtime result:

- User confirmed the V1.12 YAP imported successfully.
- User confirmed `Home` uses the new/current dashboard version.
- User confirmed the Data table no longer shows the deleted-fields/query-configuration error after using `Field` for the real source field names and `FieldName` for labels.
- This upgrades the focused Vendor Onboarding V1.12 package from local-validation-only to import-proven and current-dashboard/Data-table-binding runtime-confirmed for this package.

Validator hardening:

- `validate-yap-package.js` and `scripts/inspect-generated-ui-quality.mjs` now flag generated dashboard Data table columns that omit the export-proven `Field` binding.
- Synthetic regression test: removing `Field` from the six generated columns fails with `DASHBOARD_DATA_TABLE_DISPLAY_FIELD_BINDING_MISSING`.

Validation:

- Product-team YAP schema standard inspector: pass.
- Package validator: pass with warnings only.
- Materialization inspector: pass with one expected `NO_FORMS` warning.
- Aggregate import-readiness: pass with warnings only; generated UI quality step passes with zero errors and zero warnings.
- Strict historical schema validator still reports `Item.Layouts[0].LayoutView` as `null` instead of string, but this is the export-proven current-dashboard shell shape from the imported v1.10/v1.11 candidates.

## Signing And Verification

The generator uses the standard Yeeflow API base URL behavior through `scripts/yeeflow-env-utils.mjs`.

- API base URL used by the generator environment helper: `https://api.yeeflow.com/v1`
- V1 server signing status: skipped because no local `YEEFLOW_API_KEY` was configured during the first generation pass
- V1 local placeholder signature shape: 32-byte base64 value
- V1.1 server signing status: `signed_and_verified`
- V1.1 server signature shape: 32-byte base64 value
- V1.1 `verifysign` status: HTTP 200
- V1.2 server signing status: `signed_and_verified`
- V1.2 server signature shape: 32-byte base64 value
- V1.2 `verifysign` status: passed
- V1.3 server signing status: `signed_and_verified`
- V1.3 server signature shape: 32-byte base64 value
- V1.3 `verifysign` status: passed
- V1.4 server signing status: `signed_and_verified`
- V1.4 server signature shape: 32-byte base64 value
- V1.4 `verifysign` status: passed
- V1.13 YAPK schema v2 server signing status: `signed_and_verified`
- V1.13 YAPK schema v2 server signature shape: 32-byte base64 value
- V1.13 YAPK schema v2 `verifysign` status: HTTP 200
- V1.14 YAPK PortalInfo fix server signing status: `signed_and_verified`
- V1.14 YAPK PortalInfo fix server signature shape: 32-byte base64 value
- V1.14 YAPK PortalInfo fix `verifysign` status: HTTP 200

The V1 package remains the locally validated baseline. The V1.1 package proved signing and verification but failed package install. The V1.2 package proved wrapper/upload acceptance but failed materialization. The V1.3 package preserved the accepted wrapper pattern and restored export-like metadata but still failed materialization. The V1.4 YAPK package fixes the product-team-reported `Field.Category` integer typing issue. The full `.yap` fallback also reached the import dialog but failed create. The `.yap` V1.4 schema-direct package fixed category typing but still used the now-rejected direct `ListExportInfo` resource shape. The `.yap` V1.4 product-schema result packages fixed the wrapper shape but still had duplicate/unsafe IDs. The `.yap` V1.5 no-lookup package imported but used locally generated IDs and intentionally minimal UI. The `.yap` V1.6 API-ID package still failed because it incorrectly generated AppID. The `.yap` V1.7 fixed-AppID package still failed because `ReplaceIds` was empty. The `.yap` V1.8 ReplaceIds-fixed package still failed because child `ListSite_` custom type IDs pointed to the old source app/list-set. The `.yap` V1.9 CustomType-fixed product-schema result packages imported successfully but exposed that `Home` still used an older dashboard shell. The `.yap` V1.10 current-dashboard candidate applies the export-proven current dashboard shell learned from the user-created `New Dashboard`. The `.yap` V1.11 current-dashboard-data-table candidate adds the previous simple Home content back to the current shell but its table query field bindings were incomplete. The `.yap` V1.12 current-dashboard-data-table-fields-fixed candidate corrects the table binding shape with export-proven `Field` values.

## YAPK Schema V2 Candidate

Product-team schema v2 changes the YAPK source of truth from the earlier YAP-style experiments:

- Top-level YAPK is `AppExportPackageInfo`.
- `Resource` is `base64(Brotli(JSON.stringify(AppPackageInfo)))`.
- Decoded `Resource` must be `AppPackageInfo`, not YAP `ListExportResult` or direct `ListExportInfo`.
- `AppPackageInfo.Childs[]` uses `Fields`, not YAP `Defs`.
- `LongAsString` wrapper/layout fields remain numeric strings.
- App-content integer IDs are emitted as raw JSON integer tokens without JavaScript rounding.

New candidate:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.13-yapk-schema-v2.yapk`
- Source content: the import-proven V1.12 YAP app content.
- Scope: five child data lists, current-version Home dashboard, and the fixed Vendors Data table binding.
- AppID: fixed `41`.
- PackageId: generated with Yeeflow `generate-unique-ids` API.
- Existing list, field, layout, and resource IDs: preserved from the import-proven V1.12 API-issued IDs.
- YAPK wrapper `TenantID` and `ListID`: emitted as `LongAsString` strings.
- Dashboard Data table: preserves `attrs.data.list` keys `AppID`, `ListID`, `Type`, `Title`, and `ListSetID`; each visible column includes `Field` source binding and `FieldName` label.
- Current dashboard shell: schema-compatible YAPK layout with `Type = 103`, `Ext2 = "{\"src\":true}"`, and inline `LayoutInResources` content. Because YAPK schema v2 requires `LayoutView` to be a string, the generator emits an empty string for `LayoutView` in YAPK while preserving the current-dashboard marker in `Ext2` and page resources.

Old V1.4 YAPK failure summary against schema v2:

- Decoded to an `AppPackageInfo`-like shape but failed schema v2 with nulls where strings/arrays/objects were required.
- Some dashboard Data table columns omitted the `Field` source binding, the same issue later proven by the V1.11/V1.12 YAP runtime test.
- It predated the final YAPK v2 `LongAsString`, schema-required arrays, and current dashboard Data table validation rules.

V1.13 validation:

- Product-team YAPK schema v2 standard validator: pass.
- Decoded Resource shape: `AppPackageInfo`.
- `Childs` shape: uses `Fields`, not `Defs`.
- `ListSet`: present.
- `Pages`: present with Home dashboard.
- `Childs`: five data lists, 59 fields, and 15 child layouts.
- YAPK inspector: pass.
- YAPK package validator: pass with one expected proof-boundary warning.
- Generated UI quality inspector: pass with one dashboard Data table and zero findings.
- Regression smoke: pass for YAP-style Resource rejection, missing Childs arrays, `Defs` instead of `Fields`, numeric `TenantID`, non-41 `AppID`, missing Data table `Field`, duplicate `LayoutID`, and invalid integer ID type.
- Signing: `setsign` returned a 32-byte signature and `verifysign` returned HTTP 200.

## YAPK V1.14 PortalInfo Import Fix

Product-team feedback after V1.13 install failure:

- If no portal is included, `PortalInfo` must be `[]`.
- `PortalInfo: {}` is not accepted by import/materialization for this no-portal package.

New candidate:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.14-yapk-portalinfo-array.yapk`
- Scope remains the V1.13 conservative YAPK schema v2 package: five child data lists, current-version Home dashboard, and fixed Vendors Data table binding.
- Only the no-portal shape was changed from `PortalInfo: {}` to `PortalInfo: []`.
- The package remains server-signed and verified.

V1.14 validation:

- Product-team YAPK schema v2 standard validator: pass with product-import PortalInfo override.
- Decoded Resource shape: `AppPackageInfo`.
- `PortalInfo`: empty array.
- YAPK inspector: pass.
- YAPK package validator: pass with one expected proof-boundary warning.
- Generated UI quality inspector: pass.
- Regression smoke: pass, including `PortalInfo: {}` failing with `YAPK_PORTALINFO_EMPTY_OBJECT_INVALID`.
- Signing: `setsign` returned a 32-byte signature and `verifysign` returned HTTP 200.

## YAPK V1.15 PortalInfo Null Correction

Product-team correction after V1.14 install failure:

- If no portal is included, `PortalInfo` must be `null`.
- `PortalInfo: []` and `PortalInfo: {}` are not accepted for this no-portal package.

New candidate:

- `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.15-yapk-portalinfo-null.yapk`
- Scope remains the conservative YAPK schema v2 package from the V1.12 import-proven YAP content: five child data lists, current-version Home dashboard, and fixed Vendors Data table binding.
- Only the no-portal shape was changed from `PortalInfo: []` to `PortalInfo: null`.
- The package remains server-signed and verified.

V1.15 validation:

- Product-team YAPK schema v2 standard validator: pass with product-import PortalInfo null normalization for schema validation.
- Decoded Resource shape: `AppPackageInfo`.
- `PortalInfo`: `null`.
- YAPK inspector: pass.
- YAPK package validator: pass with one expected proof-boundary warning.
- Generated UI quality inspector: pass.
- Regression smoke: pass, including `PortalInfo: {}` failing with `YAPK_PORTALINFO_EMPTY_OBJECT_INVALID` and `PortalInfo: []` failing with `YAPK_PORTALINFO_ARRAY_INVALID`.
- Signing: `setsign` returned a 32-byte signature and `verifysign` returned HTTP 200.
- Runtime install proof: user confirmed the V1.15 YAPK installed successfully in Yeeflow.

## Known Gaps

- No complete end-to-end live Yeeflow runtime proof has been performed yet.
- No runtime page-open proof has been performed yet.
- V1.2 reached application-tile creation but failed materialization.
- V1.3 reached the same materialization-failure state.
- V1.4 has not yet been manually import-tested after the field `Category` typing fix.
- The YAP V1.4 product-schema result candidates have not yet been manually import-tested after the corrected `ListExportResult` wrapper fix.
- The YAP V1.5 no-lookup product-schema result candidate imported, but it was intentionally minimal and used local generated IDs rather than product API-issued IDs.
- The YAP V1.5 lookup product-schema result candidate failed import, so lookup shape remains the active isolation target.
- The YAP V1.6 API-ID product-schema result candidates failed because `AppID` was generated instead of fixed at `41`.
- The YAP V1.7 fixed-AppID plus API-ID product-schema result candidates failed because `ReplaceIds` was empty.
- The YAP V1.8 ReplaceIds-fixed product-schema result candidates failed because child `CustomType` values still used stale `ListSite_` IDs.
- The YAP V1.9 CustomType-fixed product-schema result candidates imported successfully after applying the product-team ListSite correction.
- The YAP V1.12 current-dashboard Data table field-binding fix imported successfully and fixed the current-dashboard Data table query error.
- The full `.yap` fallback reached the import dialog but failed create.
- The `.yap` V1.3 schema-direct package must be manually import-tested before being treated as import-proven.
- The YAPK V1.13 schema v2 package is server-signed, verified, schema-valid, and locally content-validated, but has not yet been manually install/runtime tested.
- The YAPK V1.14 PortalInfo array package failed manual install and is superseded by the V1.15 PortalInfo null correction.
- The YAPK V1.15 PortalInfo null package is server-signed, verified, schema-v2/product-rule validated, locally content-validated, and user-confirmed to install successfully. App open, dashboard render, child-list inspection, record creation, workflow/action execution, and full UI runtime behavior remain untested.
- Collection/Kanban action steps are safe local placeholders and should be connected to tenant-specific workflows after import if needed.
- Advanced controls such as Document embed, QR Code, Barcode, timeline, and print layout require runtime visual confirmation.
- Custom CSS polish is represented as layout/style intent in generated controls; final visual polish must be checked in Yeeflow after import.

## Proof Boundary

This branch proves that a full-scope Vendor Onboarding & Compliance Management app candidate can be generated from the approved UI implementation spec and pass local structural, graph, UI-quality, schema, wrapper round-trip, and import-readiness checks with no blocking errors. It also proves that the product-team-reported `Field.Category` integer typing issue is fixed in both generated YAPK and YAP candidates, and that local validators now catch the regression. After product corrected the YAP schema, this branch also proves the generated YAP now decodes `Resource` to `ListExportResult`, with `Data` parsed and validated as `ListExportInfo`. After product identified a duplicate `LayoutID`, this branch proves local validators catch duplicate/unsafe ID regressions. After product recommended the generate-unique-ids API, this branch proves generated YAP candidates can use API-issued IDs while preserving 19-digit raw integer tokens without JavaScript rounding. After product clarified AppID handling, this branch proves generated YAP candidates keep `AppID = 41` and use API-issued IDs only for list/field/layout/resource identities. After product clarified ReplaceIds/FormKeys handling, this branch proves generated YAP candidates collect all generated IDs into `ReplaceIds` and keep `FormKeys` empty when no process forms exist. After product clarified ListSite CustomType handling, this branch proves V1.9 generated YAP candidates set child `CustomType` to `ListSite_<generated root ListID>`. The V1.12 generated YAP is user-confirmed import-proven; it opens with the current dashboard version and fixes the Data table query error by using `attrs.listarr[].Field` for source bindings and `attrs.listarr[].FieldName` for labels. The V1.13 YAPK candidate proves the product-team schema v2 wrapper/resource shape locally: `AppExportPackageInfo` with `Resource` as Brotli-compressed `AppPackageInfo`, `Childs[].Fields`, schema-v2 required arrays, `LongAsString` strings, fixed `AppID = 41`, server signing, and `verifysign`. The V1.14 YAPK candidate applied the superseded product-team feedback that no-portal packages should emit `PortalInfo: []`; manual install showed that was still wrong. The V1.15 YAPK candidate applies the corrected product-team rule that no-portal packages must emit `PortalInfo: null`, while validators reject both `{}` and `[]`; the user confirmed this V1.15 YAPK installed successfully in Yeeflow. The `.yapk` variants before V1.4 showed that signing, wrapper acceptance, API-issued IDs, and export-like metadata were still not enough for Yeeflow version-package materialization. Earlier `.yap` fallbacks showed that direct app import can still fail when the resource shape is wrong, IDs are unsafe/duplicated, AppID is incorrectly generated, ReplaceIds is empty, CustomType points to stale IDs, lookup shape is not importer-compatible, or dashboard Data table `Field` bindings are missing.

It does not prove full rich UI runtime behavior, lookup runtime behavior, workflow execution, record creation, action execution, or end-user process behavior. Those require additional focused manual runtime proof in a Yeeflow tenant.

## Manual Test Checklist

1. Import `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.12-current-dashboard-data-table-fields-fixed.yap`.
2. Open the Vendor Management Dashboard.
3. Confirm the Home page uses the current/new dashboard version.
4. Verify the Vendors Data table no longer shows `Field(s) ,,,,, have been deleted`.
5. Verify the Data table settings show six display fields and the canvas renders the table area without query-configuration errors.
6. If V1.12 fails, manually fix the Data table in Yeeflow, publish/save, export the app, and provide the export so the exact current-dashboard Data table binding shape can be compared.
7. V1.15 YAPK install proof is complete for `/Users/Renger/Downloads/vendor-onboarding-compliance-management.v1.15-yapk-portalinfo-null.yapk`.
8. Next, open the installed app and confirm no install/materialization error remains.
9. Confirm the Home dashboard opens.
10. Verify the Vendors Data table no longer shows `Field(s) ,,,,, have been deleted`.
11. Verify child lists exist for Vendors, Vendor Documents, Compliance Reviews, Vendor Tasks, and Vendor Activity / History.
12. Check dashboard padding, cards, KPI layout, alert, and quick links.
13. Verify dashboard Data tables show configured columns.
14. Verify Kanban cards show meaningful vendor fields if the richer dashboard scope is enabled in a later package.
15. Open the Vendor Detail View Page.
16. Verify tabs, steps bar, progress controls, document embed area, compliance cards, task cards, and timeline.
17. Open the New Vendor Request Form.
18. Verify padded sections, toggle section, Dynamic Sub List, file/document fields, and form actions.
19. Open the Compliance Review Workspace.
20. Verify Kanban, collection cards, risk score, alert, bulk toolbar pattern, and missing/expired document table.
21. Open the Vendor Print Page.
22. Verify print layout, divider spacing, approval timeline, document checklist, QR Code, and Barcode.
23. Connect placeholder collection/workflow actions to tenant-specific workflows if needed.
20. Record the live import/runtime result before treating this as runtime-proven.
