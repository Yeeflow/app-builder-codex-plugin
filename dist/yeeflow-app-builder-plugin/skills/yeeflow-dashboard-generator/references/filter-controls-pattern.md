# Filter Controls Pattern

Use this after the local data-bound chart widget pattern is already proven.

Source of truth: `Generated Dashboard Chart Widgets v4.yap`.

Generated validation package: `generated-dashboard-filter-controls-v5.yap`.

Runtime result boundary: `generated-dashboard-filter-controls-v5.yap` imported, opened, rendered search/radio/range filter controls, rendered summary/table/chart content, and opened the local source list with sample rows. Interactive filtering behavior, click-apply refresh, and reset behavior still require focused runtime proof.

Additional export-learning sources: `Sales_Management_AD.yap` and `CRM - Customer relationship management.yap`, studied in `docs/studies/data-filter-controls.md`.

Export-proven dashboard Data Filter control types from `Sales_Management_AD.yap`:

- `check-filter` for Checkbox filter
- `select-filter` for Select filter
- `range-filter` for Range filter
- `check-range` for Check range
- `date-filter` for Date filter
- `relative-period` for Relative period
- `apply-button` for Apply button
- `remove-filers` for Remove filters in this sample export

`Sales_Management_AD.yap` also proves filter variables consumed by both dashboard `attrs.data.filter[]` controls and `page.exts[].attr.settings.Conditions[]` report/chart conditions. It includes unresolved stale chart references on the `Dashboard` page, so generated packages must validate every downstream filter variable reference before handoff.

Export-proven dashboard Data Filter control types from `CRM - Customer relationship management.yap`:

- `search-filter` for Search filter
- `radio-filter` for Radio filter
- `hierarchy-filter` for Hierarchy filter
- `sorting-filters` for Sorting filter in this sample export
- `apply-button` for Apply button

The CRM export proves additional consumer paths: Search filters feed dashboard `attrs.data.fulltext[]`, Hierarchy filters feed `attrs.data.filter[]`, Sorting filters feed `attrs.data.sortingfilter[]`, and report/chart extension conditions continue to use `page.exts[].attr.settings.Conditions[]`.

## App Shape

- one root app/listset
- one Type `103` dashboard layout
- one local child data list
- two summary controls
- one dashboard data table
- three chart widgets
- one filter container
- one search filter
- one radio filter
- one range filter
- no approval forms
- no AI modules, connections, document libraries, or external dependencies

## Filter Variables

The dashboard page declares filter variables in `filterVars`:

- `filter_Search`
- `filter_Radio_Vendor`
- `filter_Range_BudgetNumber`

Filter controls bind to these variables with `binding: "__filter_" + filterVarId`.

`Sales_Management_AD.yap` confirms the same bridge for additional value-producing Data Filter controls. Apply Button and Remove Filters are special controls: they do not bind like normal value-producing filters. Click-apply filters use `attrs.apply_t = "2"` and reference an Apply button through `attrs.apply_btn`.

## Filter Controls

Search filter:

- `type: "search-filter"`
- `label: "Search filter"`
- `binding: "__filter_filter_Search"`
- CRM export settings include `attrs.placeholder`, optional `attrs["minnumber-letters"]`, optional `attrs.apply_t`, and optional `attrs.apply_btn`; consumers can reference Search variables in `attrs.data.fulltext[]`

Radio filter:

- `type: "radio-filter"`
- `label: "Radio filter"`
- `binding: "__filter_filter_Radio_Vendor"`
- `attrs.data.list` points to the local source list
- `attrs.display_f: "Text7"`
- `attrs.value_f: "Text7"`
- `attrs.displayStyle: "dropdown"`
- `attrs.data.sort[0].SortName: "Text7"`
- CRM export settings also include `attrs.ps`, `attrs.layout`, `attrs.search-enable`, `attrs.more-enable`, `attrs.more-text`, `attrs.less-text`, and `attrs.search-placeholder`; one Radio filter uses click-apply wiring

Hierarchy filter:

- `type: "hierarchy-filter"`
- `binding: "__filter_<filterVarId>"`
- list-backed hierarchy settings include `attrs.data.list`, `attrs.display_f`, `attrs.value_f`, `attrs.parent_f`, and `attrs.child_f`
- optional settings include `attrs.parentId`, `attrs.multiple`, `attrs["hierarchical-select"]`, `attrs.type`, `attrs.categoryId`, and `attrs.source`
- use only when source data has a hierarchy relationship

Sorting filter:

