# Generated Dashboard Baseline v4: Chart Widgets

## Package

- source export studied: `/Users/Renger/Downloads/Generated Dashboard Data Bound v3.yap`
- generated package: `generated-dashboard-chart-widgets-v4.yap`
- generated resource: `generated-dashboard-chart-widgets-v4-resource.json`
- generated app def: `generated-dashboard-chart-widgets-v4-app-def.json`
- generator: `generate-dashboard-chart-widgets-v4.mjs`

## What It Proves

This baseline proves a generated Yeeflow dashboard app can import and open with:

- one root app/listset
- one Type `103` dashboard page
- one local child data list
- two data-bound `summary` controls
- one dashboard `data-list` table control
- three chart widgets: pie, column, and line
- local sample rows used by dashboard summaries, table, chart aggregations, and the list runtime view

No dashboard filter, approval form, report page, AI module, connection, or document library is included.

## Chart Resource Pattern

Chart widgets are stored in the embedded dashboard page JSON under `LayoutInResources[0].Resource`.

The chart visual controls live in the page control tree:

- `type: "pie-chart"` for pie charts
- `type: "bar-chart"` for column charts
- `type: "line-chart"` for line charts

Each chart control id is a UUID-like id. These chart ids are not local numeric resource ids and are preserved as control ids, not remapped into the numeric resource ID family.

Each chart has a matching `page.exts[]` entry:

- `category: "___Pivot___"`
- `key`: chart kind, such as `pie-chart`, `bar-chart`, or `line-chart`
- `i`: the matching chart control id
- `attr.AppID`: app id
- `attr.ListID`: local source list id
- `attr.ListSetID`: root app/listset id
- `attr.chartType`: Yeeflow chart type string
- `attr.settings.rows[]`: grouping/category field definitions
- `attr.settings.values[]`: aggregate value field definitions

`Resource.ReportIds` includes all data-bound dashboard control ids: summary ids plus every chart control id.

## Chart Types Learned

- Pie chart: `key: "pie-chart"`, `attr.chartType: "0"`
- Column chart: `key: "bar-chart"`, `attr.chartType: "2"`, page control label `Column chart`
- Line chart: `key: "line-chart"`, `attr.chartType: "1"`

The studied pie and column charts group by `Text7` / `Vendors` and aggregate `Decimal1` / `Budget` with `SUM`.

The studied line chart groups by `Datetime1` / `Date` with `func: "MONTH"` and aggregates `Decimal1` / `Budget` with `SUM`.

## ReplaceIds Rules

Include every local package id:

- root app/listset id
- dashboard layout id
- child list layout id
- child list id
- child list field ids
- local sample row ids, including `ListDatas` object keys

Do not include UUID-like chart, summary, or page-builder control ids in `ReplaceIds` unless a future export proves Yeeflow treats them as local remappable resources.

Do not remap tenant/user metadata such as `TenantID`, `CreatedBy`, or `ModifiedBy`.

## Validation Results

- `node --check generate-dashboard-chart-widgets-v4.mjs`: pass
- `node --check validate-yap-package.js`: pass
- package validation on resource: `pass_with_warnings`; only `APP_THEME_EMPTY`
- graph validation on resource: pass
- wrapper build: pass
- wrapper round-trip: wrapper JSON valid, Resource prefix/base64/gzip valid, Resource JSON valid, Resource.Data valid, decoded data equals source, package validation passes, graph validation passes
- package validation on wrapped `.yap`: `pass_with_warnings`; only `APP_THEME_EMPTY`
- graph validation on wrapped `.yap`: pass

## Runtime Results

Tested at `https://<yourdomain>.yeeflow.com`.

- import metadata dialog parsed name, description, and icon
- import completed
- app appeared in Shared Workspace as `Generated Dashboard Chart Widgets v4`
- dashboard opened successfully
- summary cards rendered `SGD 142500.00` and `20`
- dashboard data table rendered event rows
- pie chart rendered as `Pie Chart of Budget by Vendor`
- column chart rendered as `Column Chart of Budget by Vendor`
- line chart rendered as `Line Chart of Budget by Vendor`
- `Event Planning` list opened and rendered sample rows without a visible query failure

## Generator Rules Learned

- Preserve chart control ids and include them in `Resource.ReportIds`.
- Keep chart runtime binding in `page.exts[]`; do not move it into the page control `attrs`.
- Remap `exts[].attr.ListID` and `ListSetID` to the generated local list and root ids.
- Preserve `settings.rows[]` and `settings.values[]` field references by `fieldName`.
- Validate chart row/value field references against the source list fields.
- Use a fresh local numeric ID family for each import test.
- Preserve large numeric ids as strings by generating from decoded app-def JSON.
- Preserve native Title metadata on the local list.

## Known Gaps

- Export-back comparison remains open.
- Only one simple pie, one column, and one line chart are proven.
- Dashboard filters are still unproven and should be studied in a separate isolated package.
- More chart styling options should be learned one change at a time.
