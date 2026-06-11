# Generated Dashboard Baseline v5: Filter Controls

## Package

- source export studied: `<downloads>/Generated Dashboard Chart Widgets v4.yap`
- generated package: `generated-dashboard-filter-controls-v5.yap`
- generated resource: `generated-dashboard-filter-controls-v5-resource.json`
- generated app def: `generated-dashboard-filter-controls-v5-app-def.json`
- generator: `generate-dashboard-filter-controls-v5.mjs`

## What It Proves

This baseline proves a generated Yeeflow dashboard app can validate and package with:

- one root app/listset
- one Type `103` dashboard page
- one local child data list
- two data-bound `summary` controls
- one dashboard `data-list` table control
- three chart widgets: pie, column, and line
- three dashboard filter controls: search, radio, and range
- chart `Conditions` bound to dashboard filter variables

No approval form, report page, AI module, connection, or document library is included.

Runtime import has passed for this v5 package.

## Filter Control Pattern

The dashboard page `filterVars` array declares filter variables:

- `filter_Search`
- `filter_Radio_Vendor`
- `filter_Range_BudgetNumber`

Each filter control is a page-builder control with a `binding` that uses the `__filter_` prefix plus the filter variable id:

- search filter: `type: "search-filter"`, `binding: "__filter_filter_Search"`
- radio filter: `type: "radio-filter"`, `binding: "__filter_filter_Radio_Vendor"`
- range filter: `type: "range-filter"`, `binding: "__filter_filter_Range_BudgetNumber"`

The radio filter stores its source list in `attrs.data.list` and uses:

- `display_f: "Text7"`
- `value_f: "Text7"`
- `displayStyle: "dropdown"`
- `data.sort[0].SortName: "Text7"`

The range filter stores numeric display settings in attrs:

- `number_max: 100000`
- `number_step: 1000`
- `prefix.value: "USD "`
- `displayThousandths: "1"`
- `rounded-to: "0"`

## Chart Condition Pattern

Filter variables are consumed by chart `page.exts[]` entries under `attr.settings.Conditions`.

Variable expression shape:

```json
{
  "exprType": "variable",
  "valueType": "string",
  "id": "__filter_filter_Search",
  "type": "expr",
  "name": "filter_Search"
}
```

The expression `id` must equal `__filter_` plus the expression `name`, and the `name` must exist in page `filterVars`.

Observed chart bindings:

- pie chart has three filter-bound conditions:
  - `Title` with `filter_Search`
  - `Text7` with `filter_Radio_Vendor`
  - `Decimal1` with `filter_Range_BudgetNumber`
- column chart has two filter-bound conditions plus static nested RSVP conditions:
  - `Text7` with `filter_Radio_Vendor`
  - `Decimal1` with `filter_Range_BudgetNumber`
  - nested static `Text4` conditions for `Declined` or `Confirmed`
- line chart has two filter-bound conditions:
  - `Text7` with `filter_Radio_Vendor`
  - `Decimal1` with `filter_Range_BudgetNumber`

## ReplaceIds Rules

`Resource.ReplaceIds` remains the same local numeric resource family size as v4: 39 ids.

Include every local package id:

- root app/listset id
- dashboard layout id
- child list layout id
- child list id
- child list field ids
- local sample row ids, including `ListDatas` object keys

Do not include UUID-like filter controls, chart controls, summary controls, or page-builder control ids in `ReplaceIds` unless a future export proves Yeeflow treats them as remappable resources.

## Validation Results

- `node --check generate-dashboard-filter-controls-v5.mjs`: pass
- `node --check validate-yap-package.js`: pass
- package validation on resource: `pass_with_warnings`; only `APP_THEME_EMPTY`
- graph validation on resource: pass
- wrapper build: pass
- wrapper round-trip: wrapper JSON valid, Resource prefix/base64/gzip valid, Resource JSON valid, Resource.Data valid, decoded data equals source, package validation passes, graph validation passes
- package validation on wrapped `.yap`: `pass_with_warnings`; only `APP_THEME_EMPTY`
- graph validation on wrapped `.yap`: pass

## Runtime Results

Runtime environment: `https://<yourdomain>.yeeflow.com/`

Tested package: `generated-dashboard-filter-controls-v5.yap`

Result: pass.

Observed evidence:

- Yeeflow import parsed the package metadata and showed `Generated Dashboard Filter Controls v5`.
- The app imported successfully and appeared in Shared Workspace.
- The imported app opened at `Dashboard | Generated Dashboard Filter Controls v5`.
- The dashboard page rendered the search, radio, and range filter controls.
- Summary controls rendered `SGD 142500.00` and `20`.
- Dashboard table rows rendered.
- Pie, column, and line chart widgets rendered visible chart output.
- The local `Event Planning` source list opened successfully with sample rows; no visible `datas/query` failure was observed.

## Validator Rules Learned

- filter controls with `binding: "__filter_<id>"` must resolve to page `filterVars[].id`
- chart condition variable expression `name` must resolve to page `filterVars[].id`
- chart condition variable expression `id` must equal `__filter_` plus `name`
- condition `left` field names must resolve to source list fields, including nested condition groups
- existing chart row/value field reference checks still apply

## Known Gaps

- Export-back comparison has not been performed.
- Filter behavior should be tested interactively after import by changing search/radio/range values and confirming chart data updates.
- Only one search, one radio, and one range filter pattern are studied.
