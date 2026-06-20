# Dashboard Event Portfolio Golden Reference Standard

This standard promotes the Marketing Event Management Event Portfolio dashboard structure into the default Dashboard Golden Reference family for future dashboard generation.

Machine-readable registry: `docs/reference/dashboard-golden-reference-registry.normalized.json`

## Source Boundary

The source structure comes from `Dashboard_Page_layout_ref1.json` and is used only as a reusable structural and style reference. The plugin must not commit or depend on private raw Marketing Event artifacts, raw API responses, tenant IDs, app IDs, list IDs, screenshots, raw package payloads, or private runtime evidence.

The generator must not copy Marketing Event-specific business data into unrelated apps. It must adapt page title, subtitle, metrics, filters, source lists, fields, labels, actions, sorting, grouping, and mobile behavior to the current Functional Specification, App Plan, Page Function Plan, and Application Design System.

## Default Golden Reference

Default Dashboard Golden Reference:

- `event_portfolio_dashboard_golden_reference`

Use this family by default for dashboards that act as:

- operations command centers
- portfolio monitoring pages
- status or pipeline dashboards
- service, request, vendor, contract, project, facility, or work-queue dashboards

Use another plugin-contained pattern only when the page function clearly requires it, such as a simple dashboard, three-column workspace, knowledge base, chart-heavy analytics page, or another documented Dashboard standard.

## Extracted Reference IDs

| Reference ID | Source Structure | Purpose |
| --- | --- | --- |
| `dashboard_default_shell_event_portfolio_ref` | `Main` > `Content` | Default dashboard page shell. |
| `dashboard_header_band_event_portfolio_ref` | `event_portfolio_header_band` | Page title, subtitle/description, filter/action row, and page actions. |
| `dashboard_filter_group_event_portfolio_ref` | `event_portfolio_filter_group` | Filter icon area, filter wrappers, and real data-bound filters. |
| `dashboard_kpi_cards_event_portfolio_ref` | `kpi_cards_wrapper` / `event_portfolio_kpi_row` | KPI/Summary metric card row with icon, label, value, trend/helper text, and note. |
| `dashboard_content_section_event_portfolio_ref` | `event_portfolio_pipeline_section` | Major dashboard content section with section title/subtitle, local filters/actions, and main data region. |
| `dashboard_collection_grid_table_event_portfolio_ref` | `Event Pipeline Grid-Table` / `Event Pipeline Grid Table` | Grid-table style Collection region with custom header grid, Collection row grid, Dynamic controls, status/progress/person treatment, and row actions. |

## Generation Contract

The Page Function Plan remains a business/page-function contract. It describes the page purpose, users, business questions, data sources, fields, filters, metrics, main and secondary regions, actions, sorting/grouping, and mobile behavior. It does not prescribe low-level Yeeflow control nesting or property paths.

Dashboard Golden Reference selection happens after the Page Function Plan is approved and before full-page design, blueprint, and resource generation. Dashboard generation should use `event_portfolio_dashboard_golden_reference` as the default construction style unless the Page Function Plan and plugin standards point to a different documented pattern.

When this default is used, generated dashboard blueprints/resources must trace:

- page shell to `dashboard_default_shell_event_portfolio_ref`
- header area to `dashboard_header_band_event_portfolio_ref`
- filter area to `dashboard_filter_group_event_portfolio_ref` when filters are required
- KPI area to `dashboard_kpi_cards_event_portfolio_ref` when summary metrics are required
- main content section to `dashboard_content_section_event_portfolio_ref`
- grid-table Collection region to `dashboard_collection_grid_table_event_portfolio_ref` when a portfolio, work queue, list, or primary operational region is required

## Required Adaptation

For unrelated apps such as Facility Maintenance, the generator must map the structure to facility-specific requirements. Example mappings include:

- request title or asset name instead of Event Name
- maintenance status instead of Stage
- building or zone instead of Region when that field exists
- due date or reported date instead of Event Date
- SLA percent or completion percent instead of Registration
- cost estimate or priority instead of Approved Budget
- assigned technician instead of Owner
- risk, SLA state, or health indicator instead of Health

These are examples only. The actual field names must come from the current App Plan.

## Hard Gates Preserved

This default reference does not relax any existing hard gate. Generated dashboards must still satisfy:

- meaningful `nv_label`
- `Main` container and nested `Content` container
- container direction, alignment, justification, gap, width, and token usage rules where supported
- grid caption hidden where applicable
- Dashboard Text style contracts
- Container/Button action mapping
- root/style token usage
- Dashboard filter bindings
- Summary/KPI binding or explicit fallback boundary
- Collection/grid-table Dynamic controls
- status badge, progress, avatar/person, table header, and row density treatment where applicable
- unsupported property prevention

## Validation

Use:

```bash
node scripts/validate-dashboard-golden-reference-registry.mjs --registry docs/reference/dashboard-golden-reference-registry.normalized.json
node scripts/validate-dashboard-golden-reference-registry.mjs --dashboard-trace <dashboard-trace.json>
```

The trace validator fails when a dashboard claims the default golden reference but omits the `Main`/`Content` shell, header band, required filter group, required KPI cards, required grid-table Collection, item-template Dynamic controls/actions, or when it copies Marketing Event-specific fields into an unrelated app instead of mapping to the current App Plan.
