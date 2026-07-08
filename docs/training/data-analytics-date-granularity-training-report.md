# Data Analytics Date Granularity Training Report

## Scope

This focused training pass updates Data Analytics line/area date trend generation after the Event Planning2 standalone Dashboard validation found that `Events by Month` was generated with `func: "DATE"`.

## Runtime Finding

Yeeflow renders a line chart row with:

```json
{ "fieldName": "Datetime1", "func": "DATE" }
```

at day granularity. For the business question `Events by Month`, the runtime-correct row is:

```json
{ "fieldName": "Datetime1", "func": "MONTH" }
```

The older validator rule required `DATE` for every line/area date trend. That was structurally safe for daily trends, but it conflicted with monthly business reporting.

## Required Rule

Line and area charts over date/time fields must use an export-supported date grouping function that matches the business granularity:

- `DATE`: daily / by day trends. The Designer UI label `Day` must serialize as `func: "DATE"`, not `func: "DAY"`.
- `MONTH`: monthly / by month trends, such as `Events by Month`.
- `QUARTER`: quarterly trends.
- `YEAR`: yearly / annual trends.

No other runtime date grouping functions are supported for Data Analytics date rows. Values such as `DAY`, `WEEK`, `HOUR`, `FISCAL_MONTH`, or semantic lowercase labels must fail validation instead of being emitted.

Do not force `DATE` when the App Plan, chart title, section title, or business question says month, quarter, or year.

## Generator Contract

When materializing a line/area Data Analytics runtime model:

1. Resolve the grouping field and confirm it is date-like.
2. Prefer an explicit App Plan grouping value when provided.
3. Otherwise infer the grouping from the chart title and business text.
4. Emit `Resource.exts[].attr.settings.rows[].func` as `DATE`, `MONTH`, `QUARTER`, or `YEAR`.
5. Keep the rest of the export-shaped row metadata intact.

## Validator Contract

The validator must:

- Reject missing or unsupported date grouping functions for line/area date trends.
- Accept only `DATE`, `MONTH`, `QUARTER`, and `YEAR`.
- Fail when business text implies a specific granularity but the runtime row uses a different one, for example `Events by Month` with `func: "DATE"`.

## Regression Fixture

The regression suite includes:

- Positive: `Events by Month` with `func: "MONTH"` passes.
- Positive: `Events by Day`, `Events by Quarter`, and `Events by Year` pass only with `DATE`, `QUARTER`, and `YEAR` respectively.
- Negative: `Events by Month` with `func: "DATE"` fails with `DATA_ANALYTICS_RUNTIME_DATE_TREND_GRANULARITY_MISMATCH`.
- Negative: unsupported values such as `DAY` and `WEEK` fail with `DATA_ANALYTICS_RUNTIME_DATE_TREND_ROW_FUNC_MISSING`.
