# Simple Elements Pattern

Source of truth: `Test Dashboard Only (2).yap`.

Proven generated package: `generated-dashboard-simple-elements-v2.yap`.

Runtime result: imported into `https://<yourdomain>.yeeflow.com`, appeared in Shared Workspace after refresh, opened as `Dashboard | Generated Dashboard Simple Elements v2`, and rendered static dashboard page content.

## App Shape

- root app/listset only
- one Type `103` dashboard layout
- no child data lists
- no approval forms
- no reports
- no AI modules, connections, or document libraries
- app metadata arrays present, including empty `AppThemes` and `AppComponents`

## Dashboard Layout

The dashboard layout keeps the minimal shell fields:

- `Type: 103`
- `LayoutView: null`
- `Ext2: "{\"src\":true}"`
- root navigation points to the dashboard `LayoutID`

It adds one page resource:

- `LayoutInResources[0].ID = LayoutID`
- `LayoutInResources[0].RefId = LayoutID`
- `LayoutInResources[0].Resource` is JSON string page content

This inline page-resource ID pattern is valid for simple static dashboard content.

## Page JSON

Required top-level keys:

- `children`
- `attrs`
- `title`
- `ver`
- `filterVars`
- `tempVars`
- `exts`

For static simple elements:

- `filterVars: []`
- `tempVars: []`
- `exts: []`

## Proven Static Component Types

- `container`
- `heading`
- `text-editor`
- `action_button`
- `flex_grid`
- `icon`
- `line`
- `picture`

Also observed and proven:

- background image config under `attrs.common.background.normal.classic.image`
- hover/normal background overlays
- containers with `action-type: "2"` and `link.url: "#"`
- Font Awesome icon names in `attrs.icon.icon`
- rich text HTML in `text-editor.attrs.value`

## ReplaceIds

For this pattern, include exactly:

1. root app/ListSet ID
2. dashboard `LayoutID`

Because the page resource uses `ID = RefId = LayoutID`, do not add a separate page-resource ID.

## Generation Rules

- Clone the studied static page JSON when producing the first simple-elements test.
- Remap only root app/ListSet ID and dashboard LayoutID to a fresh ID family.
- Keep no data lists, forms, reports, widgets, or `exts` for this stage.
- Validate and import-test before introducing data-bound widgets or charts.
