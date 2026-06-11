# Custom Code Template Library Study

Source: `Custom Code templates.zip` extracted read-only to a temporary working folder.

This study inventories all 13 Yeeflow custom code templates before app generation. Runtime support is claimed only where runtime testing has actually observed render, interaction, writeback, or persistence behavior. Public form support remains untested and is not claimed for any template.

## Summary

| Template | Category | Business purpose | Planned safe contexts | Mode | Writable targets | Runtime proof |
| --- | --- | --- | --- | --- | --- | --- |
| activity-timeline | Dashboard / analytics | Show record events, changes, comments, and operational actions in chronological order. | dashboard, approvalForm, dataListForm | Read-only | none | Runtime-proven in showcase repair smoke for seeded dashboard/form activity rendering. |
| approval-decision-panel | Approval / workflow experience | Capture or display reviewer decision and comments in an approval context. | approvalForm | Interactive | decision/comment fields | Not tested: packaged on the review page, but an actual reviewer task context was not reached. |
| approval-timeline | Approval / workflow experience | Show approval history, actors, timestamps, decisions, and comments. | approvalForm, dataListForm | Read-only | none | Runtime-proven in showcase repair smoke for seeded approval-history rendering; live workflow-generated history remains deeper future testing. |
| checklist-compliance-block | Data entry / picker / selection | Render compliance checklist items and save checked state. | approvalForm, dataListForm | Interactive | saveToField | Runtime-proven in approval form smoke for checkbox interaction and JSON writeback. |
| dependent-selector | Data entry / picker / selection | Provide cascading parent-child selection from a source list. | approvalForm, dataListForm | Interactive | parentSaveToField, childSaveToField | Runtime-proven in showcase repair smoke for parent filtering, child selection, and output writeback. |
| distribution-chart-module | Dashboard / analytics | Render grouped category/count analytics from a Yeeflow data list. | dashboard | Read-only | none | Runtime-proven in showcase repair smoke for seeded request-status distribution rendering. |
| exception-alert-panel | Dashboard / analytics | Highlight anomalies, SLA breaches, missing data, and records needing attention. | dashboard, approvalForm, dataListForm | Read-only | none | Runtime-proven in showcase repair smoke for seeded exception alert rendering. |
| hierarchical-selector | Data entry / picker / selection | Render and select values from a tree structure. | approvalForm, dataListForm | Interactive | saveToField | Runtime-proven in showcase repair smoke for hierarchy rendering, selection, and output writeback. |
| kpi-card-set | Dashboard / analytics | Display configurable KPI cards from static JSON or mapped data. | dashboard, approvalForm, dataListForm | Read-only | none | Render-only proven in dashboard smoke with configured static values; data-bound KPI calculation is not proven. |
| multi-entry-tag-input | Data entry / picker / selection | Capture multiple tags, emails, IDs, labels, or SKUs as chips. | approvalForm, dataListForm | Interactive | saveToField | Runtime-proven in approval form smoke for add-tag interaction and JSON writeback. |
| related-record-summary-grid | Dashboard / analytics | Display related records inline as cards or table rows. | dashboard, approvalForm, dataListForm | Read-only | none | Runtime-proven in showcase repair smoke for seeded related-record rendering on dashboard/form. |
| smart-lookup-picker | Data entry / picker / selection | Search, select, and optionally manually add lookup records from a target list. | dashboard, approvalForm, dataListForm | Interactive | selectedValuesField/manualValuesField/combinedValuesField | Runtime-proven in prior focused app and retested in showcase approval form for search/select/writeback; dashboard visibility confirmed. Public form is not tested. |
| trend-chart-module | Dashboard / analytics | Render time-based list trends by day, week, or month. | dashboard | Read-only | none | Runtime-proven in showcase repair smoke for seeded dated request trend rendering. |

## Functional Classification

### Dashboard / analytics

- `kpi-card-set`
- `distribution-chart-module`
- `trend-chart-module`
- `exception-alert-panel`
- `related-record-summary-grid`
- `activity-timeline`

