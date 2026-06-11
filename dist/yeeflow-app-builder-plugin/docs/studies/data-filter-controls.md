# Data Filter Controls Export Study

Proof boundary: dashboard Data Filter schema across `Sales_Management_AD.yap` and `CRM - Customer relationship management.yap` is export-proven only. Help Center behavior is product-documented. Approval-form and data-list-form applicability is product-documented only in this pass. Runtime behavior is not runtime-proven.

## Source

- Export path: `<downloads>/Sales_Management_AD.yap`
- Follow-up export path: `<downloads>/CRM - Customer relationship management.yap`
- Repository branch: `codex/data-filter-controls-learning`
- Follow-up branch: `codex/data-filter-controls-crm-learning`
- Target dashboard pages: `Dashboard`, `Data Report`
- CRM follow-up target dashboard page: `Dashboard`
- Original export handling: decoded read-only into ignored `.tmp/` only; raw `.yap` and decoded payloads are not committed.
- Privacy handling: normalized references use placeholders for app/list/page/control IDs, data sources, labels, and fields where needed.

## Help Center Context

Reviewed collection: <https://<yourdomain>.yeeflow.com/<redacted-path>>

The Help Center currently lists 14 Data Filter articles: overview, apply type, Search Filter, Select Filter, Checkbox Filter, Radio Filter, Range Filter, Check Range, Date Filter, Relative Period, Apply Button, Remove Filters, Hierarchy filter, and Sorting filter.

Product-documented concepts:

- Data Filter controls can be added to approval forms, list forms, and dashboards.
- Most value-producing filters bind to a filter variable. The filter variable stores the selected filter condition and can be used by data-bound controls.
- Data-bound consumers include data tables, collections/news/gallery-style controls, document library controls, lookup/lookup list controls in approval forms, and dashboard/data-list-form analytics controls such as Pie Chart, Column Chart, Line Chart, Gauge, Funnel Chart, Color Block Heatmap, Summary, and Pivot Table.
- Apply type has two documented modes: `Value change` and `Click on Apply Button`. In exports studied here, `attrs.apply_t = "2"` maps to `Click on apply button`; missing/unspecified apply type is treated as default/unspecified and should not be overclaimed as runtime behavior.
- Apply Button and Remove Filters are special filter-related controls rather than normal value-producing filters.
- Checkbox-style multi-value variables should be consumed with multi-value-compatible operators such as In/Not In; Date Filter variables internally carry the date-range semantics and are product-documented as used with an Equal condition on a date field.

## Export Inventory

| Page | Page ID | Total controls inspected | Data Filter controls | Types found | Filter variables | Apply types found | Apply buttons | Remove filters | Consumers using filter variables | Affected data sources | Unresolved references | Proof |
| --- | --- | ---: | ---: | --- | ---: | --- | ---: | ---: | ---: | --- | --- | --- |
| Dashboard | `<page-id>` | 51 | 8 | Checkbox filter, Date filter, Range filter, Check range, Relative period, Select filter, Apply button, Remove filters | 10 | Click on apply button; default/unspecified | 1 | 1 | 2 | `<list:5>` | 2 stale chart references to undeclared `filter_4` / `filter_5` | export-proven with warnings |
| Data Report | `<page-id>` | 56 | 3 | Checkbox filter, Date filter | 7 | default/unspecified | 0 | 0 | 7 | `<list:5>`, `<list:7>` | none found | export-proven |

Export-proven from this sample:

- Checkbox filter, exported as `check-filter`
- Select filter, exported as `select-filter`
- Range filter, exported as `range-filter`
- Check range, exported as `check-range`
- Date filter, exported as `date-filter`
- Relative period, exported as `relative-period`
- Apply button, exported as `apply-button`
- Remove filters, exported in this sample as `remove-filers`

Not found in the Sales sample, then covered by the CRM follow-up:

- Search filter: export-proven from CRM Dashboard.
- Radio filter: export-proven from CRM Dashboard.
- Hierarchy filter: export-proven from CRM Dashboard.
- Sorting filter: export-proven from CRM Dashboard.

## 12-Control Coverage

