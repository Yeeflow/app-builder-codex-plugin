# Dashboard Runtime Binding Standard

Dashboard controls must be runtime-bound before a generated app is described as ready. A visually complete dashboard is not enough.

## Summary Controls

Every generated Summary control must be generated as a report-backed data control:

- `attrs.data.list` resolves to an included source list
- `attrs.field` or the export-proven equivalent resolves to a source field
- a matching layout-resource `Resource.exts[]` entry exists
- the matching extension uses `category: "___Pivot___"`
- the matching extension uses `key: "summary"`
- `exts[].i` equals the Summary control id
- `exts[].attr.settings.values[]` includes a resolvable aggregate field, field type, and aggregate function such as `COUNT`, `SUM`, `AVG`, `MIN`, or `MAX`
- dashboard layout-resource `Resource.ReportIds[]` includes the Summary control id

The generator must not substitute static text, static numbers, or visual-only KPI cards for Summary controls when the app plan calls for calculated metrics.

## Filters

Every generated dashboard filter control must map to a stable page-level filter variable.

Recommended filter variable naming:

```text
filter_{PageName}_{FilterName}
```

Every declared `filterVars[]` entry must be consumed by at least one downstream control:

- Summary
- Collection
- Data table
- chart
- pivot

Consumer wiring:

- Summary controls consume filters through `exts[].attr.settings.Conditions[]`
- Collection and Data table controls consume filters through `attrs.data.filter[]`
- chart and pivot consumers use their export-proven condition/filter structures

Every consumer condition must reference a valid field on the consumer source list. For lookup-backed fields, compare record ids/ListDataID-style values, not display labels.

## Validation Gates

Generated-final packages should fail on:

- `DASHBOARD_SUMMARY_MISSING_DATA_LIST`
- `DASHBOARD_SUMMARY_MISSING_FIELD`
- `DASHBOARD_SUMMARY_MISSING_EXT`
- `DASHBOARD_SUMMARY_EXT_MISMATCH`
- `DASHBOARD_SUMMARY_MISSING_VALUES`
- `DASHBOARD_SUMMARY_MISSING_REPORT_ID`
- `DASHBOARD_FILTER_VAR_DECLARED_NOT_CONSUMED`
- `DASHBOARD_FILTER_CONTROL_WITHOUT_FILTER_VAR`
- `DASHBOARD_FILTER_CONSUMER_INVALID_FIELD`
- `DASHBOARD_LOOKUP_FILTER_VALUE_NOT_RECORD_ID`
- `DASHBOARD_VISUAL_ONLY_KPI_CARD`

Use `scripts/validate-runtime-binding-lessons.mjs` as the focused reusable gate for these lessons. Its output is redacted and reports page name, control id, control title, source list, source field, filter variable, consumer controls, severity, and recommended fix where applicable.