### Approval / workflow experience

- `approval-decision-panel`
- `approval-timeline`

### Data entry / picker / selection

- `smart-lookup-picker`
- `dependent-selector`
- `hierarchical-selector`
- `multi-entry-tag-input`
- `checklist-compliance-block`


## Showcase Repair Runtime Finding

The May 18, 2026 repair pass found that Yeeflow custom-code list-query templates should read imported row values by runtime FieldName keys such as `Text3` and `Datetime1`, not by display labels or generated internal labels. The generated showcase package also applies an embedding-time compatibility patch so query helpers recognize `response.listData`/`response.ListData` and retry broad `queryItems` calls without `selectedFields` when projected calls return no rows. This patch is generated-package wiring only; the original template source files remain unchanged.

## Export-Backed Custom Code Control Baseline

- Script source is embedded in `attrs["codein-script"]`.
- Input parameters are stored in `attrs["codein-script-param"]`.
- Dashboard writable outputs use `__temp_` targets.
- Approval form writable outputs use `__variables_` targets.
- Data-list custom form writable outputs use `__list_` targets.
- Public forms require separate export/runtime proof before generation claims.

## Template Details

### activity-timeline

Purpose: Show record events, changes, comments, and operational actions in chronological order.

Expected data source: Activity / timeline event list with relation, date, actor, title, detail, and status/type fields.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| sourceListId | variable | Yes | Activity list ID. | 203... |
| recordIdField | variable | Yes | Relation field. | CaseId |
| recordIdValue | variable | Yes | Current record id. |  |
| eventDateField | variable | Yes | Event timestamp. | CreatedTime |
| actorField | variable | Yes | Actor field. | Actor |
| titleField | variable | Yes | Event title. | ActivityTitle |
| descriptionField | variable | Yes | Event detail. | Description |
| statusField | variable | Yes | Status/type field. | ActivityType |
| titleText | string | No | Panel title. | Activity Timeline |
| maxItems | string | No | Max events. | 10 |
| emptyText | string | No | Empty text. | No activity yet |
| filterExpression | variable | No | Optional filter. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display
### approval-decision-panel

Purpose: Capture or display reviewer decision and comments in an approval context.

Expected data source: Approval form variables/fields for decision and comment values.

Expected output/writeback: Writes decision and comment to configured form variables/fields.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| decisionField | variable | Yes | Writable approval form field or variable used to save the selected decision value. |  |
| commentField | variable | Yes | Writable approval form field or variable used to save approver comments or reason text. |  |
| titleText | string | No | Panel title shown above the decision controls. |  |
| subtitleText | string | No | Optional helper text shown below the title. |  |
| approveLabel | string | No | Button label for the approve decision. Default is Approve. |  |
| rejectLabel | string | No | Button label for the reject decision. Default is Reject. |  |
| reviseLabel | string | No | Button label for the request-changes decision. Default is Request Changes. |  |
| defaultDecision | variable | Yes | Optional default decision code, such as approve, reject, or revise. Used only when no saved value exists. |  |
| requireCommentOnReject | variable | Yes | Whether Reject requires a comment before the decision value is saved. Supports true/false or dynamic expression. |  |
| requireCommentOnRevise | variable | Yes | Whether Request Changes requires a comment before the decision value is saved. Supports true/false or dynamic expression. |  |
| showCommentBox | variable | Yes | Whether the comment/reason text box is shown. Supports true/false or dynamic expression. |  |
| commentPlaceholder | string | No | Placeholder text shown inside the comment box. |  |
| panelStyle | string | No | Visual style: standard, compact, or bordered. Default is standard. |  |
| showStatusSummary | variable | Yes | Whether selected decision summary text is shown. Supports true/false or dynamic expression. |  |
| readonlyText | string | No | Text shown when the control is readonly and no decision has been saved. |  |
| decisionOptionsJson | variable | No | Optional JSON array for custom decisions. Each item can include code, label, tone, helper, and requireComment. |  |
| validationMessageReject | string | No | Optional message shown when Reject requires a comment. |  |
| validationMessageRevise | string | No | Optional message shown when Request Changes requires a comment. |  |

