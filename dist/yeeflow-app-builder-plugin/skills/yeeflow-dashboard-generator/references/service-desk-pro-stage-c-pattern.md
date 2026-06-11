# Service Desk Pro Stage C Pattern

Use this pattern when resuming Service Desk Pro-style dashboard generation after the generic dashboard baselines have passed.

Source export studied: `/Users/Renger/Downloads/Service Desk Pro (1).yap`

Proven generated package: `service-desk-pro-dashboard-stage-b-or-c.generated.yap`

Runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace, opened as `Executive Dashboard | Service Desk Pro Dashboard Stage C`, and rendered the static Executive Dashboard content.

## Scope

Stage C is intentionally static.

Included:

- one root app/listset
- one Type `103` `Executive Dashboard` page
- embedded page JSON resource
- static headings
- static filter note
- static KPI-card placeholders
- static chart and operational placeholders

Excluded:

- child data lists
- dashboard `exts`
- `filterVars`
- `tempVars`
- summary/chart/table data bindings
- `opendashboard` actions
- Settings page
- approval forms, workflows, AI modules, reports, connections, and document libraries

## Resource Pattern

- `Layout.Type = 103`
- `Layout.LayoutView = null`
- `Layout.Ext2 = "{\"src\":true}"`
- `LayoutInResources[0].ID = LayoutID`
- `LayoutInResources[0].RefId = LayoutID`
- `LayoutInResources[0].Resource` contains page JSON
- root navigation points to the dashboard `LayoutID`
- `Resource.ReplaceIds` contains only the root app/ListSet ID and dashboard `LayoutID`
- `Resource.ReportIds = []`
- `Resource.FormKeys = []`

## Page JSON Pattern

Top-level keys:

- `children`
- `attrs`
- `title`
- `ver`
- `filterVars`
- `tempVars`
- `exts`
- `actions`

Stage C values:

- `title: "Executive Dashboard"`
- `ver: 2`
- `filterVars: []`
- `tempVars: []`
- `exts: []`
- `actions: []`

Proven static component types:

- `container`
- `heading`
- `text-editor`
- `flex_grid`
- `icon`
- `line`

## Service Desk Pro Risk Notes

The real `Executive Dashboard` includes 26 dashboard `exts`, two filter variables, 14 temp variables, summary controls, chart controls, and drill-down actions. Do not introduce those in one jump.

The real `Settings` page includes external ListSetID / ProcKey action references. Do not generate those actions until dependency handling is explicit.

## Next Stage

Stage D should add one local `Support Tickets` data list with the minimal fields needed for the first summary metric. Keep the dashboard static until the list imports and opens without a visible query failure.