| Product control | Export status | Export evidence | Runtime boundary |
| --- | --- | --- | --- |
| Search filter | export-proven | CRM Dashboard | not runtime-proven |
| Select filter | export-proven | Sales Dashboard | not runtime-proven |
| Checkbox filter | export-proven | Sales Dashboard and Data Report | not runtime-proven |
| Radio filter | export-proven | CRM Dashboard | not runtime-proven |
| Range filter | export-proven | Sales Dashboard | not runtime-proven |
| Check range | export-proven | Sales Dashboard | not runtime-proven |
| Date filter | export-proven | Sales Dashboard and Data Report | not runtime-proven |
| Relative period | export-proven | Sales Dashboard and CRM Dashboard | not runtime-proven |
| Hierarchy filter | export-proven | CRM Dashboard | not runtime-proven |
| Sorting filter | export-proven | CRM Dashboard, exported as `sorting-filters` | not runtime-proven |
| Apply button | export-proven | Sales Dashboard and CRM Dashboard | not runtime-proven |
| Remove filters | export-proven | Sales Dashboard, exported as `remove-filers` | not runtime-proven |

## Export Schema Pattern

Dashboard pages are Type `103` layouts with embedded page JSON in `Data.Item.Layouts[].LayoutInResources[0].Resource`. The embedded page JSON declares filter variables at:

```text
$.filterVars[]
```

Observed variable entries are minimal:

```json
{ "id": "filter_<name>", "idx": "<optional-uuid-like-id>" }
```

Value-producing filter controls bind through:

```text
<control>.binding = "__filter_" + filterVars[].id
```

The associated filter variable is therefore resolved by stripping the `__filter_` prefix from the control binding and matching it to `page.filterVars[].id`.

Downstream consumers reference filter variables in expression-token arrays:

```json
{
  "exprType": "variable",
  "valueType": "string",
  "id": "__filter_<filterVarId>",
  "type": "expr",
  "name": "<filterVarId>"
}
```

Consumer condition locations found:

- Data table/list-like dashboard control: `$.children[*].attrs.data.filter[]`
- Dashboard report/chart extensions: `$.exts[].attr.settings.Conditions[]`

The export uses condition fields such as `left`, `op`, `pre`, `right`, and `showCus`. Nested condition groups should be checked recursively.

## Export-Proven Controls

### Checkbox Filter

- Product name: Checkbox filter
- Export type: `check-filter`
- Binding path: `<control>.binding`
- Associated variable path: `$.filterVars[]`
- Option source path: `attrs.data.list`
- Option settings: `attrs.display_f`, `attrs.value_f`, `attrs.ps`, optional `attrs.data.filter[]`
- Display settings found: `layout`, `search-enable`, `more-enable`, `dropdown-enable`, `more-text`, `less-text`, label/field styling
- Apply type found: one `Click on apply button` through `attrs.apply_t = "2"` plus default/unspecified examples
- Downstream usage: table/data-list filters and dashboard report/chart extension conditions reference the variable with `__filter_` expression tokens
- Validation rule: binding must resolve to `page.filterVars[]`; option source list should resolve; downstream operators should be compatible with multi-select conditions
- Generation rule: generate checkbox filters only when a multi-select filter is needed and use multi-value-compatible downstream operators

### Select Filter

- Product name: Select filter
- Export type: `select-filter`
- Binding path: `<control>.binding`
- Option source path: `attrs.data.list`
- Option fields: `attrs.display_f`, `attrs.value_f`
- Apply type found: default/unspecified
- Downstream usage: one data table/list-like dashboard control consumes the selected value through a filter variable
- Validation rule: binding, option source list, display field, value field, and downstream filter variable references must resolve
- Generation rule: use for single-value selection when a source list field provides stable display/value fields

### Range Filter

- Product name: Range filter
- Export type: `range-filter`
- Binding path: `<control>.binding`
- Settings found: `attrs.number_max`, slider/input/value styling
- Apply type found: default/unspecified
- Downstream usage: no downstream consumer in this export used the range variable
- Validation rule: binding must resolve; variable shape/operator compatibility remains warning-first until a consumer example is export-proven
- Generation rule: do not generate downstream range conditions from this sample alone unless another export/runtime proof maps the operator shape

### Check Range

- Product name: Check range
- Export type: `check-range`
- Binding path: `<control>.binding`
- Settings found: `attrs.options[]` with min/max range entries and optional `attrs.prefix`
- Apply type found: default/unspecified
- Downstream usage: no downstream consumer in this export used the check-range variable
- Validation rule: binding must resolve; option range entries should include min/max when generated
- Generation rule: keep downstream condition wiring unproven until a consumer condition is captured

### Date Filter