Runtime risks: Public form support is not proven and must not be claimed.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested
### approval-timeline

Purpose: Show approval history, actors, timestamps, decisions, and comments.

Expected data source: Approval history / timeline list filtered by current request id.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| sourceListId | variable | Yes | List containing approval history events. | 203... |
| recordIdField | variable | Yes | Field used to match the current approval record. | RequestId |
| recordIdValue | variable | Yes | Current record ID or expression value. |  |
| eventDateField | variable | Yes | Timestamp field. | CreatedTime |
| actorField | variable | Yes | Approver/actor field. | Approver |
| decisionField | variable | Yes | Decision/status field. | Decision |
| commentField | variable | Yes | Comment field. | Comment |
| titleText | string | No | Panel title. | Approval Timeline |
| subtitleText | string | No | Panel subtitle. | Review history |
| maxItems | string | No | Max events shown. | 8 |
| emptyText | string | No | Empty state text. | No history yet |
| filterExpression | variable | No | Optional query filter. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display
### checklist-compliance-block

Purpose: Render compliance checklist items and save checked state.

Expected data source: Static JSON checklist item configuration.

Expected output/writeback: Writes checklist JSON to the configured save target.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| itemsJson | variable | No | Checklist item array. | [{\ |
| saveToField | variable | Yes | Writable output field. | ChecklistJson |
| requireAllChecked | variable | Yes | Require all required items. | true |
| showProgress | variable | Yes | Show progress bar. | true |
| titleText | string | No | Panel title. | Compliance Checklist |
| subtitleText | string | No | Panel subtitle. | Confirm before submitting |
| emptyText | string | No | Empty text. | No checklist configured |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.; Writable targets must be bound with the correct context prefix and verified by save/persistence tests.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; writeback target exists and uses __temp_, __variables_, or __list_ according to context; source list exists and sample records cover non-empty display
### dependent-selector

Purpose: Provide cascading parent-child selection from a source list.

Expected data source: Source list with parent and child option fields.

Expected output/writeback: Writes parent and child selections to configured targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| dataListId | variable | Yes | Source list. | 203... |
| parentField | variable | Yes | Parent option field. | Country |
| childField | variable | Yes | Child option field. | State |
| parentSaveToField | variable | Yes | Writable parent output. | SelectedCountry |
| childSaveToField | variable | Yes | Writable child output. | SelectedState |
| titleText | string | No | Panel title. | Location |
| subtitleText | string | No | Panel subtitle. | Select country and state |
| maxItems | string | No | Max loaded records. | 500 |
| emptyText | string | No | Empty text. | No options |
| filterExpression | variable | No | Optional filter. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.; Writable targets must be bound with the correct context prefix and verified by save/persistence tests.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; writeback target exists and uses __temp_, __variables_, or __list_ according to context; source list exists and sample records cover non-empty display
### distribution-chart-module

Purpose: Render grouped category/count analytics from a Yeeflow data list.

Expected data source: Data list queried and grouped by a category/status field.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| dataListId | variable | Yes | Target Yeeflow data list ID used as the chart data source. Supports expression editor values. |  |
| categoryField | variable | Yes | Field ID/name used to group records, such as Status, Department, Region, Owner, or Category. |  |
| titleText | string | No | Optional module title shown above the chart. |  |
| subtitleText | string | No | Optional helper text shown below the title. |  |
| chartType | string | No | Chart mode: donut, pie, horizontalBar, bar, or verticalBar. Default is donut. |  |
| maxCategories | string | No | Maximum number of category groups shown before remaining groups are combined as Other. Default is 8. |  |
| showLegend | variable | Yes | Whether the legend/count list is shown. Supports true/false or dynamic expression. |  |
| showCount | variable | Yes | Whether record counts are shown in chart labels and legend rows. Supports true/false or dynamic expression. |  |
| emptyText | string | No | Text shown when no records or no category values are available. |  |
| colorMode | string | No | Color palette: yeeflow, soft, status, or slate. Default is yeeflow. |  |
| sortMode | string | No | Sort behavior: countDesc, countAsc, labelAsc, labelDesc, or source. Default is countDesc. |  |
| filterExpression | variable | No | Optional Yeeflow query filter object/array/JSON from expression editor. Leave blank for all records. |  |
| height | string | No | Optional chart area height in pixels. Default is 280. |  |
| pageSize | string | No | Maximum records queried for aggregation. Default is 500. |  |
| unknownLabel | string | No | Label used when the category field is empty. Default is Unknown. |  |
| otherLabel | string | No | Label used when categories beyond Max Categories are combined. Default is Other. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display
### exception-alert-panel

Purpose: Highlight anomalies, SLA breaches, missing data, and records needing attention.

Expected data source: Exception/source list with title, severity, description, and optional rules.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| sourceListId | variable | Yes | Source list ID. | 203... |
| rulesJson | variable | No | Optional rule array. | [{\ |
| titleField | variable | Yes | Alert title field. | Title |
| severityField | variable | Yes | Severity field. | Severity |
| descriptionField | variable | Yes | Alert message field. | Description |
| titleText | string | No | Panel title. | Exceptions |
| subtitleText | string | No | Panel subtitle. | Records needing attention |
| showSeverity | variable | Yes | Show severity styling. | true |
| maxItems | string | No | Max alerts. | 8 |
| emptyText | string | No | Empty text. | No exceptions found |
| filterExpression | variable | No | Optional filter. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display
### hierarchical-selector

Purpose: Render and select values from a tree structure.

Expected data source: Hierarchy list with id, parent id, label, and value fields.

Expected output/writeback: Writes selected node value(s) to configured save target.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| dataListId | variable | Yes | Hierarchy source list. | 203... |
| idField | variable | Yes | Unique ID field. | ListDataID |
| parentField | variable | Yes | Parent ID field. | ParentId |
| labelField | variable | Yes | Display label field. | Title |
| valueField | variable | Yes | Saved value field. | ListDataID |
| saveToField | variable | Yes | Writable output field. | SelectedCategoryIds |
| multiSelect | variable | Yes | Allow multiple selections. | true |
| titleText | string | No | Panel title. | Category |
| subtitleText | string | No | Panel subtitle. | Select category |
| maxItems | string | No | Max loaded records. | 200 |
| emptyText | string | No | Empty text. | No hierarchy records |
| filterExpression | variable | No | Optional filter. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.; Writable targets must be bound with the correct context prefix and verified by save/persistence tests.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; writeback target exists and uses __temp_, __variables_, or __list_ according to context; source list exists and sample records cover non-empty display
### kpi-card-set

Purpose: Display configurable KPI cards from static JSON or mapped data.

Expected data source: Static JSON cardsConfig or data object/array supplied through expression parameters.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| cardsConfig | variable | No | Expression-editor value containing KPI card configuration. Supports JSON array, object with cards/items/data, variable, temp variable, or expression result. |  |
| titleText | string | No | Optional title shown above the KPI card set. |  |
| subtitleText | string | No | Optional supporting text shown below the title. |  |
| layoutMode | string | No | Card layout: auto, one, two, three, or four. Default is auto. |  |
| cardTone | string | No | Default tone for cards without their own tone: blue, green, amber, red, violet, or slate. |  |
| titleField | variable | Yes | Optional source data field used as each KPI card title. Example: MetricName. |  |
| valueField | variable | Yes | Optional source data field used as each KPI card value. Example: MetricValue. |  |
| subtitleField | variable | Yes | Optional source data field used as each KPI card subtitle/helper text. |  |
| trendField | variable | Yes | Optional source data field used as each KPI card trend/change text. |  |
| trendDirectionField | variable | Yes | Optional source data field used as trend direction: up, down, or neutral. |  |
| toneField | variable | Yes | Optional source data field used as card tone: blue, green, amber, red, violet, or slate. |  |
| formatField | variable | Yes | Optional source data field used as value format: auto, number, percent, or text. |  |
| prefixField | variable | Yes | Optional source data field used as text before the KPI value. |  |
| suffixField | variable | Yes | Optional source data field used as text after the KPI value. |  |
| iconField | variable | Yes | Optional source data field used as the small card marker/icon text. |  |
| targetLabelField | variable | Yes | Optional source data field used as the target label. |  |
| targetValueField | variable | Yes | Optional source data field used as the target value. |  |
| decimalsField | variable | Yes | Optional source data field used as card-specific decimal places. |  |
| showTrend | variable | Yes | Whether trend/change text should be shown. Supports true/false or dynamic expression. |  |
| showIcon | variable | Yes | Whether card icons/initial markers should be shown. Supports true/false or dynamic expression. |  |
| compactMode | variable | Yes | Whether compact spacing is enabled. Supports true/false or dynamic expression. |  |
| emptyStateText | string | No | Text shown when no KPI card configuration is available. |  |
| numberLocale | string | No | Locale used for number formatting, such as en-US. Leave blank for browser default. |  |
| decimalPlaces | string | No | Default decimal places for numeric KPI values. Default is 0. |  |
| minCardWidth | string | No | Minimum card width in pixels when layoutMode is auto. Default is 220. |  |
| valueSize | string | No | Value text size: small, medium, or large. Default is medium. |  |

Runtime risks: Public form support is not proven and must not be claimed.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested
### multi-entry-tag-input

Purpose: Capture multiple tags, emails, IDs, labels, or SKUs as chips.

Expected data source: User-entered chip values; no list query required.

Expected output/writeback: Writes tags as JSON or delimiter text to configured save target.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| saveToField | variable | Yes | Writable field for saved tags. | TagsJson |
| titleText | string | No | Panel title. | Recipients |
| subtitleText | string | No | Panel subtitle. | Press Enter to add each value |
| placeholderText | string | No | Input placeholder. | Type email and press Enter |
| maxTags | string | No | Maximum tags. | 20 |
| allowDuplicates | variable | Yes | Allow duplicate values. | false |
| saveMode | string | No | json or delimiter. | json |
| delimiter | string | No | Delimiter for delimiter mode. | , |
| emptyText | string | No | Empty text. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.; Writable targets must be bound with the correct context prefix and verified by save/persistence tests.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; writeback target exists and uses __temp_, __variables_, or __list_ according to context; source list exists and sample records cover non-empty display
### related-record-summary-grid

Purpose: Display related records inline as cards or table rows.

Expected data source: Related data list filtered by relation field/value and displayed field list.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| targetListId | variable | Yes | Related data list ID. | 203... |
| relationField | variable | Yes | Field used to match relation. | RequestId |
| relationValue | variable | Yes | Current relation value. |  |
| displayedFieldsJson | variable | No | JSON/comma list of fields to display. | [\ |
| displayType | string | No | card or table. | card |
| titleField | variable | Yes | Primary field. | Title |
| statusField | variable | Yes | Status field. | Status |
| titleText | string | No | Panel title. | Related Records |
| subtitleText | string | No | Panel subtitle. | Linked records |
| maxItems | string | No | Max records. | 6 |
| emptyText | string | No | Empty text. | No related records |
| filterExpression | variable | No | Optional filter. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display
### smart-lookup-picker

Purpose: Search, select, and optionally manually add lookup records from a target list.

Expected data source: Lookup source list queried by display/value fields.

Expected output/writeback: Writes full JSON, matched selected values, and manual values to configured targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| dataListId | variable | Yes | Target Yeeflow data list ID used for lookup query. |  |
| displayField | variable | Yes | Field ID/name used for display text and keyword search matching. |  |
| valueField | variable | Yes | Field ID/name used as the saved value for selected matched items. |  |
| saveToField | variable | Yes | Writable current form field or dashboard temp variable used to save the full combined JSON result. Choose the target variable/field from the selector. |  |
| selectedItemsField | variable | Yes | Writable current form field or dashboard temp variable used to save matched selected values only. Choose the target variable/field from the selector. |  |
| newItemsField | variable | Yes | Writable current form field or dashboard temp variable used to save manual/free-text items only. Choose the target variable/field from the selector. |  |
| multiSelect | variable | Yes | Whether multi-select is enabled. Use true or false. |  |
| allowManualEntry | variable | Yes | Whether manual/free-text entry is enabled. Use true or false. |  |
| maxResults | string | No | Maximum number of matched records shown in the suggestion list. |  |
| placeholderText | string | No | Placeholder text shown in the lookup input. |  |
| labelText | string | No | Optional label/title shown above the control. |  |
| noResultText | string | No | Text shown when no matched records are found. |  |
| manualTagText | string | No | Optional label shown on manual item chips. |  |
| minSearchChars | string | No | Optional minimum characters before querying. Default is 1. |  |
| debounceMs | string | No | Optional search debounce delay. Default is 260. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display
### trend-chart-module

Purpose: Render time-based list trends by day, week, or month.

Expected data source: Data list queried and bucketed by a date/datetime field.

Expected output/writeback: Display-only; no writeback targets.

| Parameter | Type | Required | Description | Example |
| --- | --- | --- | --- | --- |
| dataListId | variable | Yes | Target Yeeflow data list ID used as the trend data source. Supports expression editor values. |  |
| dateField | variable | Yes | Field ID/name used as the time axis, such as CreatedTime, SubmitDate, CompletedDate, or AttendanceDate. |  |
| titleText | string | No | Optional module title shown above the chart. |  |
| subtitleText | string | No | Optional supporting text shown below the title. |  |
| chartType | string | No | Chart mode: line, area, areaLine, column, or bar. Default is line. |  |
| timeGranularity | string | No | Time bucket grouping: day, week, or month. Default is day. |  |
| maxPoints | string | No | Maximum number of time buckets shown. Default is 12. |  |
| showPointLabels | variable | Yes | Whether value labels are shown on points or columns. Supports true/false or dynamic expression. |  |
| showXAxisLabels | variable | Yes | Whether date bucket labels are shown on the x-axis. Supports true/false or dynamic expression. |  |
| showYAxis | variable | Yes | Whether a simple y-axis and grid are shown. Supports true/false or dynamic expression. |  |
| emptyText | string | No | Text shown when no valid dated records are available. |  |
| colorMode | string | No | Color palette: yeeflow, green, amber, red, violet, or slate. Default is yeeflow. |  |
| sortMode | string | No | Time order: chronological or reverseChronological. Default is chronological. |  |
| filterExpression | variable | No | Optional Yeeflow query filter object/array/JSON from expression editor. Leave blank for all records. |  |
| height | string | No | Optional chart area height in pixels. Default is 280. |  |
| pageSize | string | No | Maximum records queried for aggregation. Default is 500. |  |
| dateRangeMode | string | No | Optional local date range: all, last7Days, last30Days, last90Days, thisMonth, or last12Months. Default is all. |  |
| cumulativeMode | variable | Yes | Whether the chart shows running total values instead of per-bucket counts. Supports true/false or dynamic expression. |  |
| fillMissingBuckets | variable | Yes | Whether missing day/week/month buckets should be shown as zero. Supports true/false or dynamic expression. |  |
| unknownDateLabel | string | No | Internal label used for invalid dates in diagnostics. Invalid dates are excluded from the chart. |  |

Runtime risks: Public form support is not proven and must not be claimed.; List query filter/payload shape must be runtime-tested with real Yeeflow records.

Validation checks: script embedded in attrs["codein-script"]; parameters stored in attrs["codein-script-param"]; all required parameters configured; parameter types match inputParameters(); public form not claimed unless separately tested; source list exists and sample records cover non-empty display

## Source Of Truth

- Source-code `inputParameters()` is the parameter-schema source of truth.
- User guides and example configs are setup guidance and should be checked against source code.
- Smart Lookup Picker export/runtime baselines are the only current source of runtime support claims.
- For the other 12 templates, this study is inventory evidence, not runtime proof.
