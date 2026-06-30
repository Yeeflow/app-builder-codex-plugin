# Dashboard Master-Detail Workspace Page Layout Templates Training Report

## Scope

This training adds two Dashboard page-level golden reference templates extracted from the user-provided Service Desk Pro `.yap` export:

- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

The templates are intended for Outlook-like or service-desk-like record workspaces where users scan a source dataset in a left panel, select a record, and review or act on the selected record in the right panel.

## Source Export

Source file used during training:

- `/Users/rengerhu/Downloads/Service Desk Pro.yap`

The export was decoded locally. Only the two Dashboard page resources were extracted and stored as normalized reference templates. The raw `.yap` file and full decoded application export were not committed.

Extracted Dashboard pages:

- `Two-Panel Workspace Layout`
- `Three-Panel Workspace Layout`

## Added Reference Artifacts

- `docs/reference/dashboard-page-layout-two-panel-workspace.template.json`
- `docs/reference/dashboard-page-layout-three-panel-workspace.template.json`
- `docs/reference/dashboard-page-layout-templates.json`

Matching dist mirrors were added under `dist/yeeflow-app-builder-plugin/docs/reference/`.

All copied `section_content_area` controls in these templates preserve the current golden reference gap contract:

```json
["--sp--s200"]
```

represented in Yeeflow export shape as:

```json
[null, "--sp--s200"]
```

## Key Runtime Contract

Both templates require a selected-record temp variable:

- `vCurrentItemID`

The generated page must preserve the master-detail binding:

- `left_panel_data_items_wrapper` is the left source dataset Collection.
- Clicking a left-panel Collection item must write the clicked item ID into `vCurrentItemID`.
- `current_item_wrapper` is the selected-record detail Collection.
- `current_item_wrapper` must bind the same source dataset as the left Collection.
- `current_item_wrapper` must limit records to `1`.
- `current_item_wrapper` must filter record ID by `vCurrentItemID`.

The left-panel item title contract is also mandatory:

- `left_panel_data_item_space_between` must contain `left_panel_data_item_title`.
- `left_panel_data_item_title` is the selected source dataset's subject/title display for each Collection item.
- It may be mapped to Dynamic user or Dynamic field according to the bound source field type.
- The default date wrapper/value controls are named `left_panel_data_item_date_wrapper` and `left_panel_data_item_date_value`.
- The date value must keep an export-shaped Yeeflow expression binding; raw formula strings such as `iif(dateDiff(...))` must not be visible text.

## Editable Empty-Selection State

The user clarified that the empty-selection region is editable business content and applies to both templates:

- `content_panel_empty`
- `content_panel_empty_image`
- `content_panel_empty_title`
- `content_panel_empty_description`

This region is displayed when `vCurrentItemID` has no selected record. The image, title, and description may be mapped to the current application domain while preserving the template control structure and style.

## Editable Regions

The registry documents the approved editable regions for left-panel captions, add button, filter groups, Collection item content, current-item title/header, current-item operations, current-item field grid, related content cards, KPI sections, chart sections, and the three-panel additional right-side content area.

Business content outside these approved regions remains forbidden. Structural shell controls, temp variables, form actions, and layout relationships must remain template-faithful.

## Cleanup Rules

Generated pages using these templates must remove unused copied modules:

- Empty `section_content_area`.
- Empty `chart_cards_section`.
- Empty filter groups.
- Empty `kpi_metrics_wrapper`.
- Unused Operations containers.
- Title-only copied sections.
- Empty optional panels.

KPI card count must match planned KPI metrics. Data Analytics templates in `chart_cards_section` should not exceed three per section.

## Validator Updates

`scripts/validate-dashboard-page-layout-template.mjs` now:

- Requires both new template IDs in the Dashboard page layout registry.
- Validates the master-detail workspace shell as `main > left_panel + content_panel`.
- Requires `vCurrentItemID`.
- Requires left/current Collection same-source binding when both source IDs are present.
- Requires left-panel selection action provenance that writes `vCurrentItemID`.
- Requires selected-record detail Collection `limit = true`.
- Requires selected-record detail Collection filter to consume `vCurrentItemID`.
- Allows the `content_panel_empty` empty-selection state as editable business content.
- Enforces chart section cleanup and chart count rules for the new templates.

`scripts/validate-data-analytics-golden-references.mjs` now treats the two master-detail workspace templates like Workbench layouts for grouped Data Analytics placement: grouped analytics belong inside `chart_cards_section`.

## Regression Coverage

Added focused test:

- `scripts/test-dashboard-master-detail-workspace-page-layout-template-gates.mjs`

The test covers:

- Registry inclusion.
- Valid generated packages for both templates.
- Missing `vCurrentItemID`.
- Missing selected-record limit.
- Missing selected-record filter.
- Empty `chart_cards_section`.
- More than three analytics templates in one chart section.

## App Plan Guidance

The App Plan standard now allows four Dashboard page layout template choices:

- `dashboard-page-layouts-v1.1`
- `dashboard-page-layouts-workbench`
- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

When a master-detail workspace template is selected, the App Plan must state the primary source dataset, left-panel filters/search, selected item title/description fields, current-item operations, detail field groups, related sections, analytics sections, and whether the empty-selection state should keep or rewrite the template image/title/description.

## Proof Boundary

This training is a plugin training change only. It does not bump the plugin version, move `stable`, sign or install a Yeeflow app, or perform live tenant writes.