- Product name: Date filter
- Export type: `date-filter`
- Binding path: `<control>.binding`
- Settings found: `attrs.layout`, edit/label/common styling
- Apply type found: default/unspecified
- Downstream usage: `Data Report` report extensions consume the date filter variable in date-field conditions; `Dashboard` data table/list-like control also consumes a date-like variable
- Validation rule: binding and downstream filter variable references must resolve; date-filter downstream operators should be warning-first unless a target consumer/operator shape is export-proven
- Generation rule: use a date field condition and bind the `right` expression token to the date filter variable

### Relative Period

- Product name: Relative period
- Export type: `relative-period`
- Binding path: `<control>.binding`
- Settings found: `attrs.choice-options[]`, layout and choice styling
- Apply type found: default/unspecified
- Downstream usage: no downstream consumer in this export used the relative-period variable
- Validation rule: binding must resolve; supported choice-option tokens should remain export-backed
- Generation rule: do not invent relative-period condition schema beyond the exported control settings until a consumer example is captured

### Apply Button

- Product name: Apply button
- Export type: `apply-button`
- Binding path: none found; it is referenced by filter controls through `attrs.apply_btn`
- Export-proven association: one `check-filter` uses `attrs.apply_t = "2"` and `attrs.apply_btn = <apply-button-control-id>`
- Behavior boundary: product-documented as the trigger for click-apply filters; actual runtime refresh behavior is not proven in this pass
- Validation rule: every `attrs.apply_btn` must resolve to an existing `apply-button` control id
- Generation rule: when any filter uses click-apply mode, generate an Apply button and wire every click-apply filter to it

### Remove Filters

- Product name: Remove filters
- Export type found: `remove-filers`
- Binding path: none found
- Explicit reset targets: none visible in this sample
- Behavior boundary: product-documented reset behavior; export proves the special control exists but not whether this instance clears all filters or selected filters
- Validation rule: explicit reset targets must resolve when present; missing/unknown target structure should warn, not fail
- Generation rule: include only when a dashboard has multiple filters and a reset action is useful; keep exact target/reset schema warning-first until a target-bearing export is captured

## Downstream Consumers

`Dashboard` contains one data table/list-like consumer that resolves three filter variables:

- checkbox filter variable to a text field with operator `9`
- date filter variable to a date-like field with operator `0`
- select filter variable to a text field with operator `0`

`Dashboard` also contains one chart/report extension with two unresolved stale filter variable references (`filter_4`, `filter_5`). Those references do not resolve to `Dashboard` page `filterVars[]`, so they should be treated as an export warning and a generated-package validator error.

`Data Report` contains seven dashboard report/chart extension consumers. They use three resolved filter variables:

- `filter_customers`
- `filter_productline`
- `filter_orderdate`

Observed report/chart extension condition path:

```text
$.exts[].attr.settings.Conditions[]
```

Each dynamic filter condition uses `right` as an expression-token array whose `id` is `__filter_<filterVarId>` and whose `name` is the filter variable id.

## Generation Rules

- Define `page.filterVars[]` before any filter control or consumer references them.
- Bind value-producing Data Filter controls with `binding: "__filter_" + filterVarId`.
- Do not treat Apply button or Remove filters as value-producing filter controls.
- Use `attrs.apply_t = "2"` only with a valid `attrs.apply_btn` pointing to an `apply-button`.
- Use value-change/default mode for lightweight filters and click-apply mode when multiple or heavier filters should avoid repeated refreshes.
- Wire downstream `attrs.data.filter[]` or `exts[].attr.settings.Conditions[]` to filter variables through expression-token arrays.
- Validate the condition left field against the consumer data source.
- Generate only export-proven filter control types and settings. Sales proves Select, Checkbox, Range, Check range, Date, Relative period, Apply button, and Remove filters. CRM proves Search, Radio, Hierarchy, and Sorting. Keep any settings not seen in these exports as product-documented or unproven until later evidence.
- Treat `remove-filers` as the observed export spelling for this sample, while product terminology remains Remove filters.

## Validation Rules

- `page.filterVars` must be an array when present.
- Every value-producing Data Filter control binding must resolve to `page.filterVars[].id`.
- Every downstream `__filter_` expression must resolve to `page.filterVars[].id`.
- Expression `id` must equal `__filter_` plus expression `name`.
- Click-apply filters must reference an existing `apply-button` control.
- Remove filters reset targets must resolve when explicit targets are present.
- Unknown filter control types should warn first.
- Unsupported filter variable shapes should warn first unless an export proves the shape invalid.
- Generated final packages should treat unresolved filter variable references as validation errors.

