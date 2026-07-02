# Service Tickets Consolidated Data List Schema Training Report

## Scope

This training covers the Service Tickets Management 0.8.108 generated-final failure where the Dashboard parsing improved, but the planned business data-list fields were not materialized.

Evidence source:

- `/Users/rengerhu/Documents/Plugin Test2/service-tickets-management-20260702-141631-plugin-0_8_108-fresh-e2e/PLUGIN_ISSUE_ANALYSIS_REPORT.md`
- `/Users/rengerhu/Documents/Plugin Test2/service-tickets-management-20260702-141631-plugin-0_8_108-fresh-e2e/validation/static-generated-resource-hard-gate.json`

## Failure Summary

The App Plan used a consolidated Data List schema table:

```md
| List | Field label | Internal field | Field type | Purpose |
```

The materializer only supported older per-list sections such as:

```md
### Tickets
| Display Name | Internal Name | Business Type | Yeeflow Type |
```

As a result, the generated package collapsed to generic/default list fields instead of materializing:

- `Tickets`
- `Ticket Comments`
- `Ticket Attachments`

with their planned business fields.

## Required Generator Behavior

The full-app materializer must treat consolidated Data List schema tables as authoritative.

Required parsing rules:

- Use the `List` column to group rows into child Data Lists.
- Use `Field label` as the generated `DisplayName`.
- Preserve `Internal field` exactly when it is schema-safe, including `Title`, `Text*`, `Decimal*`, `Datetime*`, and `Bit*`.
- Use `Field type` to infer Yeeflow storage and control type.
- Do not treat the heading `Data List Schema Table` as a generated Data List.
- Preserve canonical identity-picker fields as `FieldType: "Text"` with `Type: "identity-picker"`.
- Preserve `File` fields as Text-backed `file-upload` controls when the App Plan uses Text-key storage.
- Preserve lookup fields as Text-backed `lookup` controls when the App Plan supplies a Text key such as `Text2`.
- Resolve lookup targets from `Purpose` values such as `Lookup to Tickets`, and fall back from singular field labels such as `Ticket` to the plural planned list `Tickets`.
- Emit lookup `Rules` with a runtime-resolvable target list ID and display field, for example `listid` plus `listfield: "Title"`.
- Infer select controls and choices from `Purpose` when it contains business value lists for fields such as `Priority`, `Status`, or `Category`.
- Do not infer numeric controls from display names such as `Ticket Number` when `Field type` is `Text`.

## Hard Gate Expectations

Generated-final validation must fail when a planned consolidated schema table does not materialize into the package.

Minimum Service Tickets assertions:

- `Tickets` includes `Ticket Number`, `Subject`, `Requester`, `Category`, `Priority`, `Status`, `Assigned Agent`, `Created Date`, `Due Date`, and `Description`.
- `Ticket Comments` includes `Ticket`, `Comment`, `Commented By`, and `Comment Date`.
- `Ticket Attachments` includes `Ticket`, `File`, and `Uploaded By`.
- `Requester`, `Assigned Agent`, `Commented By`, and `Uploaded By` are `FieldType: "Text"` plus `Type: "identity-picker"`.
- `Ticket Comments.Ticket` and `Ticket Attachments.Ticket` are lookup controls with complete target-list and display-field rules.
- `Priority` and `Status` preserve planned keys and expose business choice values.
- `File` uses the structured file-upload seed contract.

## Regression Coverage

`scripts/test-service-tickets-e2e-regression-gates.mjs` now uses the consolidated schema-table App Plan shape and asserts:

- planned lists and fields are materialized;
- identity-picker fields remain Text-backed and seed-safe;
- lookup fields resolve to target lists with complete runtime rules;
- Priority/Status filters use planned choice fields and non-empty options;
- custom forms attach to the correct host lists;
- Service Tickets output does not retain Office Asset or Loan template residue.
