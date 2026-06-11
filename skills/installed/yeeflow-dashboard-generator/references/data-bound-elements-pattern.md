# Data-Bound Dashboard Elements Pattern

Use this after the empty dashboard shell and static page-builder elements are already proven.

Source of truth: `Generated Dashboard Simple Elements v2.yap`.

Proven generated package: `generated-dashboard-data-bound-v3.yap`.

Runtime result: imported into `https://<yourdomain>.yeeflow.com`, opened as `Dashboard | Generated Dashboard Data Bound v3`, rendered two summary cards, rendered a data table, and opened the local `Event Planning` list without a visible query failure.

## App Shape

- one root app/listset
- one Type `103` dashboard layout
- one local child data list
- no approval forms
- no reports outside dashboard `ReportIds`
- no AI modules, connections, or document libraries
- app metadata arrays remain present, including empty `AppThemes` and `AppComponents`

## Dashboard Layout

Keep the proven static page shape:

- `Type: 103`
- `LayoutView: null`
- `Ext2: "{\"src\":true}"`
- `LayoutInResources[0].ID = LayoutID`
- `LayoutInResources[0].RefId = LayoutID`
- `LayoutInResources[0].Resource` is JSON string page content

Root navigation includes:

- duplicate dashboard entries targeting the dashboard `LayoutID`
- one `Type: 1` child list entry for the local data list

## Summary Control Pattern

Summary controls are split across page controls and page `exts`.

Page control:

- `type: "summary"`
- `id`: UUID-like control id
- visual settings live in `attrs.prefix`, `attrs.suffix`, `attrs.layout`, and `attrs.common`

Matching `page.exts[]` entry:

- `category: "___Pivot___"`
- `key: "summary"`
- `i`: the summary control id
- `attr.AppID`: app id
- `attr.ListID`: local source list id
- `attr.ListSetID`: root app/listset id
- `attr.settings.values[]`: aggregate fields such as `SUM` on `Decimal1` or `COUNT` on `ListDataID`
- `attr.settings.Conditions[]`: optional field-name filter conditions

`Resource.ReportIds` includes every summary `exts[].i`.

## Data Table Pattern

Dashboard data table control:

- `type: "data-list"`
- `label: "Data table"`
- `attrs.data.list.AppID`: app id
- `attrs.data.list.ListID`: local child list id
- `attrs.data.list.ListSetID`: root app/listset id
- `attrs.data.list.Type: 1`
- `attrs.data.list.Title`: local list title

The source list must be included under `Data.Childs[]`.

## ReplaceIds

Include every local package id:

- root app/listset id
- dashboard layout id
- child list layout id
- child list id
- child list field ids
- local sample row ids

Important: sample row ids can appear as `ListDatas` object keys. Generators must remap object keys as well as values.

Do not remap tenant/user metadata.

## Generation Rules

- Use a fresh local ID family for every import test.
- Preserve large numeric ids as strings.
- Build generated `Resource.Data` from decoded app-def JSON instead of plain-parsing the compressed `Resource.Data` string.
- Preserve summary `exts[]` and data-table `attrs.data.list` bindings through exact ID remapping.
- Keep generated native Title metadata: `Status: 0`, `IsSystem: true`, `IsIndex: true`.
- Normalize generated child list grid `LayoutView` with `layout`, `sort`, `query`, `rowColor`, and `filter`.
- Keep the data-bound baseline limited to summary/table binding until charts and filters are separately studied.

## Validator Rules

Validators should catch:

- dashboard control `attrs.data.list.ListID` resolves to a packaged list
- dashboard `exts[].attr.ListID` resolves to a packaged list
- dashboard `exts[].i` resolves to a page control id
- dashboard `exts[].i` appears in `Resource.ReportIds` when report ids are present
- every local list/layout/field/sample id appears in `ReplaceIds`
- generated Title field metadata is native/system/indexed

## Stop Conditions

Stop before generation if:

- summary `exts[].i` cannot be matched to a summary control id
- data table source list is missing from `Data.Childs[]`
- local sample row ids are not in `ReplaceIds`
- large numeric ids have become JavaScript numbers
- dashboard or child list query validators fail
