# Dashboard Golden Reference Standard

Generated Dashboard pages must use Dashboard Page Layouts v1.1 as the canonical page-level shell, then use the Event Portfolio dashboard structure as the default component/region golden reference unless a deliberate alternative is selected and justified before blueprint/resource generation.

Dashboard Page Layouts v1.1 is registered in `docs/reference/dashboard-page-layout-templates.json` and standardized in `docs/standards/dashboard-page-layouts-v1.1-standard.md`. Generation must copy and normalize that export-shaped page shell first, preserving the page root, `main > content`, page background, zero root padding, and section card skeleton. Event Portfolio component regions are mapped into approved v1.1 business-content containers and `section_content_area` regions without breaking the v1.1 skeleton.

The default reference is `event_portfolio_dashboard_golden_reference`. It is extracted from the Marketing Event Management `Event Portfolio` dashboard and stored as an updated Yeeflow export-shaped `_ak_c` / `_ak_c_opt` control tree. Generation must clone and normalize this export tree before domain mapping. It must not satisfy the requirement with semantic shells, provenance-only markers, or simplified reconstructed structures, and it must not copy Marketing Event business fields into other apps.

## Required Stage

For every planned Dashboard page, generate a Dashboard Golden Reference Selection artifact before page blueprint and resource generation.

The selection artifact must declare:

| Field | Requirement |
| --- | --- |
| `selectedGoldenReferenceId` | Defaults to `event_portfolio_dashboard_golden_reference` for standard operational dashboards. |
| `selectedSubRegionReferences[]` | Include the needed sub-regions such as `event_portfolio_header_band`, `event_portfolio_filter_group`, `kpi_cards_wrapper`, `event_portfolio_pipeline_section`, and `Event Pipeline Grid-Table`. |
| `businessMapping` | Map page purpose, business questions, and section purposes from the Page Function Plan. |
| `dataListSourceMapping` | Map app-specific source data lists/business objects. |
| `kpiMetricMapping` | Map app-specific metrics and source/calculation logic when KPIs are planned. |
| `filterFieldMapping` | Map app-specific filter fields when filters are planned. |
| `gridTableFieldMapping` | Map app-specific table/queue/register fields when a grid-table/list region is planned. |
| `actionMapping` | Map app-specific actions and expected user outcomes when actions are planned. |
| `alternativeReason` | Required when the default Event Portfolio reference is not selected. |

## Blueprint Provenance

Dashboard blueprints must include `derivedFromGoldenReference`. Major sections must preserve provenance:

| Blueprint section | Required provenance |
| --- | --- |
| Header | `event_portfolio_header_band` |
| Filters | `event_portfolio_filter_group` when filters are planned |
| KPI cards | `kpi_cards_wrapper` when KPIs are planned |
| Primary content section | `event_portfolio_pipeline_section` |
| Grid-table Collection | `Event Pipeline Grid-Table` when tabular/list display is planned |

Blueprints must map app-specific fields. They must not copy Event-specific fields such as `Event`, `Stage`, `Region`, `Registration`, or `Budget` into unrelated apps.

## Generated Resource Provenance

Generated dashboard resources must keep machine-checkable golden-reference provenance, for example through `derivedFromGoldenReference`, `goldenReferenceSelection`, and section-level `attrs.derivedFromGoldenReference` or equivalent metadata.

Generated dashboards must contain:

| Region | Required when |
| --- | --- |
| `Main > Content` | Always |
| Header band | Always |
| Filter group | Filters are planned |
| KPI cards wrapper | KPIs are planned |
| Section container | A primary dashboard section is planned |
| Grid-table Collection | A table, queue, register, portfolio, or pipeline list display is planned |

Dashboard resources that only create `Main > Content` with no meaningful child regions fail. Planned KPI/filter/grid-table regions must materialize.

## Boundary

The Page Function Plan remains business-requirement oriented. It describes metrics, filters, data sources, display fields, actions, mobile needs, and exceptions. It must not contain low-level control properties.

The Dashboard Golden Reference Selection maps those business requirements into the reference structure. Blueprint/resource generation consumes the selection artifact.

When a generated dashboard declares or matches Dashboard Page Layouts v1.1, the Event Portfolio reference is validated as component/region content inside the v1.1 page shell. Validators must not require the Event Portfolio `Main > Content` root-depth/order contract directly at the page root in that case. They must still reject Event Portfolio copied as a competing root shell, provenance-only simplified structures, invented layout modules, and business/data controls placed directly under root `Content` instead of approved v1.1 slots.

## Export-Shape Parity

Generated dashboard resources must preserve the required export-shaped structure from the selected reference:

| Contract | Requirement |
| --- | --- |
| Root tree | Preserve `Main > Content` from the selected page shell. For v1.1 dashboards, the page shell provides this root and Event Portfolio regions live inside approved slots. |
| Region order | Preserve required region order from the registry for non-v1.1 Event Portfolio root generation; v1.1 dashboards preserve v1.1 section/module ordering and validate Event Portfolio component regions within that shell. |
| Control type | Required high-level regions must keep the reference control type. |
| Nesting depth | Required regions must stay at the same dashboard tree depth after normalizing the page wrapper, except v1.1 dashboards where approved section slots introduce the page-shell depth and component regions are checked for presence/type within the shell. |
| Width and padding | Required sections and KPI cards must be Full width; the root Content area must use zero padding. |
| Filter contract | Data filters must preserve separate label/placeholder text, `attrs.data.field`, `display_f`, `value_f`, and `apply_t` when the reference uses it. |
| Grid internals | `grid` / `flex_grid` is allowed only for registered grid-table internal row/header nodes. |
| User fields | User or identity fields must render with `dynamic-user`, not `dynamic-field`. |

Registered reusable regions are:

| Region ID | Purpose |
| --- | --- |
| `event_portfolio_header_band` | Header band |
| `event_portfolio_filter_group` | Filter/action controls group |
| `kpi_cards_wrapper` | KPI wrapper |
| `event_portfolio_kpi_row` | KPI card row |
| `event_portfolio_pipeline_section` | Primary content section |
| `Event Pipeline Grid-Table` | Primary grid-table Collection container |
| `event_portfolio_campaign_readiness_section` | Secondary readiness/content section |
| `campaign_readiness_grid_table_container` | Secondary grid-table container |

The only approved remaining `flex_grid` nodes in the default reference are grid-table internals:

| Node ID | Classification |
| --- | --- |
| `event_pipeline_grid_table_header_grid` | Primary grid-table header row |
| `event_pipeline_grid_table_item_grid` | Primary grid-table item row |
| `campaign_readiness_header_grid` | Secondary grid-table header row |
| `campaign_readiness_item_grid` | Secondary grid-table item row |

## Filter Proof Boundary

Static package validation proves only that filter controls preserve the export-shaped contract and expose query/linkage tokens to Collection or KPI consumers. It does not prove that the installed dashboard filters data at runtime.

Before claiming runtime filter linkage success, browser/runtime proof must capture before values/table rows, select a filter option, capture after values/table rows, and show table and/or KPI data changing consistently. If the selected filter UI changes but rendered dashboard data does not change, the runtime filter linkage proof fails.