## Normalized References

Created under `docs/studies/normalized/data-filter-controls/`:

- `data-filter-variable-definition.normalized.json`
- `data-filter-checkbox-control.normalized.json`
- `data-filter-select-control.normalized.json`
- `data-filter-range-control.normalized.json`
- `data-filter-check-range-control.normalized.json`
- `data-filter-date-control.normalized.json`
- `data-filter-relative-period-control.normalized.json`
- `data-filter-apply-button.normalized.json`
- `data-filter-remove-filters.normalized.json`
- `data-filter-consumer-condition.normalized.json`
- `data-filter-consumer-chart.normalized.json`
- `data-filter-consumer-table.normalized.json`
- `data-filter-click-apply-binding.normalized.json`
- `data-filter-value-change-binding.normalized.json`

The Sales export did not provide normalized refs for Search, Radio, Hierarchy, or Sorting filters; the CRM follow-up refs below cover those product controls.

## CRM Dashboard Follow-up: Search, Radio, Hierarchy, and Sorting Filters

Source export: `<downloads>/CRM - Customer relationship management.yap`

Target page: `Dashboard`

CRM Dashboard inventory:

- Total controls inspected: 75
- Data Filter controls found: 15
- Filter variables found: 14
- Search filters: 3
- Radio filters: 5
- Hierarchy filters: 4
- Sorting filters: 1
- Apply buttons: 1
- Remove filters: 0
- Downstream consumers using filter variables: 8
- Unresolved filter references: none found in the CRM Dashboard target page

The CRM Dashboard also includes one Relative period filter; that control was already export-proven from the Sales export, so the CRM pass primarily extends the missing Search, Radio, Hierarchy, and Sorting controls.

### Search Filter

- Product name: Search filter
- Export type: `search-filter`
- Settings path: `<control>.attrs`
- Associated filter variable path: `$.filterVars[]`
- Binding path: `<control>.binding = "__filter_" + filterVarId`
- Settings found: `attrs.placeholder`, optional `attrs["minnumber-letters"]`, optional `attrs.apply_t`, optional `attrs.apply_btn`
- Apply type found: default/unspecified and `Click on apply button` through `attrs.apply_t = "2"`
- Option/source behavior: no option source list; the search text is stored in the filter variable
- Downstream consumers: dashboard data-list control `attrs.data.fulltext[]` entries reference Search variables through expression-token arrays
- Value shape: expression token in `fulltext[].value[]` with `id = "__filter_<filterVarId>"` and `name = "<filterVarId>"`
- Generation rule: use Search filter for text/fulltext search across one or more fields; configure `minnumber-letters` only when a minimum input length is desired; use click-apply mode for heavier searches
- Validation rule: Search filter binding must resolve to `page.filterVars[]`; every `fulltext[].value[]` filter variable must resolve and use the matching `__filter_` id
- Proof level: export-proven dashboard schema, not runtime-proven

### Radio Filter

- Product name: Radio filter
- Export type: `radio-filter`
- Settings path: `<control>.attrs`
- Associated filter variable path: `$.filterVars[]`
- Binding path: `<control>.binding = "__filter_" + filterVarId`
- Option/source behavior: `attrs.data.list` points to an option source list; `attrs.display_f` selects the displayed field; `attrs.value_f` selects the stored value field; `attrs.data.sort[]` can order options
- Settings found: `attrs.ps`, `attrs.layout`, `attrs.search-enable`, `attrs.more-enable`, `attrs.more-text`, `attrs.less-text`, `attrs.search-placeholder`, `attrs.displayStyle`, optional click-apply settings
- Apply type found: default/unspecified and `Click on apply button` through `attrs.apply_t = "2"`
- Downstream consumers: no CRM downstream condition consumed a Radio variable in the data-list table, but dashboard report/chart extension conditions consume the existing `filter_period` and one radio-like condition was observed in CRM report extension conditions. Treat data-list consumer wiring for Radio as the same filter-variable expression bridge but keep exact operator choice field-specific.
- Value shape: single selected option value from `attrs.value_f`
- Generation rule: use Radio filter for single-choice filtering where choices come from a list or reference table; use `displayStyle: "dropdown"` only when a dropdown presentation is desired; use search/more settings for longer option lists
- Validation rule: Radio binding, option source list, display field, value field, and any downstream variable expression must resolve
- Proof level: export-proven dashboard schema, not runtime-proven

