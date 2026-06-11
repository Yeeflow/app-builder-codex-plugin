# Business Travel YAP Schema Fix

## Scope

- Branch: `codex/business-travel-yap-schema-fix`
- Input package: `<downloads>/business-travel-budget-control.v1.yap`
- Fixed package: `business-travel-budget-control.schema-fixed.v1.yap`
- Downloads copy: `<downloads>/business-travel-budget-control.schema-fixed.v1.yap`
- Manual import test status: user-proven after `ListModel.Flags = 1` repair
- Manual workflow publish test status: user-proven for `Business Travel Request`

This is a focused package repair and runtime-practice pass. It claims only user-proven import/open/workflow publish for the fixed Business Travel package. It does not claim workflow execution, routing, request submission, approval completion, email delivery, true Finance Manager position assignment, or data mutation.

## Original Validation Findings

Proof level: validator-backed.

The original generated package decoded safely, but failed the current schema-standard and app-creation validators.

Schema-standard findings:

- `LIST_EXPORT_ITEM_DEFS_MISSING` at `Data.Item.Defs`.
- `NORULE_MISSING` at `Data.Forms[0].NoRule`.

App-creation findings:

- Root list export item had missing `Defs`.
- Root and child `ListModel.Flags` values were missing. Known valid exports use `ListModel.Flags = 1` on root app/list resources and child data-list resources.
- Fourteen generated list fields had `FieldIndex` / `FieldName` suffix mismatches.
- Approval form `NoRule` was missing or malformed.

Workflow validator findings:

- Finance Approval task assignment used placeholder position `__POSITION_ID_REQUIRED_FINANCE_MANAGER__`; Yeeflow requires direct `position` assignment IDs to be valid numeric position IDs.
- Manager Approval task assignment referenced workflow variable `Applicant`, but `Applicant` was not declared in `DefResource.variables.basic[]`.
- Set Variable node `Set_TR#` targeted workflow variable `TRid`, but `TRid` was not declared in `DefResource.variables.basic[]`.
- Finance approval sequence flows referenced deleted workflow variable `EstimatedTotalAmount`, while the real numeric workflow variable is `TotalAmount`.
- One Set Variable action used a legacy HTML expression-button value instead of an expression-token array.
- One Set Data List / ContentList action used legacy HTML expression-button mapping values instead of expression-token arrays.
- The Set Data List mappings referenced generated field names that were also repaired by the `FieldIndex` / `FieldName` suffix synchronization step.

## Repairs Applied

Proof level: schema-repair-backed and validator-backed.

The repair script is [scripts/repair-business-travel-yap-schema.mjs](/Users/Renger/Documents/Codex%20Projects/AI%20Agent%20and%20Copilot%20templates%20-%20formreport/scripts/repair-business-travel-yap-schema.mjs).

Applied repairs:

- Set missing root `Data.Item.Defs` to `[]`.
- Preserved existing root and child `Layouts` arrays.
- Preserved existing child `Defs` arrays.
- Set missing root and child `ListModel.Flags` values to `1`.
- Added missing user workflow variable `Applicant` used by form pages and Manager Approval's line-manager assignment expression.
- Added missing text workflow variable `TRid` / `Travel Request No.` and aligned `Set_TR#` assignment metadata to that variable.
- Replaced the Finance Approval placeholder direct-position assignee with the existing applicant line-manager expression assignment because no safe tenant-specific Finance Manager position ID is available in this repair pass.
- Added a valid approval form `NoRule` object:
  - `Prefix: "BTR_{yyyy}_{index}"`
  - `StartIndex: 1`
  - `CustomLength: 8`
  - `AutoIncrement: 1`
- Renamed generated list `FieldName` values so the numeric suffix matches `FieldIndex`.
- Updated matching field references inside list records, layouts, and workflow ContentList target mappings.
- Repointed stale approval form workflow references from deleted `EstimatedTotalAmount` to existing `TotalAmount`, including Finance Required / Finance Not Required sequence-flow conditions and related form summary bindings.
- Converted legacy workflow expression HTML strings to expression-token arrays.
- Re-encoded the package with the required `[______gizp______]` Resource wrapper.

No business fields, private data, tenant IDs, or runtime records were invented.

## Local Validation

Fixed package validation:

- `scripts/inspect-yap-schema-standard.mjs`: pass, 0 errors, 0 warnings.
- `scripts/inspect-app-creation-rules.mjs`: pass, 0 errors, 0 warnings.
- `validate-yap-package.js --mode generator --stage final`: pass with warnings, 0 errors.
- `validate-yap-graph.js --mode generator --stage final`: pass, 0 errors, 0 warnings.
- `scripts/inspect-yap-materialization.mjs`: pass, 0 errors, 0 warnings.
- Workflow Set Variable inspector: found 1 Set Variable task after repair.
- Workflow Set Data List inspector: found 1 ContentList add action after repair.
- Root app and all 3 child data lists now have `ListModel.Flags = 1`.
- Manager Approval's assignee expression now resolves through declared workflow variable `Applicant`.
- Finance Approval no longer contains the placeholder `__POSITION_ID_REQUIRED_FINANCE_MANAGER__` direct-position ID.
- `Set_TR#` now targets declared workflow variable `TRid` with matching `idx`.
- Finance Required and Finance Not Required sequence-flow conditions now read existing numeric variable `TotalAmount`.
- The original package now fails local validation with `SETVARIABLE_UNKNOWN_VARIABLE` and `WORKFLOW_SEQUENCE_CONDITION_VARIABLE_UNRESOLVED`; the repaired package has 0 such errors.

Remaining package-validator warnings are UI/design-system warnings unrelated to the YAP schema-standard repair.

## User-Proven Runtime Publish Result

Package: `business-travel-budget-control.schema-fixed.v1.yap`

Proof source: user manual test on 2026-05-25.

User-confirmed runtime results:

- Import result: success.
- App open result: success.
- Approval form workflow open result: success for `Business Travel Request`.
- Workflow publish result: success.

This proves the repaired package can import, open, open the approval workflow, and publish the workflow. It does not prove workflow execution, request submission, routing, approval completion, email delivery, ContentList/data-list mutation, budget-control behavior, or true Finance Manager position assignment.

## Proof Boundary

- Schema repair: validator-backed.
- Generated package format: schema-repair-backed.
- Manual Yeeflow import after `ListModel.Flags = 1`: user-proven.
- Business Travel app open, workflow open, and workflow publish: user-proven for the fixed package.
- Workflow routing/execution: not runtime-proven.
- Budget-control submit guard behavior: not runtime-proven.
- True Finance Manager position assignment: not proven; no real numeric tenant position ID was validated.

## Next Step

Review and merge the publish proof, then rebuild a plugin patch release. Keep request submission, routing, approval completion, ContentList mutation, budget-control lifecycle, and true Finance Manager assignment as separate scoped runtime tests.
