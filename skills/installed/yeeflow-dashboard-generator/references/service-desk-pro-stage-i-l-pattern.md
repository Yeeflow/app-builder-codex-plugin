# Service Desk Pro Stage I-N Pattern

Use this after `service-desk-pro-stage-e-f-pattern.md` when continuing the Service Desk Pro dashboard rebuild beyond static Settings, Help, and Drill-down scaffolds.

## Stage I: Local Support Teams Filter Source

Package: `service-desk-pro-dashboard-stage-i.generated.yap`

Runtime result: imported and opened in Yeeflow. Executive Dashboard rendered a Support Teams select filter and a submitted-period staged control. The local `Support Teams` list opened and rendered rows.

Rules:

- add `Support Teams` as a local child data list before binding the select filter
- preserve native `Title` metadata for the list
- use local rows for first filter-source proof
- keep submitted-period date filtering unbound until date semantics are isolated

## Stage J: Opendashboard Modal Action

Package: `service-desk-pro-dashboard-stage-j.generated.yap`

Runtime result: imported and opened in Yeeflow. Clicking the Executive Dashboard `Drill-down Tickets List` card opened the included Type `103` Drill-down page in a modal.

Rules:

- include the target Type `103` page before adding an action
- attach the action through the clickable control's `attrs.control_action`
- use `type: "opendashboard"` with `attrs.data.page.PageID` pointing to the local dashboard layout id
- graph validation should report a `dashboardActionPage` edge
- query params may appear in the URL, but do not claim temp-variable mapping until separately proven

## Stage K: Bound Drill-down Data-list

Package: `service-desk-pro-dashboard-stage-k.generated.yap`

Runtime result: imported and opened in Yeeflow. Direct navigation and modal launch both rendered the dashboard `data-list` table bound to local `Support Tickets`.

Rules:

- replace static drill-down rows with a dashboard `data-list` control only after the target list is already proven
- `attrs.data.list.AppID`, `ListID`, `ListSetID`, and `Type` must resolve to the local source list
- `attrs.listarr[].Field` must resolve to fields in the local list
- start with `attrs.data.filter: []`

## Stage L: Static Drill-down Filter

Package: `service-desk-pro-dashboard-stage-l.generated.yap`

Runtime result: imported and opened in Yeeflow. Drill-down table rendered only high-priority rows `T-1001` and `T-1006`.

Proven static filter:

```json
{
  "pre": "and",
  "left": "Text2",
  "op": "0",
  "right": "High",
  "showCus": true
}
```

Rules:

- prove static scalar `attrs.data.filter` before variable-driven filter expressions
- keep the filter field name aligned with the generated local list field, not the original export field if the local model differs
- for the current Support Tickets model, priority is `Text2`

## Stage M: Submitted-period Binding and Page Polish

Package: `service-desk-pro-dashboard-stage-m.generated.yap`

Runtime result: imported and opened in Yeeflow. Executive Dashboard rendered the four KPI cards and submitted-period control; clicking `Today` changed the four KPI values from `6`, `2`, `4`, `0` to `0`, `0`, `0`, `0`. Settings rendered 3-column card grids with wider spacing. Help Guide rendered improved static card-grid sections. Support Tickets and Support Teams lists opened without visible query failures.

Proven submitted-period condition:

```json
{
  "pre": "and",
  "left": "Datetime1",
  "op": "0",
  "right": [
    {
      "exprType": "variable",
      "valueType": "string",
      "id": "__filter_f_SubmittedPeriod",
      "type": "expr",
      "name": "f_SubmittedPeriod"
    }
  ],
  "showCus": false
}
```

Rules:

- apply the submitted-period condition to each relevant local Support Tickets `summary` and chart `exts`
- for the current generated Support Tickets model, the submitted date field is `Datetime1`
- the filter variable id is `__filter_f_SubmittedPeriod`; the variable name is `f_SubmittedPeriod`
- each target binding should have exactly one submitted-period condition
- Settings grids are safe with three columns and `24px` column and row gaps
- Help Guide page polish is safe as static cards, but links/actions remain excluded until target resources are proven
- update visible helper copy when a formerly staged filter becomes active

## Stage N: Active Submitted-period Helper Copy

Package: `service-desk-pro-dashboard-stage-n.generated.yap`

Runtime result: imported and opened in Yeeflow. Executive Dashboard rendered the updated helper copy that says Submitted period is bound to the generated Support Tickets Created Time field. Default KPI values rendered as `6`, `2`, `4`, `0`; clicking `Today` changed all four values to `0`. Settings, Help Guide, Drill-down Tickets List, Support Tickets, and Support Teams all opened without visible query failures.

Rules:

- use a fresh ID family even for copy-only page JSON cleanup
- keep the Stage M submitted-period conditions unchanged when only updating helper copy
- the active helper copy should mention both local filters: Support Teams and Submitted period
- a copy-only Type 103 dashboard change still requires wrapper validation and runtime import testing
- Stage N is the current safest Service Desk Pro generated dashboard baseline before isolating query-param to `tempVars`, original collection cards, Settings actions, or SLA report resources

## Remaining Stop Conditions

Stop before generation if:

- query-param to `tempVars` mapping is required but has not been isolated
- original collection card layout must be copied without a successful local baseline
- Settings tile targets external `ListSetID` or `ProcKey` dependencies
- SLA report resources are required but the report definitions and source lists are not included
