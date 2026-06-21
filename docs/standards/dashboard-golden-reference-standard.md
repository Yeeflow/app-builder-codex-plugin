# Dashboard Golden Reference Standard

Generated Dashboard pages must use the Event Portfolio dashboard structure as the default golden reference unless a deliberate alternative is selected and justified before blueprint/resource generation.

The default reference is `event_portfolio_dashboard_golden_reference`. It is extracted from the Marketing Event Management `Event Portfolio` dashboard and normalized as reusable structure, style intent, and control-pattern guidance. It must not copy Marketing Event business fields into other apps.

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
