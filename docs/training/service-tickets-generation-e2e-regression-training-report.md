# Service Tickets Generation E2E Regression Training Report

## Scope

This training report captures the Service Tickets Management E2E failures found against plugin `0.8.95` and promotes them into generator and validation requirements. The package stopped before signing because generated-final preflight still failed Dashboard hard gates, and static inspection found field, form-host, and source-template residue defects.

## Root Causes

The failures were caused by App Plan to generated-final drift:

- The `Tickets` data list did not preserve the planned `Status` field. The generator treated status-like names as non-resource placeholders in a field table path and filtered or remapped the field.
- Planned User fields such as `Requester` and `Assigned Agent` did not preserve their identity-picker control contract and drifted into ordinary text-style fields. Current generated-final YAPK schema keeps identity-picker fields on Text-backed storage keys, so the required contract is schema-safe `Text*` storage plus identity-picker/user semantics.
- Dashboard subsection headings such as `Summary Metrics` were eligible for accidental Dashboard page materialization when the parser read too broadly.
- A unified custom form table with an explicit `Data List` column could attach supporting-list forms to the first data list instead of their real host list.
- Dashboard and Data List View Item resources retained source-template business residue such as `Office Asset`, `Active Loan Pipeline`, `current loan volume`, and `return activity signal`.
- Supporting-list View Item forms, especially comments and attachments, inherited KPI modules without a planned KPI requirement.

## Generator Rules

Full-app generation must now enforce these rules:

1. Field rows are not resource placeholders. Do not discard business fields only because their display name is `Status`, `State`, `Stage`, `Type`, or another domain label. Placeholder filtering for resource names must not be reused for field display names.
2. Preserve explicit App Plan field keys whenever they are schema-safe. If a row says `Status | Text5`, generate `FieldName = Text5`. If a row uses an unsupported user-style storage key such as `Requester | User1`, keep the user/identity-picker semantics but materialize a schema-safe Text-backed `FieldName`.
3. User/person/requester/assignee/agent/owner fields must keep identity-picker-style control behavior unless the App Plan explicitly requests a different field type. They must not regress to ordinary text inputs.
4. Deduplicate field specs by business display name, not by inferred field key. If a generated inferred key collides, allocate the next available key in the correct field family instead of dropping the field.
5. Parse Dashboard pages only from the Dashboard Pages Plan page-name/page-table records. Do not materialize subsection headings such as `Summary Metrics`, `Dashboard Filters`, `Data Analytics`, or `Data Tables` as standalone Dashboard pages.
6. Custom Data List form records must attach to the list named in their table row when a `Data List` or host-list column is present. Fallback to the first list is forbidden when multiple lists exist and the form host is ambiguous.
7. New/Edit and View Item forms must not inherit Dashboard KPI modules or source app examples unless the App Plan explicitly selects KPI/Summary content for that form. Supporting lists such as Comments and Attachments should show record fields and planned related controls only.
8. Before generated-final handoff, scrub or remove source-template business residue from Dashboard and custom form resources. Service Tickets resources must not contain Office Asset or loan-domain text unless the current app is actually an Office Asset or loan-domain app.

## Validation Requirements

The regression is covered by `scripts/test-service-tickets-e2e-regression-gates.mjs`. It materializes a minimal Service Tickets App Plan and asserts:

- planned `Status` remains `Text5` and `select`;
- planned `Requester` remains an identity-picker control with schema-safe Text-backed storage;
- planned `Assigned Agent` remains an identity-picker control with schema-safe Text-backed storage;
- `Summary Metrics` does not become an unplanned Dashboard page;
- custom forms are attached only to their correct host lists;
- decoded package text does not contain Office Asset / loan template residue.

This test must remain in release/cache smoke coverage when the materializer, App Plan parser, field mapper, dashboard builder, or custom Data List form builder changes.

## Proof Boundary

This training pass is generated-final and regression-test backed. It prevents the observed 0.8.95 package defects before signing. It does not claim live Service Tickets runtime proof for every dashboard interaction until a fresh signed/install/browser proof run passes after these changes.