- CRM export type is `sorting-filters`
- `binding: "__filter_<filterVarId>"`
- `attrs.data.list` points to the sorted source list
- `attrs.sort_list[]` entries include `mapkey`, `title`, `orderby`, and `order`
- downstream data-list consumers reference the filter variable in `attrs.data.sortingfilter[]`

Range filter:

- `type: "range-filter"`
- `label: "Range filter"`
- `binding: "__filter_filter_Range_BudgetNumber"`
- numeric display and behavior settings live in `attrs`
- studied values include `number_max: 100000`, `number_step: 1000`, `prefix.value: "USD "`, `displayThousandths: "1"`, and `rounded-to: "0"`

Additional `Sales_Management_AD.yap` export-proven controls:

- Checkbox filter: `type: "check-filter"`, `binding: "__filter_<filterVarId>"`, options from `attrs.data.list`, `attrs.display_f`, `attrs.value_f`, optional `attrs.data.filter[]`, and display settings such as `search-enable`, `more-enable`, and `dropdown-enable`.
- Select filter: `type: "select-filter"`, `binding: "__filter_<filterVarId>"`, options from `attrs.data.list`, `attrs.display_f`, and `attrs.value_f`.
- Date filter: `type: "date-filter"`, `binding: "__filter_<filterVarId>"`; downstream date-field conditions use the filter variable expression in condition `right`.
- Check range: `type: "check-range"`, `binding: "__filter_<filterVarId>"`, with `attrs.options[]` range entries. Downstream consumer shape remains unproven in this export.
- Relative period: `type: "relative-period"`, `binding: "__filter_<filterVarId>"`, with `attrs["choice-options"][]`. Downstream consumer shape remains unproven in this export.
- Apply button: `type: "apply-button"`; referenced by click-apply filters through `attrs.apply_btn`.
- Remove filters: exported as `type: "remove-filers"` in this sample. No explicit reset target shape was visible, so clear-all vs selected-reset behavior remains runtime-sensitive.

## Chart Conditions

Filter controls affect charts through `page.exts[].attr.settings.Conditions`.

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

Rules:

- expression `name` must match a page `filterVars[].id`
- expression `id` must be `__filter_` plus the expression `name`
- condition `left` must be a field on the referenced source list
- nested condition groups use `conditions[]` and must be validated recursively

Observed chart condition counts:

- pie chart: 3 conditions, bound to search, radio, and range filters
- column chart: 4 top-level conditions, including radio/range filters plus nested static RSVP conditions
- line chart: 2 conditions, bound to radio and range filters

## ReplaceIds

`Resource.ReplaceIds` remains local numeric resource ids only.

Do not include UUID-like filter control ids or chart/summary/page-builder control ids in `ReplaceIds` unless a future export proves Yeeflow treats them as remappable resources.

## Validator Rules

Validators should catch:

- page `filterVars` is an array
- filter control `binding` resolves to a page `filterVars[].id`
- radio filter `attrs.data.list.ListID` resolves to a packaged list
- search filter downstream `attrs.data.fulltext[]` variable references resolve
- hierarchy filter source list/display/value/parent/child fields resolve when list-backed
- sorting filter `attrs.sort_list[].orderby` fields and downstream `attrs.data.sortingfilter[]` variable references resolve
- condition `left` fields resolve to the referenced source list fields
- condition variable expression `name` resolves to page `filterVars`
- condition variable expression `id` equals `__filter_` plus `name`
- nested condition groups are checked recursively
- Data Filter controls that bind with `__filter_` must resolve to `page.filterVars[].id`
- click-apply filters with `attrs.apply_t = "2"` must reference an existing `apply-button` through `attrs.apply_btn`
- Remove filters explicit reset targets must resolve when present; missing/unknown target structure should warn first
- unknown Data Filter control types should warn first

## Stop Conditions

Stop before generation if:

- a filter control binding cannot be matched to `filterVars`
- a chart condition references a missing filter variable
- a condition left field does not exist on the source list
- a radio filter source list is missing from `Data.Childs[]`
- a hierarchy source/list field reference is missing
- a sorting option points to an unknown field
- package validation, graph validation, or wrapper round-trip checks fail
- runtime testing is required but has not been explicitly authorized

## Runtime Checklist

For each newly generated dashboard `.yap` in this learning loop, import-test after local validation when the user has authorized runtime testing.

Confirm:

- import metadata parses expected name and description
- app appears in Shared Workspace
- dashboard opens
- filter controls render
- summary/table/chart content renders
- source list opens without a visible `datas/query` failure
- deeper interactive filter behavior is tested before claiming dynamic filtering is fully proven
