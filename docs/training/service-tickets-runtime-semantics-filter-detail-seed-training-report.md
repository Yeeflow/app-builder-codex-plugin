# Service Tickets Runtime Semantics: Filter, Detail, Seed Training Report

## Scope

This training closes the remaining Service Tickets management defects observed after `0.8.105` verification. The collapse action was rechecked and is not treated as a defect. KPI cards, empty sections, visual-only top-right buttons, Status filter field binding, and schema-safe identity-picker field direction were already improved in the prior release.

This report focuses only on the remaining generator and validator gaps:

- `Priority Level` left-panel filter rendered with an empty option list.
- Selected ticket detail labels were filled by field order and could bind to the wrong field.
- Loan/Office Asset source-template copy and KPI metadata still leaked into Service Tickets resources.
- Seed artifacts used incomplete handling for `identity-picker` and `file-upload` fields.
- Validators allowed these runtime/business semantic defects to pass.

## Required Generator Behavior

### Master-detail left-panel filters

When a two-panel or three-panel workspace template is used, `left_panel_filter_control` must bind by business semantics. A filter labeled `Priority Level` or `Priority` must bind to the real Priority field; a filter labeled `Status` must bind to the real Status field. The generated control must preserve a proven option source:

- `attrs.data.field`, `attrs.display_f`, and `attrs.value_f` must be the same resolved field.
- Choice values must come from App Plan `Choice Values`, exported `Rules.choices`, or a safe domain fallback.
- The generated control must expose non-empty `choice-options` / `options` for planned choice fields.
- Collection filters must not use unsafe empty select-filter conditions that clear the list on first load.

### Selected-item detail fields

Do not populate `current_item_standard_field` and `current_item_large_field` by raw field order. The label/title and value control in the same field container must describe the same source field. For example:

- `Ticket ID` / `Ticket Number` binds to the ticket number field.
- `Status` binds to Status.
- `Category` binds to Category.
- `Priority` binds to Priority.
- `Description` binds to Description or an equivalent detail field.

If the source list does not contain a matching business field, the generator must rename the label to the actual field or remove the container.

### Source-template residue cleanup

Generated Service Tickets resources must not contain copied Office Asset / Loan business copy in visible text, Designer metadata, KPI card internals, or custom form metadata. Block examples include:

- `Office Asset`
- `Active Loans`
- `Active Loan Pipeline`
- `current loan volume`
- `return activity signal`
- `Office Asset records`
- `Coordinator view of active loans...`
- `checkout status`
- `return follow-up`

If a planned KPI remains, every visible label and metadata name must be rewritten to the current business metric. If no metric is planned, prune the module.

### Identity-picker and file-upload seed artifacts

Generated YAPK fields must remain canonical:

- `identity-picker` uses `FieldType: "Text"` and `Type: "identity-picker"`.
- `file-upload` uses Text-backed storage and `Type: "file-upload"`.
- Do not emit unsupported `FieldType: "User"` or `User*` storage fields.

The seed artifact, not the package schema, carries live-write instructions:

- `identity-picker` row values must be structured objects with `seedValueType: "identity-picker"` and `requiresLiveUserResolution: true`.
- `file-upload` row values must be structured objects with `seedValueType: "file-upload"` and `requiresFileUploadReference: true`.
- `fieldSeedRequirements[]` must identify fields that need live user or file-reference resolution before seed writes.

## Validator Requirements

The Service Tickets regression gate must fail if:

- Priority/Status filters bind to the wrong field or have no proven options.
- Selected-item detail labels and value bindings mismatch.
- Source-template business copy remains anywhere in decoded resources.
- `identity-picker` fields regress to unsupported `FieldType: "User"`.
- Seed artifacts use plain strings for identity-picker or file-upload values.

## Proof Boundary

This training updates local generation, validation, standards, docs, and regression coverage only. It does not claim Yeeflow signing, install/import, upgrade, Version Management, seed data execution, or browser/runtime proof.
