# Service Tickets Dashboard Workbench Plan Shape Training Report

## Source Feedback

Validation of `yeeflow-app-builder@yeeflow 0.8.110` proved that package generation, signing, install submission, Version Management, live seed data, and browser rendering can all succeed while the generated Dashboard still fails the business requirement.

The generated `Service Tickets Dashboard` rendered as a generic `Tickets records` table page. It did not materialize the planned Outlook-style two-panel workspace with a left Ticket list, right selected-ticket detail panel, and planned `Priority Level` / `Status` filter controls.

## Root Cause

The App Plan used this valid Dashboard section shape:

```md
## 14. Dashboard Pages Plan
### 14.1 Service Tickets Dashboard
- Page name: Service Tickets Dashboard
- Business purpose: IT support triage workbench with ticket list and selected ticket details.
- Layout template: dashboard-page-layouts-two-panel-workspace
- Dataset presentation: collection_control_grid_table
```

Earlier parser coverage only reliably consumed table-based page layout selections or a dedicated `Dashboard Page Layout Template Selection` table. The bullet-form page layout selection was dropped before materialization, so the generator silently fell back to `dashboard-page-layouts-v1.1`.

## Required Plugin Behavior

1. Treat bullet-form Dashboard page layout declarations under `## 14. Dashboard Pages Plan` as first-class App Plan source.
2. Preserve `Page name` and `Layout template` from each `### 14.x` Dashboard subsection into materialization demand.
3. Never silently fall back to `dashboard-page-layouts-v1.1` when the App Plan explicitly chooses `dashboard-page-layouts-two-panel-workspace` or `dashboard-page-layouts-three-panel-workspace`.
4. When a master-detail Dashboard layout is selected, materialize the template internals: `left_panel_data_items_wrapper`, `content_panel_current_item_wrapper`, `vCurrentItemID`, left-panel search/filter controls, and selected-record detail binding.
5. Planned filters such as `Priority Level` and `Status` must remain visible controls in the left panel and must bind to the planned source fields.
6. Install success and seeded data visibility are not enough for business E2E pass; page layout semantics must match the App Plan.

## Regression Coverage

The Service Tickets regression fixture now uses the same bullet-form Dashboard plan shape as the failing 0.8.110 E2E report. The test asserts that `Service Tickets Dashboard` materializes `dashboard-page-layouts-two-panel-workspace`, includes the left record-list panel, includes the selected-item detail panel, and keeps planned Priority/Status filter controls with proven option sources.
