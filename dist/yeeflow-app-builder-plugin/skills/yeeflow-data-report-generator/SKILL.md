---
name: yeeflow-data-report-generator
description: Create, inspect, update, validate, and safely delete Yeeflow Data Report definitions through the bundled App Builder MCP. Use for derived reports sourced from Data Lists, Document Libraries, Form Reports, or other Data Reports.
---

# Yeeflow Data Report Generator

Use this skill for the **Data Report definition lifecycle**, not to mutate rows emitted by a report. A Data Report is a read-only derived resource: its definition can be created, updated, or deleted; report output must not receive add/edit/delete record actions.

## Proof Boundary

The initial live baseline comes from two redacted business reports in Service Desk Pro. It proves the persisted `DataReport` component envelope and an observed stage pipeline of `input`, `group`, `join`, `map`, and `output`. It does **not** prove that arbitrary SQL, stage types, schedules, or consumer UI behaviour will run.

Read [references/data-report-live-contract.md](references/data-report-live-contract.md) before generating a report. Never copy tenant IDs, source IDs, SQL, or schedules from a reference report.

## Required MCP Workflow

1. Read `appbuilder_component_contract` for `DataReport`, then list the target application's components. Resolve every source component and field from the current app; do not reuse example IDs.
2. Produce a Data Report plan containing source resources, selected source fields, output fields, a stage graph, refresh policy, and intended consumers. Ask for a decision when merge/append/filter/deduplication semantics are ambiguous.
3. Obtain all new numeric IDs with the App Builder MCP ID utility. Assemble a complete `detail` payload with `Model`, `List`, non-empty `Fields`, and a default Type `0` layout. Set `List.Type` to `64`.
4. Before `appbuilder_component_save`, run:

   ```bash
   node scripts/validate-data-report-detail.mjs --input <detail.json>
   ```

5. Save only after the validator passes, then `appbuilder_component_get` the exact component and run the validator again on the readback. State API acceptance and persisted readback separately.

For update, first read the complete existing component, preserve unknown properties, and use `deleteMissing: false` unless explicit removal is intended. Revalidate the full replacement graph before saving; a partial field edit may break the stage/output mapping.

For deletion, list and assess dashboard, workflow, navigation, and report dependencies; require an exact component-name confirmation; call `appbuilder_component_delete`; then list/read back to verify absence. Deletion is irreversible.

## Initial Generation Profile

The only generation profile supported by this skill without a new live baseline is:

```text
input (Data List source) -> group -> optional join -> optional map -> output
```

- Use `input` for each explicitly selected current-app Data List source.
- Use `group` only for clearly stated aggregates and grouping keys.
- Use `join` only with explicit left/right key and desired join semantics.
- Use `map` for named calculated output columns; guard division by zero and preserve data types.
- Use one final `output` stage. It must be last.
- Give the result a native `Title` text field at index `0`, then unique physical output fields with matching `FieldName`, `InternalName`, IDs, and types.
- Start with refresh disabled. Enable a schedule only when the user states a business cadence and time zone; never inherit an example's schedule.

Do not generate Append, Merge variants, filter, remove-duplicate, non-Data-List sources, or unobserved stage types as production-ready definitions until a focused live component contract/readback baseline validates their exact shape.

## Fail-Closed Rules

- `Model.Settings.Stages` must be non-empty, use supported observed types, have unique IDs/output tables, and end with exactly one `output` stage.
- Each non-input stage must depend on prior stage output table(s); a join must resolve two prior tables.
- `Fields` must all belong to `List.ListID`; report definitions must not seed `List.Items`.
- The report's list resource is Type `64`, has one default Type `0` layout, and has an export-shaped `LayoutView`.
- Treat a successful save/get as persistence evidence only. For a report used in a Dashboard, Collection, workflow, or data control, execute a focused consumer smoke test before claiming it is usable.

## Evidence Report

Report these levels independently:

| Level | Meaning |
| --- | --- |
| API accepted | `component_save` accepted the definition. |
| Persisted readback | `component_get` returned the saved definition and validator passed. |
| Designer-open | The Data Report opens in Designer without schema/stage errors. |
| Consumer runtime | The intended dashboard/workflow/data control refreshes and renders expected output. |

The first two levels never prove the last two. Include unattempted levels and the exact next required test.
