# Data Report live contract

## Evidence source and redaction

This reference is a redacted read-only analysis of two real Data Report definitions in the current Service Desk Pro app. It deliberately excludes tenant identifiers, component identifiers, source identifiers, raw SQL, and stored schedules.

Both reports used the `DataReport` component envelope: `Model`, `List`, `Fields`, and `Layouts`. The list resource was Type `64`, the result list had no seed `Items`, and each report had an `All Items` default Type `0` layout. Both model settings held a serialized `Stages` array.

## Observed pipeline structure

The two examples derived SLA summaries from current-app service data. Their observable stage graph was:

```text
input -> group -> join -> map -> output
```

`input` described a source resource and field mapping. `group` calculated summary values such as counts or averages. `join` merged independently aggregated result sets. `map` defined calculated result columns, including compliance ratios. The sole final `output` stage emitted the physical report fields.

The result schema included the native text `Title` field plus decimal, text, count, and lookup/team-related columns. This shows that report results are derived/list-like resources, not editable source records.

## Contract constraints

- `detail.Fields` is required and non-empty for `component_save`.
- `Model.Settings` is a JSON string containing the stage graph.
- `List.Type` is `64` for Data Report.
- `Fields[].ListID` and `Layouts[].ListID` resolve to `List.ListID`.
- A standard default result view is a Type `0` layout with `IsDefault: true`.
- Refresh schedule state is stored separately from stages. It is a business decision, not a schema default.

## What is not yet baseline-proven

The Help Center documents merging, appending, grouping, filters, field settings/calculations, and duplicate removal across Data List, Document Library, Form Report, and Data Report sources. This live sample only proves the stage types above and does not authorize generation of exact definitions for the other operations. Obtain a focused live contract/readback baseline before adding those paths to the generator.

Because an API save followed by readback proves only persistence, validate a Data Report consumer separately: Designer open for definition materialization; then Dashboard, Collection, workflow, or data-control smoke for runtime output.
