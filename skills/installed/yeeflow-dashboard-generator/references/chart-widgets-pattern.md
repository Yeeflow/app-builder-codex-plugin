# Chart Widgets Pattern

Use this after the empty dashboard shell, static page-builder elements, and local data-bound summary/table elements are already proven.

Source of truth: `Generated Dashboard Data Bound v3.yap`.

Proven generated package: `generated-dashboard-chart-widgets-v4.yap`.

Runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Dashboard | Generated Dashboard Chart Widgets v4`, rendered summaries, a data table, one pie chart, one column chart, one line chart, and opened the local `Event Planning` list without a visible query failure.

## App Shape

- one root app/listset
- one Type `103` dashboard layout
- one local child data list
- two summary controls
- one dashboard data table
- three chart widgets
- no approval forms
- no dashboard filters
- no AI modules, connections, document libraries, or external dependencies

## Chart Control Pattern

Chart controls live in the embedded dashboard page JSON under `LayoutInResources[0].Resource`.

Page controls:

- `type: "pie-chart"` for pie charts
- `type: "bar-chart"` for column charts
- `type: "line-chart"` for line charts

The chart control id is a UUID-like page control id. Preserve it as the page control id and do not remap it into the generated numeric resource ID family.

Chart visual options found in the page control:

- `attrs.title`: title text, display, position, alignment, typography, padding, and color
- `attrs.common`: padding, border, radius, and hover shadow
- `attrs.label`: present on the studied line chart for label font settings

## Chart Runtime Binding

Each chart control has a matching `page.exts[]` entry:

- `category: "___Pivot___"`
- `key`: `pie-chart`, `bar-chart`, or `line-chart`
- `i`: the matching chart control id
- `attr.AppID`: app id
- `attr.ListID`: local source list id
- `attr.ListSetID`: root app/listset id
- `attr.chartType`: Yeeflow chart type string
- `attr.settings.rows[]`: grouping/category field definitions
- `attr.settings.values[]`: aggregate value definitions
- `attr.settings.columns[]`: optional when a future export proves it

`Resource.ReportIds` includes all data-bound dashboard control ids, including summaries and chart controls.

## Chart Types Proven

- Pie chart: `key: "pie-chart"`, `attr.chartType: "0"`
- Column chart: `key: "bar-chart"`, `attr.chartType: "2"`, page control label `Column chart`
- Line chart: `key: "line-chart"`, `attr.chartType: "1"`

The proven pie and column charts group by `Text7` / `Vendors` and aggregate `Decimal1` / `Budget` with `SUM`.

The proven line chart groups by `Datetime1` / `Date` with `func: "MONTH"` and aggregates `Decimal1` / `Budget` with `SUM`.

## ReplaceIds

Include every local package id:

- root app/listset id
- dashboard layout id
- child list layout id
- child list id
- child list field ids
- local sample row ids

Do not include UUID-like page-builder, summary, table, or chart control ids in `ReplaceIds` unless a future export proves Yeeflow treats them as local remappable resources.

Do not remap tenant/user metadata.

## Generation Rules

- Use a fresh local ID family for every import test.
- Preserve large numeric ids as strings.
- Build generated `Resource.Data` from decoded app-def JSON instead of plain-parsing compressed `Resource.Data`.
- Preserve chart control ids, `Resource.ReportIds`, page `exts[]`, and local list data-source bindings.
- Remap `exts[].attr.ListID` and `ListSetID` to the generated local list and root ids.
- Preserve `settings.rows[]`, `settings.columns[]`, and `settings.values[]` field references by `fieldName`.
- Validate chart field references against the referenced list fields before building the wrapper.
- Keep generated native Title field metadata: `Status: 0`, `IsSystem: true`, `IsIndex: true`.

## Validator Rules

Validators should catch:

- each chart `exts[].i` resolves to a page control id
- each chart `exts[].i` appears in `Resource.ReportIds` when report ids are present
- chart `exts[].attr.ListID` resolves to a packaged list
- chart `settings.rows[]`, `columns[]`, and `values[]` field references resolve to that list's fields or known system fields
- chart `key` and page control `type` are consistent for the proven types

## Stop Conditions

Stop before generation if:

- chart `exts[].i` cannot be matched to a chart control id
- chart source list is missing from `Data.Childs[]`
- chart row/value field names do not exist on the source list
- chart control ids are missing from `Resource.ReportIds`
- large numeric ids have become JavaScript numbers
- package validation, graph validation, or wrapper round-trip checks fail
