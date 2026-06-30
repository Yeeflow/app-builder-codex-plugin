# Dashboard Master-Detail Workspace Materialization Alignment Training Report

## Scope

This training closes the Service Tickets Management 0.8.93 validation gap where a generated Dashboard selected a master-detail workspace page layout, but downstream validators still judged parts of the page with older `dashboard-page-layouts-v1.1` content-card and grid-table assumptions.

The affected Dashboard template family is:

- `dashboard-page-layouts-two-panel-workspace`
- `dashboard-page-layouts-three-panel-workspace`

## Source Validation Feedback

The Service Tickets clean generation reached generated-final validation with planning, OAuth refresh, API-issued IDs, materialization, base YAPK validation, ID provenance, and navigation runtime metadata passing.

Signing and installation were correctly blocked because generated-final preflight still failed on Dashboard hard gates. The failures were not caused by signing, tenant state, or runtime install. They were caused by plugin-side template alignment gaps:

- The master-detail page used built-in left and current-item Collections, but aggregate hard gates still required ordinary v1.1 `content_card_wrapper` placement.
- `left_panel_filter_group` and `left_panel_filter_control` were legitimate master-detail left-panel filter structures, but the aggregate filter checks treated them like generic Dashboard filters.
- The App Plan included Data List view navigation targets such as `Open Tickets` and `Overdue Tickets`; these must resolve to their host Data List resources instead of requiring separate generated resources.
- Master-detail page-layout containers and selected-record field containers were checked by generic Container style lint even though their structure is owned by the approved page layout template and the master-detail validator.

## Materialization Rules

The full-app materializer must preserve the selected Dashboard page layout from the App Plan. For master-detail workspace pages, it must not silently fall back to `dashboard-page-layouts-v1.1`.

For master-detail workspace pages:

- `vCurrentItemID` is required.
- `left_panel_data_items_wrapper` is the left record-list Collection.
- Clicking a left-panel item must write the selected item ID into `vCurrentItemID`.
- `current_item_wrapper` is the selected-record detail Collection.
- `current_item_wrapper` must use the same source dataset as `left_panel_data_items_wrapper`.
- `current_item_wrapper` must limit records to `1`.
- `current_item_wrapper` must filter record ID by `vCurrentItemID`.
- Template source IDs inside page-layout actions, query data, filters, and Collection runtime references must be remapped to the generated application IDs.
- Dashboard `LayoutView` must remain `null`; the full Dashboard page JSON belongs in `LayoutInResources[0].Resource`.

## Validator Alignment Rules

The aggregate Dashboard hard gate must defer master-detail specific structure to the dedicated validators instead of reapplying default v1.1 assumptions.

Valid master-detail built-in Collections are not ordinary dataset presentation modules:

- `left_panel_data_items_wrapper`
- `current_item_wrapper`

They do not require an enclosing `content_card_wrapper` and should not be forced through the ordinary grid-table card wrapper rule. Their runtime contract is validated through the master-detail page-layout and dataset-presentation validators.

Valid master-detail left-panel filter controls are not ordinary loose Dashboard filter groups:

- `left_panel_filter_group`
- `left_panel_filter_control`

Each `left_panel_filter_group` may contain at most two filters. More filters require another `left_panel_filter_group`.

The page-layout validator owns master-detail shell checks, including:

- `main > left_panel + content_panel`
- `vCurrentItemID`
- left/current same-source binding
- left selection action
- current item limit and filter
- cleanup of unused master-detail sections

## App Plan Navigation Rule

When an App Plan includes data-list view navigation targets, the resource completeness validator may treat those views as satisfied when their host Data List exists and the navigation item points to that host list. View names must not be materialized as unrelated phantom resources.

## Regression Proof

The Service Tickets local generated-final regression now passes:

- Generated package: `service-tickets-management.generated-final.yapk`
- Dashboard page layout: `dashboard-page-layouts-two-panel-workspace`
- `validate-dashboard-page-layout-template.mjs`: pass
- `validate-dashboard-generation-hard-gates.mjs`: pass
- `yapk-first-generation-preflight.mjs`: pass
- `preflightEligibleForSigning`: `true`

Focused regression suites also pass:

- `test-dashboard-generation-hard-gates.mjs`
- `test-dashboard-master-detail-workspace-page-layout-template-gates.mjs`
- `test-dashboard-page-layout-template-gates.mjs`
- `test-dashboard-page-layout-plan-conformance-gates.mjs`
- `test-dashboard-dataset-presentation-golden-references.mjs`
- `test-dashboard-grid-table-collections.mjs`
- `test-data-filter-standard-group-gates.mjs`
- `test-generated-final-resource-completeness-gates.mjs`

No signing, installation, upgrade, seed import, or live browser runtime proof was performed in this training round.