### Hierarchy Filter

- Product name: Hierarchy filter
- Export type: `hierarchy-filter`
- Settings path: `<control>.attrs`
- Associated filter variable path: `$.filterVars[]`
- Binding path: `<control>.binding = "__filter_" + filterVarId`
- Hierarchy settings found: optional `attrs.parentId`, `attrs.multiple`, `attrs["hierarchical-select"]`, `attrs.type`, `attrs.categoryId`, `attrs.source`
- List-backed hierarchy settings found: `attrs.data.list`, `attrs.data.sort[]`, `attrs.display_f`, `attrs.value_f`, `attrs.parent_f`, `attrs.child_f`
- Apply type found: default/unspecified
- Downstream consumers: dashboard data-list control `attrs.data.filter[]` references Hierarchy variables in expression-token arrays. One list-backed hierarchy uses a child/self field relationship through `child_f` and `parent_f`.
- Value shape: selected hierarchy node value(s), with multiple selection visible through `attrs.multiple = true`
- Generation rule: use Hierarchy filter only when the source data has a hierarchy relationship. For list-backed hierarchies, configure list, display/value fields, parent field, and child field together. Do not invent category/source modes beyond export-proven settings.
- Validation rule: Hierarchy binding must resolve; list-backed source list and fields should resolve; downstream consumer expressions must resolve; unsupported hierarchy source modes should warn first
- Proof level: export-proven dashboard schema, not runtime-proven

### Sorting Filter

- Product name: Sorting filter
- Export type: `sorting-filters`
- Settings path: `<control>.attrs`
- Associated filter variable path: `$.filterVars[]`
- Binding path: `<control>.binding = "__filter_" + filterVarId`
- Source behavior: `attrs.data.list` points to the data source being sorted
- Sorting options path: `attrs.sort_list[]`
- Sorting option shape: each option includes `mapkey`, `title`, `orderby`, and `order`
- Apply type found: default/unspecified
- Downstream consumers: dashboard data-list control `attrs.data.sortingfilter[]` references the Sorting variable through an expression-token array
- Value shape: selected sort option mapped to a field/order pair
- Generation rule: use Sorting filter when users need to choose between preconfigured sort orders. Each generated option should point to a real field and use `asc` or `desc`.
- Validation rule: Sorting filter binding must resolve; source list must resolve; every `sort_list[].orderby` should resolve to a source field when possible; every downstream `sortingfilter[]` expression must resolve to `page.filterVars[]`
- Proof level: export-proven dashboard schema, not runtime-proven

### CRM Apply Button

The CRM Dashboard includes one `apply-button`. Two filters use click-apply wiring:

- one Search filter with `attrs.apply_t = "2"` and `attrs.apply_btn`
- one Radio filter with `attrs.apply_t = "2"` and `attrs.apply_btn`

Generation and validation rule: one Apply button can be referenced by multiple click-apply filters. Every `attrs.apply_btn` must resolve to an existing `apply-button` control id.

### CRM Downstream Consumers

The CRM Dashboard proves additional consumer paths:

- Search filters feed dashboard data-list `attrs.data.fulltext[]`.
- Hierarchy filters feed dashboard data-list `attrs.data.filter[]`.
- Sorting filter feeds dashboard data-list `attrs.data.sortingfilter[]`.
- Report/chart extension conditions continue to use `exts[].attr.settings.Conditions[]`.

The shared expression token rule remains:

```json
{
  "exprType": "variable",
  "id": "__filter_<filterVarId>",
  "name": "<filterVarId>"
}
```

### CRM Normalized References

Added under `docs/studies/normalized/data-filter-controls/`:

- `data-filter-search-control-crm.normalized.json`
- `data-filter-search-variable-crm.normalized.json`
- `data-filter-radio-control-crm.normalized.json`
- `data-filter-radio-variable-crm.normalized.json`
- `data-filter-hierarchy-control-crm.normalized.json`
- `data-filter-hierarchy-variable-crm.normalized.json`
- `data-filter-sorting-control-crm.normalized.json`
- `data-filter-sorting-variable-crm.normalized.json`
- `data-filter-crm-consumer-condition.normalized.json`
- `data-filter-crm-apply-binding.normalized.json`

These references use redacted list/control/page placeholders and do not include raw CRM data rows, customer names, emails, tenant IDs, or decoded payloads.
