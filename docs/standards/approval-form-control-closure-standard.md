# Approval Form Control Closure Standard

## Scope

This standard applies to every generated Approval Form Submission, Task, and Print page in a standalone `.ywf`, a generated `.yap`, a `.yapk` application package, and a persisted MCP readback.

## Single builder and normalised field model

- Use `scripts/lib/approval-form-layout-builder.mjs` as the only field-control lowerer. A copied template marker such as `derivedFromApprovalFormLayoutTemplate` is not proof of compliance.
- Derive Submission and Task controls from one normalised field model. A common binding must keep the same control type and field identity on every page; only page-role properties such as readonly, required, visibility, and an explicitly planned task-only field may vary.
- A bound top-level field must carry `approvalFieldMaterializedFromPlan: true`. A nested Sub List row field must carry `approvalSubListFieldMaterializedFromPlan: true`.

## Control and placeholder contract

- Only shared-builder supported Yeeflow types are permitted for bound fields. `drop` is invalid and must fail with `APPROVAL_CONTROL_TYPE_UNKNOWN`.
- `radio` and `select` controls need actual business choices; no empty visual Choice control is allowed.
- Every editable `attrs["list-fields"][].control` needs a non-empty business placeholder:
  - text, number, currency: `Enter <field>`
  - choice, lookup, people, date: `Select <field>`
  - upload: `Upload <field>`
- Readonly Task rows are review context and do not need an entry placeholder.

## Mandatory evidence gate

1. Before package/signing: run `scripts/validate-approval-form-control-closure.mjs --package <app.yapk>`.
2. After an MCP `component_save`: call `component_get`, preserve a redacted complete `DefResource`, then run `scripts/validate-approval-form-control-closure.mjs --resource <persisted-def-resource.json>`.
3. Treat `APPROVAL_CONTROL_TYPE_UNKNOWN`, `APPROVAL_FIELD_SHARED_BUILDER_MARKER_MISSING`, `CHOICE_CONTROL_OPTIONS_MISSING`, `APPROVAL_PAGE_FIELD_TYPE_MISMATCH`, and `SUBLIST_EDITABLE_PLACEHOLDER_MISSING` as blockers.
4. Report API acceptance, persisted readback, Designer-open, and browser workflow runtime independently. The first two prove persistence only, not interaction usability.
