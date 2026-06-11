# Validator Rules

Use the project validators rather than copying them into this skill:

```bash
node validate-yap-package.js <resource-or-yap> --mode generator --stage final
node validate-yap-graph.js <resource-or-yap> --mode generator --stage final
node build-yap-wrapper.js <resource.json> <output.yap> --title "<title>" --validation-mode generator
```

## Minimal Dashboard Checks

For an empty dashboard-only app:

- root app/listset exists
- root app `LayoutView` parses
- root navigation has at least one `Type: 103` item
- each dashboard navigation item resolves to a root `Data.Item.Layouts[]` page
- dashboard layout has `Type: 103`
- dashboard `LayoutView` is `null`
- dashboard `LayoutInResources` is an array
- empty dashboard `LayoutInResources` is allowed only when `Ext2` parses as `{ "src": true }` and dashboard `LayoutID` is in `ReplaceIds`
- `AppTags`, `AppMetadatas`, `AppThemes`, and `AppComponents` are arrays even when empty
- `AppThemes: []` is a warning for minimal dashboard-only apps, not a hard failure

## Rich Dashboard Checks

When embedded page JSON or widgets are introduced:

- `LayoutInResources[].Resource` parses as JSON
- inline dashboard page resources may use `LayoutInResources[0].ID = RefId = LayoutID` when copied from the static simple-elements export pattern
- page has `children`, `attrs`, `title`, `ver`, `filterVars`, and `tempVars`
- populated `exts` is an array
- `save_var` references resolve to `tempVars`
- dashboard data-source `ListID` values resolve to package lists or reports
- `opendashboard` actions resolve to package Type `103` pages
- external form/listset actions are reported as dependencies in compatibility mode and errors in generator mode

## Current Root Cause Finding

The prior failing generator path added child lists, embedded page JSON, widgets, and dashboard `exts` before proving the empty dashboard shell. The working minimal export shows the safe first generated package should contain only the root app/listset and empty Type `103` dashboard layout.

The second proven path adds static page JSON only: containers, headings, rich text, buttons, icons, flex grids, divider, pictures, and empty `exts`.

The third proven path adds one local list, summary controls, and a dashboard data table.

The fourth proven path adds pie, column, and line chart widgets backed by the same local list.

The fifth proven path adds search, radio, and range filter controls plus chart conditions bound to page `filterVars`. This path is validation-proven and runtime-proven for import/open/render/source-list smoke testing.

## Data-Bound Dashboard Checks

For the proven local-list summary/table pattern:

- `data-list` controls resolve `attrs.data.list.ListID` to a packaged child list
- dashboard `exts[].attr.ListID` resolves to a packaged list
- dashboard `exts[].i` resolves to an actual page control id
- dashboard `exts[].i` is included in `Resource.ReportIds` when `ReportIds` is populated
- local sample row IDs, including `ListDatas` object keys, are included in `ReplaceIds`
- generated child list Title metadata remains `Status: 0`, `IsSystem: true`, `IsIndex: true`

## Chart Widget Checks

For the proven local-list pie/column/line chart pattern:

- chart controls use proven page control types: `pie-chart`, `bar-chart`, or `line-chart`
- chart `exts[]` entries use proven keys: `pie-chart`, `bar-chart`, or `line-chart`
- chart `exts[].i` resolves to a matching page control id
- chart `exts[].i` is included in `Resource.ReportIds` when `ReportIds` is populated
- chart `exts[].attr.ListID` resolves to a packaged list
- chart `exts[].attr.settings.rows[]` field names resolve to fields on the source list
- chart `exts[].attr.settings.columns[]` field names resolve to fields on the source list when present
- chart `exts[].attr.settings.values[]` field names resolve to fields on the source list or known system fields such as `ListDataID`
- chart type mappings remain explicit: pie `chartType: "0"`, line `chartType: "1"`, column/bar `chartType: "2"`

## Filter Control Checks

For the studied search/radio/range filter pattern:

- page `filterVars` is an array
- each filter control `binding` that starts with `__filter_` resolves to a page `filterVars[].id`
- radio filter `attrs.data.list.ListID` resolves to a packaged list
- condition `left` field names resolve to the source list fields
- condition variable expression `name` resolves to page `filterVars`
- condition variable expression `id` equals `__filter_` plus `name`
- nested condition groups are validated recursively
