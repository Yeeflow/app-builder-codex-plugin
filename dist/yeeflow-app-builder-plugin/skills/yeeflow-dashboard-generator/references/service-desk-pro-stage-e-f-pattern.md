# Service Desk Pro Stage E and F Pattern

Use this after `service-desk-pro-stage-d-pattern.md`.

## Stage E Proven Pattern

Package: `service-desk-pro-dashboard-stage-e.generated.yap`

Runtime result: imported and opened in Yeeflow. `Total Submitted` rendered `6`, matching the six local `Support Tickets` rows.

Rules:

- add exactly one `summary` page control first
- add one matching `page.exts[]` item with `category: "___Pivot___"` and `key: "summary"`
- bind `attr.ListID` to the local `Support Tickets` list and `attr.ListSetID` to the root app/listset
- use `COUNT(ListDataID)` for ticket counts
- include the summary control id in `Resource.ReportIds`
- do not add Service Desk filters, charts, reports, Settings, or drill-down actions in Stage E

## Stage F1 Proven Pattern

Package: `service-desk-pro-dashboard-stage-f1.generated.yap`

Runtime result: imported and opened in Yeeflow. KPI values rendered as:

- `Total Submitted`: `6`
- `Resolved Tickets`: `2`
- `Open Tickets`: `4`
- `Critical Open`: `0`

Rules:

- bind each KPI card as a separate `summary` control
- include every summary control id in `Resource.ReportIds`
- use simple local field conditions:
  - resolved count: `Text3` in `Resolved`, `Closed`
  - open count: `Text3` in `New`, `Assigned`, `In Progress`, `On Hold`
  - critical open count: open status condition plus `Text2 = Critical`
- keep filter variables out until a dedicated filter stage

## Stage F2 Proven Pattern

Package: `service-desk-pro-dashboard-stage-f2.generated.yap`

Runtime result: imported and opened in Yeeflow. KPI cards still rendered `6`, `2`, `4`, and `0`; `Open Tickets by Priority` rendered as a column chart with Medium and High buckets.

Chart:

- `type: "bar-chart"`
- `key: "bar-chart"`
- `chartType: "2"`
- grouping row: `Text2` / Priority
- value: `COUNT(ListDataID)`
- condition: active status set over `Text3`

Rules:

- chart control id must be present in `page.exts[].i`
- chart control id must be included in `Resource.ReportIds`
- keep the first Service Desk chart grouped over a local text/radio field before introducing lookup groupings or SLA report resources
- if a later chart fails at runtime, isolate with KPI summaries plus only the chart control and inspect browser/network evidence before adding more charts

## Stage G Proven Pattern

Package: `service-desk-pro-dashboard-stage-g.generated.yap`

Runtime result: imported and opened in Yeeflow. Executive Dashboard rendered, and the static `Settings` page rendered Service Desk configuration cards.

Rules:

- add the Settings page as a separate Type `103` layout
- set `LayoutInResources[0].ID` and `RefId` to the Settings layout id
- include the Settings layout id in `ReplaceIds`
- add a root navigation entry for Settings
- keep Settings cards static until linked target lists/actions are included and validated
- do not copy original Settings links blindly; they can reference external ListSetID or ProcKey dependencies

## Stage H Proven Pattern

Package: `service-desk-pro-dashboard-stage-h.generated.yap`

Runtime result: imported and opened in Yeeflow. Executive Dashboard, Drill-down Tickets List, Help Guide, and Support Tickets all rendered.

Rules:

- add `Drill-down Tickets List` and `Help Guide` as separate Type `103` layouts after Executive Dashboard and Settings are already proven
- static drill-down rows are safe as a scaffold
- static help sections are safe as a scaffold
- keep dynamic drill-down `collection`, `tempVars`, filter variables, and `opendashboard` actions out until each is isolated and runtime-tested
- after adding secondary pages, re-open the local source list to confirm no `datas/query` regression
