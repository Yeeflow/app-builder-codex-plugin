# Data Analytics Runtime Chart Type Codes Training Report

## Scope

This training pass hardens generated Data Analytics runtime models after the Office Asset Loan Management dashboard-only runtime fix proved that visual chart controls can exist, have `Resource.ReportIds[]`, and have `Resource.exts[]`, yet still fail to materialize when the runtime chart contract uses semantic strings instead of Yeeflow runtime codes.

## Source Evidence

- Runtime-fixed app: Office Asset Loan Management E2E 0.8.94 Live 214337.
- Runtime fix version: v1.0.13.
- Evidence report: `other-dashboards-runtime-fix-v1.0.13-summary.md`.
- v1.0.12 fixed KPI Summary runtime binding, but other Dashboard Data Analytics charts still did not materialize.
- v1.0.13 fixed Data Analytics chart runtime details and the remaining Dashboard pages passed structured runtime proof.

## Root Cause

Generated chart runtime extensions used semantic chart type strings:

- `pie-chart`
- `line-chart`
- `area-chart`
- `bar-chart`
- `column-chart`

The Yeeflow runtime-proven export shape requires chart type codes in `Resource.exts[].attr.chartType`:

- Pie chart: `0`
- Line chart: `1`
- Area chart: `1`
- Bar chart: `2`
- Column chart: `2`
- Pivot table: empty / no chart type, with `key: "PivotTable"`

Date-based line and area charts also require an export-supported date grouping function on the row definition. The function must match the business question:

```json
{ "field": "Created", "fieldName": "Created", "FieldName": "Created", "func": "DATE" }
```

Use `DATE` for daily/by-day trends, `MONTH` for monthly/by-month trends, `QUARTER` for quarterly trends, and `YEAR` for annual/by-year trends. For example, `Events by Month` must use `func: "MONTH"`; using `func: "DATE"` makes Yeeflow render the trend at day granularity.

Without this shape, the chart can render an empty shell or fail to materialize even when the wrapper, title, source list, `ReportIds`, and `exts` are structurally present.

## Required Generator Behavior

Full-app materialization must:

- Map approved Data Analytics templates to Yeeflow runtime chart codes before writing `Resource.exts[].attr.chartType`.
- Never emit semantic chart type strings in generated-final runtime extensions.
- Add a valid date grouping `func` to line/area runtime row fields when grouping by date-like fields such as Created, Modified, Start Date, End Date, Due Date, or Datetime fields, and select `DATE`, `MONTH`, `QUARTER`, or `YEAR` from the App Plan/chart title/business granularity.
- Keep pivot table runtime entries on `key: "PivotTable"` and omit chart type unless an export-proven pivot shape requires an empty string.
- Preserve the existing runtime requirements for `ReportIds[]`, `category: "___Pivot___"`, `i`, source metadata, rows, values, and visible/runtime model alignment.

## Required Validator Behavior

Generated-final validation must fail when:

- A chart control has no runtime `chartType`.
- A chart runtime `chartType` is a semantic string such as `pie-chart`, `bar-chart`, `column-chart`, `line-chart`, or `area-chart`.
- A line or area chart runtime row lacks an export-supported date grouping `func`, or the `func` conflicts with the declared business granularity.

Validator errors added in this pass:

- `DATA_ANALYTICS_RUNTIME_CHART_TYPE_CODE_INVALID`
- `DATA_ANALYTICS_RUNTIME_DATE_TREND_ROW_FUNC_MISSING`

## Regression Coverage

`scripts/test-data-analytics-golden-reference-gates.mjs` now includes focused negative fixtures for:

- semantic runtime chart type strings;
- missing or business-mismatched date grouping `func` on line/area trend rows.

The normal positive fixture now uses runtime chart codes and date row functions, so the accepted test shape mirrors the runtime-proven v1.0.13 contract while also allowing business-correct monthly/quarterly/yearly trend groupings.
