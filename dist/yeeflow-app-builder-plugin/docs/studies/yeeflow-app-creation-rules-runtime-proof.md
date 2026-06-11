# Yeeflow App Creation Rules Runtime Proof

Milestone: focused runtime import test for fixed workflow field-rule package

Date: 2026-05-25

## Scope

This pass tested the fixed workflow-actions package created after the product-team app creation rules update. It targets the data-list field generation issue where a generated field used a mismatched `FieldIndex` and `FieldName` numeric suffix, causing Yeeflow to reject manually added fields with:

> The value for the field already exists, please enter a new value.

Form Report runtime testing is explicitly out of scope for this pass.

## Package

- Repo package path: `workflow-actions-runtime-baseline-field-rules-fixed.v1.yap`
- Import package copied to: `<downloads>/workflow-actions-runtime-baseline-field-rules-fixed.v1.yap`
- Imported runtime app name used for this proof: `Workflow Actions Field. RulesProof`
- Target data list: `Purchase Requests Runtime Test`

The generated `.yap` package is a local runtime artifact and must remain ignored/uncommitted.

## Local Validation

- `scripts/inspect-app-creation-rules.mjs`: pass, 2 lists, 2 forms, 0 errors, 0 warnings.
- `validate-yap-package.js --mode generator --stage final`: pass with warnings, 0 errors, 19 warnings.
- `validate-yap-graph.js --mode generator --stage final`: pass with warnings, 0 errors, 14 warnings.
- `scripts/inspect-yap-materialization.mjs`: non-target app-shell finding `NO_DASHBOARD_NAV`.

No `FIELD_NAME_FIELDINDEX_MISMATCH`, malformed or missing `NoRule`, or invalid process-key errors were reported by the focused app-creation/package/graph validators.

## Runtime Result

- Import: succeeded.
- App open: succeeded.
- Approval form open: succeeded on `Workflow Action Approval Test`.
- Data list open: succeeded on `Purchase Requests Runtime Test`.
- Manual field creation panel: opened from `+ New column`.
- Manual field save: succeeded for a new single-line field named `Field Rules Runtime Proof`.
- Previous duplicate-value error: not observed.
- UI success message: `Added Successfully`.

## Proof Boundary

Runtime-proven in this pass:

- Fixed package imports into Yeeflow.
- Imported app opens.
- Included approval form opens.
- Target data list opens.
- A new manually added list field can be saved without the previous duplicate-value error.

Validator-backed:

- FieldIndex/FieldName suffix synchronization.
- Unique `DisplayName`, `FieldName`, and `InternalName` within generated lists.
- Valid `InternalName` and process-key character sets.
- Valid approval-form `NoRule` object shape with `{index}` in `Prefix`.

Not proven in this pass:

- Workflow routing, task assignment, approval submission, email delivery, data-list workflow execution, or record mutation behavior.
- Form Report import/open/designer behavior.
- Form Report field-source resolution.

## Guidance

Treat the app creation rules from `docs/studies/yeeflow-app-creation-rules.md` as generation-blocking for new packages. A generated workflow/data-list package that fails these checks must not be imported. This focused runtime proof upgrades the fixed workflow field-rule package from local-generation-fixed to runtime-import-proven and data-list-field-creation-proven, but only for the field creation path tested here.
