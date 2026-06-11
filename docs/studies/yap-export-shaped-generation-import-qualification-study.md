# YAP Export-Shaped Generation Import Qualification Study

## Summary

Research v0.6.10 generated `service-desk-v0.6.10-research-final-smoke.yap`. Local checks reported no hard YAP/form-workspace errors and the API accepted/queued the import with HTTP 200, API status 0, and `Completed=false`. That was not final proof. Later materialization failed, and the reporting path did not adequately prove final-package `Resource.ReplaceIds` or export-shaped completeness.

The successful comparison package was `Service Desk Pro Workspace Broad YAP Test v3.yap`; a sample-derived v4 candidate also imported successfully. This study uses redacted structural summaries only. It does not include raw decoded `Resource`, raw `DefResource`, private IDs, private URLs, tenant/workspace/user IDs, raw API responses, or customer/business data.

## Structural Comparison

| Area | Failed generated YAP | Successful sample/export-derived YAP | Required generation rule |
|---|---|---|---|
| `Resource.ReplaceIds` | Report path was insufficient; local artifact review showed the coverage check could miss empty/incomplete state. | Non-empty and broader final-package coverage. | Rebuild from final decoded package and fail empty/incomplete coverage. |
| Local ID shape | Short synthetic numeric IDs in app/list/page/workflow areas. | Long numeric-string local resource IDs. | Use export-style long numeric-string IDs for generated resources. |
| Page/workflow ID shape | Numeric pageurl/childshape IDs. | String pageurl and workflow shape IDs. | Preserve export-observed string shape for `pageurls` and `childshapes`. |
| Root metadata | Thin root model with missing export fields such as `Ext1`/`Ext2`/`Ext3` and richer audit/list metadata. | Full root export metadata including app, table/index, audit, permission, and extension fields. | Generate full export-style root ListModel. |
| Child list metadata | Sparse list models. | Full child list models with export-like metadata. | Generate full list metadata, not title/list/type-only skeletons. |
| Field metadata | Locally plausible but not contract-bound. | Export-style fields with complete IDs, names, type, category, status/system/index, and stringified rules. | Enforce field metadata completeness and stringified `Rules`. |
| Layout/default views | Default views existed but metadata completeness was not contract-bound. | Export-shaped Type 0 default views with `Ext1.Url` and field-resolving layout/query metadata. | Enforce import-ready default view metadata. |
| `ListDatas` | Validator/reporting path could accept weak shapes. | Record-ID-keyed sample rows. | Require keyed `ListDatas`; reject arrays or `Datas` wrappers. |
| Approval DefResource | Basic materialization pieces existed. | Export-style process metadata plus designer/workflow metadata. | Require full DefResource metadata, pageurls, variables, graph metadata, and childshapes. |
| App-level fields | Some arrays existed; contract did not require all expected structures. | App-level structures preserved, including null/empty structures. | Include `SimplePortal`, `PortalInfo`, app arrays, reports, and groups. |
| Proof language | API queued was treated too optimistically. | Runtime proof was separated from local/API acceptance. | API accepted/queued is not async import success. |

## Root Cause

The old local validation path focused on schema and specific materialization rules. It did not provide a dedicated generated-final contract for export-shaped completeness, final-package ID coverage, runtime-critical string parsing, proof-boundary reporting, and ID type shape by location.

## Schema Vs Generation Contract

`schemas/yap-schema.json` remains the base structural schema. It should not be overloaded with every runtime/import rule. Generated-final validation now requires the schema plus the YAP generation contract and import-qualification validators.

## Validation Gaps Closed

- Added generated-final hard checks for export-shaped metadata completeness.
- Added hard checks for long numeric-string local IDs and string pageurl/childshape IDs.
- Added explicit `YAP_REPLACEIDS_EMPTY` and `YAP_REPLACEIDS_FINAL_COVERAGE_INCOMPLETE`.
- Added contract docs and a machine-readable contract companion.
- Added a sanitized reference shape for first-time generation without user samples.
- Added `scripts/test-yap-export-shaped-generation-standard.mjs` with passing and failing sanitized fixtures.

## Native Title Policy

Native `Title` is runtime-safe and should remain `FieldName: "Title"` and `InternalName: "Title"` with native/system metadata. `YAP_NATIVE_TITLE_SCHEMA_CONFLICT` is warning-only; do not replace native Title with artificial generated storage names.

## Proof Boundary

Use distinct proof levels: local validation passed, API accepted/queued, async import completed, app opened, form designer hydrated, and workflow designer hydrated. Do not call API status 0 with `Completed=false` import success.
