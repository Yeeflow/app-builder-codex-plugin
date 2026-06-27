# Collection Record Visibility And Approval Task Readonly Runtime Training Report

## Purpose

This training closes two runtime defects found during generated-app validation:

1. Dashboard Collection records can become invisible or blank when the generated Collection keeps source-template sort fields, incomplete Dynamic control binding surfaces, or a mismatched Dynamic control type.
2. Approval task forms can display submitted business fields as editable when the generator sets only `attrs.readonly` / `attrs.readOnly` but omits the top-level `control.readonly` / `control.readOnly` flags recognized by Yeeflow runtime controls.

Both issues are generated-final blockers because local structure/provenance checks can pass while the live user experience still fails.

## Source Evidence

- `collection-record-visibility-field-binding-training-analysis.md`
  - Direct root cause: the generated Collection chose an invalid `Primary order` / `attrs.data.sort[].SortName`, so rows did not materialize correctly.
  - Dynamic controls were visually present but did not consistently bind through runtime-visible field surfaces.
  - User/identity fields must use `dynamic-user`, not a generic `dynamic-field`.
- `task-form-readonly-rule-analysis-report.md`
  - Approval task forms correctly mirrored submitted fields structurally, but runtime controls remained editable.
  - Temporary live repair required setting both top-level and `attrs` readonly/readOnly flags.
  - Existing in-process task instances may use old deployed page snapshots; proof must use a fresh request/task instance.

## Generator Rules

Dashboard Collection generation must:

- Resolve the selected Collection data source to the generated Data List schema before package signing readiness.
- Write `attrs.data.sort[]` with a real internal field from that list. Do not keep copied labels such as `Primary order`, source-app sort fields, display labels, or deleted fields.
- Resolve `attrs.data.fulltext[].fields[]` against the same selected list.
- Bind every item-template Dynamic control through all required runtime/designer surfaces:
  - `attrs["obj-f"]`
  - `attrs.data.field`
  - `attrs.field`
  - top-level `field`
  - `attrs.user.field` for `dynamic-user`
- Keep all field binding surfaces equivalent after normalization.
- Choose the Dynamic control type from the field type:
  - user/identity fields: `dynamic-user`
  - image fields: `dynamic-image`
  - file/attachment fields: `dynamic-file`
  - all other display fields: `dynamic-field`

Approval task form generation must:

- Mirror every Submission form business field on task forms by default unless the Functional Specification or App Plan explicitly excludes that field for a task.
- Make mirrored Submission context fields runtime-effective readonly by setting both control-level and attrs-level flags:
  - `control.readonly = true`
  - `control.readOnly = true`
  - `control.attrs.readonly = true`
  - `control.attrs.readOnly = true`
- Allow task-specific editable fields only when the App Plan states the business purpose.
- Treat upgrade acceptance as insufficient readonly proof. A fresh request and newly generated task instance are required for final runtime evidence.

## Hard Gates Added

Dashboard dataset presentation validation now fails generated-final packages for:

- `DASH_DATASET_COLLECTION_LIST_UNRESOLVED`
- `DASH_DATASET_COLLECTION_SORT_MISSING`
- `DASH_DATASET_COLLECTION_SORT_FIELD_UNRESOLVED`
- `DASH_DATASET_COLLECTION_FULLTEXT_FIELD_UNRESOLVED`
- `DASH_DATASET_DYNAMIC_CONTROL_FIELD_MISSING`
- `DASH_DATASET_DYNAMIC_CONTROL_FIELD_SURFACE_MISSING`
- `DASH_DATASET_DYNAMIC_CONTROL_FIELD_SURFACE_MISMATCH`
- `DASH_DATASET_DYNAMIC_CONTROL_FIELD_UNRESOLVED`
- `DASH_DATASET_DYNAMIC_CONTROL_TYPE_MISMATCH`

Approval form field layout validation now fails generated-final packages for:

- `APPROVAL_TASK_CONTEXT_FIELD_READONLY_MISSING`

This gate requires mirrored Submission context fields on task forms to have runtime-effective top-level and attrs-level readonly flags.

## Regression Coverage

Focused tests cover:

- valid package using all approved Dashboard Collection references
- missing Collection sort
- unresolved Collection sort field
- missing Dynamic control runtime binding surface
- mismatched Dynamic control binding surfaces
- user field rendered with the wrong Dynamic control type
- task-form mirror field with attrs-only readonly flags
- task-form mirror field left editable
- valid task-form mirror fields with both top-level and attrs-level readonly flags

## Validation Commands

Run these before release:

```bash
node --check scripts/materialize-full-app-generated-final.mjs
node --check scripts/validate-dashboard-dataset-presentation-golden-references.mjs
node --check scripts/validate-approval-form-fields-template.mjs
node --check scripts/test-dashboard-dataset-presentation-golden-references.mjs
node --check scripts/test-approval-form-fields-template-gates.mjs
node scripts/test-dashboard-dataset-presentation-golden-references.mjs
node scripts/test-approval-form-fields-template-gates.mjs
node scripts/test-yapk-hard-gate-cache-artifacts.mjs
```

## Proof Boundary

Passing generated-final gates proves the package is structurally eligible for signing readiness. It does not by itself prove live runtime behavior. For final runtime proof:

- Dashboard Collection pages must show business rows and visible mapped field values, with no `No data` caused by bad sort/filter bindings.
- Approval task proof must create a new request and open the newly generated task page, then confirm mirrored submitted fields are visible and readonly.
