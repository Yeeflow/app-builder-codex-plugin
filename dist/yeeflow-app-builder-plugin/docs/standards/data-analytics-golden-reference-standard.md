# Data Analytics Golden Reference Standard

This standard defines the only approved Data Analytics templates for generated Yeeflow Dashboard pages and Data List forms.

## Approved Templates

- `data_analytics_pie_chart_with_title`
- `data_analytics_column_chart_with_title`
- `data_analytics_bar_chart_with_title`
- `data_analytics_line_chart_with_title`
- `data_analytics_area_chart_with_title`
- `data_analytics_pivot_table_standard`

Each template is stored as an export-shaped JSON artifact under `docs/reference/`. Generators must clone the approved template subtree and remap only the declared editable business regions. They must not create simplified chart or pivot lookalikes.

Each registry entry must include App Plan selection guidance:

- `summary`
- `suitableSourceResourceTypes`
- `whenToUse`
- `whenNotToUse`
- `requiredBusinessSignals`
- `requiredAppPlanDeclaration`
- `generationProof`
- `proofBoundary`

App Plan generation must use this guidance to select exactly one approved Data Analytics template for each Dashboard or Data List form analytics region. Selection is a business decision: match the business question, source data, grouping/axis fields, value/aggregate fields, and intended analysis pattern. Do not defer template choice to resource generation.

## Selection Patterns

- Pie chart: use for part-to-whole distribution across a small category set.
- Column chart: use for vertical comparison across short-label categories, priorities, teams, or periods.
- Bar chart: use for horizontal comparison, ranking, or longer category labels.
- Line chart: use for point-to-point trend movement over time or another ordered dimension.
- Area chart: use for trend movement where filled area emphasizes volume, magnitude, utilization, demand, capacity, or workload over time.
- Pivot table: use for cross-tab row/column/value matrix analysis.

## Surface Rules

Data Analytics templates may be used on:

- Dashboard pages.
- Data List forms.

Data Analytics templates must not be used on Approval forms because Approval forms do not support Data Analytics controls.

## Dashboard Page Layouts v1.1 Placement

When a Dashboard page uses `dashboard-page-layouts-v1.1`, Data Analytics templates must be placed inside one of the approved business section containers: `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`. They must not be placed directly under root `Content`, page title regions, `Operations`, KPI wrappers, Collection-only regions, or copied source-app shells.

When a Dashboard page uses `dashboard-page-layouts-workbench`, `dashboard-page-layouts-two-panel-workspace`, or `dashboard-page-layouts-three-panel-workspace`, grouped Data Analytics templates must be placed inside `chart_cards_section` under the approved working-area containers for that layout. Each `chart_cards_section` should contain no more than three Data Analytics templates. Remove `chart_cards_section` when no Data Analytics templates are planned.

## Fidelity Rules

For chart-with-title templates, the outer wrapper and all descendants are locked except:

- The chart container data-source binding.
- The title Text value.

For the pivot table template, the exported pivot-table style settings are locked. Only legal rows, columns, values, filters, and data-source binding may change.

## Runtime Binding Contract

Visible Data Analytics controls are not runtime-ready unless the containing layout resource also registers the Yeeflow chart or pivot runtime model. For every generated Pie, Column, Bar, Line, Area, or Pivot template instance:

- the visible chart or pivot control must have a stable control ID;
- the visible chart or pivot control must carry both `dataAnalyticsTemplateId` and `templateId` equal to the selected approved template ID;
- the visible chart or pivot control may set `runtimeModelProven: true` only after the full wrapper clone, `ReportIds[]`, `exts[]`, source metadata, rows/values field references, and cross-surface model contract have been materialized;
- `Resource.ReportIds[]` must include that exact control ID;
- `Resource.exts[]` must include an entry whose `i` equals that exact control ID;
- the entry must use `category: "___Pivot___"`;
- the entry `key` must be `pie-chart`, `bar-chart`, `line-chart`, or `PivotTable` according to the generated control type;
- `attr.AppID`, `attr.ListID`, and `attr.ListSetID` must identify the source app/list/root;
- chart entries must include `attr.chartType`;
- `attr.settings.rows[]` and `attr.settings.values[]` must be non-empty;
- every row, column, and value field reference must resolve to a real field on the selected source list/report;
- the visible control's `attrs.data.list` and `attrs.model.source` must both include `AppID`, `ListID`, and `ListSetID`, and those values must match the same source metadata in `Resource.exts[]`;
- the visible control's `attrs.data.groupBy`, `attrs.data.axisField`, `attrs.data.categoryField`, `attrs.model.categoryField`, and `attrs.series[].categoryField` must match `Resource.exts[].attr.settings.rows[]`;
- the visible control's `attrs.data.valueField`, `attrs.model.valueField`, `attrs.series[].valueField`, and `attrs.values[].field` must match `Resource.exts[].attr.settings.values[]`;
- count charts must use the runtime-proven real source field identity `ListDataID` plus aggregate metadata such as `COUNT`; `settings.values[]` entries for COUNT must set `field`, `fieldName`, `FieldName`, and `id` to `ListDataID`; generated field IDs or aliases such as `ListDataID_COUNT`, source field UUIDs, or display labels are invalid.

Template provenance without this runtime contract is only visual materialization and must fail generated-final preflight. A blank chart area caused by missing `exts[]`, missing `ReportIds[]`, or unresolved runtime field metadata is a generator defect and a signing blocker.

Generated-final validation must fail when:

- A Data Analytics control has no approved template provenance.
- A chart wrapper is missing.
- A pivot table does not preserve the approved template identity.
- A template appears on an Approval form.
- A Dashboard v1.1 page places an analytics template outside `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`.
- A generator emits an ad hoc chart/pivot control instead of cloning the approved template.
- A visible chart or pivot control is missing its `Resource.ReportIds[]` registration, matching `Resource.exts[]` runtime entry, source metadata, chart type, runtime settings, or resolvable source fields.
- A visible chart or pivot control has template marker drift, missing `runtimeModelProven`, missing or mismatched `attrs.data.list` / `attrs.model.source` source metadata, stale `attrs.model`/`attrs.series`/`attrs.values` field references, empty row/value model entries, or derived aggregate field IDs instead of real source fields plus aggregate metadata.
