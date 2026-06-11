# Package Validation Lifecycle

Run this lifecycle before Yeeflow import or runtime testing. Use available repo scripts and validators rather than inventing ad hoc checks.

## 1. Identify Package Scope

- Confirm whether the artifact is a generated `.yap`, decoded app folder, `.ydl`, `.ywf`, or `.yapk`.
- Treat `.yapk` as read-only/server-generated for app-content changes unless Yeeflow Resource generation behavior is proven. Wrapper signing/verification for an already-valid opaque Resource is not app-content generation proof.
- Do not modify raw generated packages unless the task explicitly asks for regeneration.

## 2. Run Structural Validators

Use the repo's actual script names and paths when available. Common validators include:

- `validate-yap-package`
- `validate-yap-graph`
- `validate-ywf-def`
- `validate-ydl-list`
- wrapper round-trip checks

If a named validator is unavailable, report it as unavailable and use the closest repo-local inspection without pretending the validator ran.

## 3. Validate Lists And Fields

- Confirm every list has stable identity, type, and field collection.
- Confirm app-wide `FieldID` uniqueness.
- Confirm every field's `ListID` equals its parent data list `ListID`.
- Confirm `FieldName`, `InternalName`, and `DisplayName` are unique within each list unless Yeeflow export evidence proves an exception.
- Confirm lookups point to existing lists and fields.
- Do not remap `TenantID`, `CreatedBy`, or `ModifiedBy` into generated ID families.

## 4. Validate Workflows

- Run `validate-ywf-def` or equivalent.
- Inspect task actions, approval/rejection branches, set-variable actions, update-item actions, notifications, conditions, expressions, and task URLs.
- Confirm `FlowKey` values are stable, unique where required, and not accidentally copied across unrelated workflows.

## 5. Validate Forms, Dashboards, And Custom Code

- Confirm form controls reference existing lists, fields, actions, and expressions.
- Confirm dashboards reference real data sources, not static placeholder KPI values.
- Inspect custom code controls for expected runtime context, SDK usage, missing imports, hard-coded tenant data, and unsafe claims.

## 6. Validate Materialization

- Inspect package wrapper and decoded resources for app, list, form, workflow, dashboard, and file/resource materialization.
- Check for prefix or `pr<id>x` corruption where encoded IDs, field names, or resource references were accidentally rewritten.
- Confirm compressed or embedded resources can be decoded or round-tripped when the repo has tooling for it.

## 7. Decide Import Safety

Do not import when blocking issues remain. If only warnings remain, document them and explain why runtime testing is still safe.
