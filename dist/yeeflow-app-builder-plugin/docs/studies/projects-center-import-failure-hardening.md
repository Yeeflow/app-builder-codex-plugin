# Projects Center Import Failure Hardening

## Context

`Projects Center_2` is a Yeeflow project workspace application generated from `Projects Center_2 - Functional Specification.docx` using the Yeeflow App Builder Plugin v0.5.15 workflow. The app contains project, task, issue, milestone, project-group, document-library, dashboard/page, and report-output resources. It has no approval form or workflow.

The first delivered package, `projects-center-2.v1.yap`, passed local validation with warnings but failed Yeeflow import. After a focused repair pass, the package at the same path passed strict local checks and the user confirmed the fixed package imports successfully.

Raw `.yap` packages and decoded payloads are not committed in this study. The evidence used here is the repair summary, verification notes, and local validator output.

## Why Initial Validation Was Insufficient

The initial handoff relied on compatibility validation. Compatibility mode is useful for studying historical exports because older exports can contain legacy page/control/view shapes that should not be promoted into generator rules. It is not sufficient for newly generated `.yap` packages.

For newly generated applications, the final handoff gate must use strict generator/import-readiness validation. `pass_with_warnings` is acceptable only when each warning family is explicitly classified as non-import-blocking, such as export-derived custom-control runtime classifications or document-library runtime behavior warnings. Structural generator findings must be hard errors before handoff.

## Real Import Failure Signal

The meaningful runtime signal was user-reported Yeeflow import failure for the initial package, followed by user-confirmed import success after the repaired package was generated. This upgrades only the repaired Projects Center package import result. It does not prove broad app use, data entry, dashboard interaction, document upload behavior, scheduled report execution, or workflow behavior.

## Root Cause Categories

- Compatibility validation is not enough for newly generated packages.
- Newly generated apps must pass strict generator/import-readiness checks before handoff.
- `pass_with_warnings` is acceptable only when warnings are explicitly classified as non-import-blocking.
- Structural generator errors must be hard errors, not warnings.
- The original workflow had the necessary validator knowledge nearby but did not force the strict final gate before handing off the `.yap`.

## Exact Repairs Applied

- Added missing `ListModel.ListType = 1` on Type `1` data lists.
- Normalized native `Title` field metadata to `Status = 0`, `IsSystem = true`, `IsIndex = true`, and `FieldIndex = 0`.
- Removed invalid list-view columns that referenced unresolved system pseudo-fields or missing fields.
- Added missing list-view `sort`, `rowColor`, and `filter` arrays.
- Normalized all custom page/form/dashboard `LayoutInResources[].ID` and `RefId` values to their owning `LayoutID`.
- Normalized dashboard dynamic-display `controlId` references.
- Removed dashboard collection filters that referenced unresolved `ListDataID` context fields.
- Excluded tenant/user metadata IDs such as `TenantID`, `CreatedBy`, and `ModifiedBy` from `Resource.ReplaceIds`.

## Why Each Repair Matters

`ListType` tells Yeeflow the generated child resource is a normal data list. A missing value can leave import/materialization without the list type metadata expected by downstream list and query APIs.

Native `Title` metadata is special. Export-native cloned metadata such as `Status = 1` or `FieldIndex = 1` can look valid in a decoded package but is unsafe for generated imports. Generated data lists need the import-safe native `Title` shape so list materialization and data query APIs can attach fields correctly.

Data-view columns must resolve to fields that exist on the list, or to explicitly supported system fields in contexts where system fields are allowed. Invalid columns such as unresolved `ListDataID`, `CreatedBy`, `Created`, `ModifiedBy`, `Modified`, or stale copied field IDs can make list views fail or block import.

`LayoutInResources` IDs bind the stored page/form resource to the owning layout. Mismatched `ID` or `RefId` values can produce pages or custom forms that fail materialization even when the JSON payload parses.

Dashboard dynamic display rules and filters must reference resolvable controls and fields. Stale copied `controlId` values or `__ctx_coll` expressions for fields absent from the collection source list are structural defects in generated packages.

`ReplaceIds` should remap generated app resources, not tenant or user metadata. Including `TenantID`, `CreatedBy`, or `ModifiedBy` can cause import to rewrite baseline metadata and is unsafe.

## Validator And Workflow Rules Added

- `validate-yap-package.js` treats missing or invalid `ListModel.ListType` as a generated-final import-readiness error.
- `validate-yap-package.js` keeps import-safe native `Title` metadata as a generated-final hard error and clarifies why it matters for import/materialization.
- `validate-yap-graph.js` now also checks `Title.FieldIndex = 0` in strict generator mode.
- `scripts/inspect-yap-materialization.mjs` checks Type `1` list `ListType` and native `Title` metadata as materialization blockers.
- `build-yap-wrapper.js` excludes root `TenantID`, `CreatedBy`, and `ModifiedBy` from auto-collected `ReplaceIds`.
- `scripts/inspect-yap-import-readiness.mjs` adds one final gate for plugin-generated `.yap` handoff: strict package validation, strict graph validation, materialization inspection, schema-standard inspection, app-creation rules inspection, data-view inspection, wrapper round trip, and placeholder scan.

## Required Final Gate

Before a newly generated `.yap` is handed to a user, run:

```bash
node validate-yap-package.js <app.yap> --mode generator --stage final
node validate-yap-graph.js <app.yap> --mode generator --stage final --json <graph.json> --md <graph.md>
node scripts/inspect-yap-materialization.mjs <app.yap> --out <materialization.json>
node scripts/inspect-yap-schema-standard.mjs <app.yap>
node scripts/inspect-app-creation-rules.mjs <app.yap>
node scripts/inspect-data-views.mjs <app.yap>
node scripts/inspect-yap-import-readiness.mjs <app.yap>
```

The package must not be handed off if any structural errors remain. Compatibility validation may still be used for historical export study, but it must be labeled separately and cannot substitute for generated-app import readiness.

## Proof Boundary

- Projects Center fixed package import: user-confirmed success.
- Validator and workflow hardening: implemented locally in this branch.
- No broad runtime use proof is claimed.
- No data-entry proof is claimed.
- No document-library upload/folder behavior proof is claimed.
- No scheduled report execution proof is claimed.
- No workflow proof is claimed because this app has no approval workflow or list workflow.
