# Dashboard Golden Reference Export-Shape Parity Training Report

## Scope

This training cycle replaces the prior summarized Event Portfolio dashboard reference with the updated export-shaped reference from `Dashboard_Page_layout_ref1.updated.json`. The registry now preserves the `_ak_c` and `_ak_c_opt` control tree and treats it as the source of truth for future dashboard generation.

No plugin version bump, stable movement, tags, release archives, live Yeeflow writes, signing, install, import, or upgrade actions belong to this training PR.

## Registered Region IDs

| Region ID | Role |
| --- | --- |
| `event_portfolio_header_band` | Header band |
| `event_portfolio_filter_group` | Filter controls group |
| `kpi_cards_wrapper` | KPI wrapper |
| `event_portfolio_kpi_row` | KPI card row |
| `event_portfolio_pipeline_section` | Primary pipeline/content section |
| `Event Pipeline Grid-Table` | Primary grid-table Collection container |
| `event_portfolio_campaign_readiness_section` | Secondary readiness/content section |
| `campaign_readiness_grid_table_container` | Secondary grid-table container |

## Approved Table-Internal Flex Grid Nodes

Only these remaining `flex_grid` nodes are approved, and only as grid-table internal row/header structures:

| Node ID | Classification |
| --- | --- |
| `event_pipeline_grid_table_header_grid` | Primary grid-table header row |
| `event_pipeline_grid_table_item_grid` | Primary grid-table item row |
| `campaign_readiness_header_grid` | Secondary grid-table header row |
| `campaign_readiness_item_grid` | Secondary grid-table item row |

## New Hard Gates

- Dashboard Golden Reference registry lint validates the stored `_ak_c` / `_ak_c_opt` reference before use.
- High-level dashboard layout regions must be `container`, not `grid` or `flex_grid`.
- Required sections and KPI cards must be Full width.
- Root Content padding must be zero.
- Filter label and placeholder text must be separate.
- Radio/select/checkbox filters must preserve `attrs.data.field`, `display_f`, `value_f`, and `apply_t` when applicable.
- Generated resources must preserve export-shape parity for required region order, type, depth, width, padding, filter contract shape, and grid-table internal classification.
- Provenance-only or simplified reconstructed structures fail.
- User/identity fields must render with `dynamic-user`, not `dynamic-field`.
- Runtime filter linkage proof is separate from static filter contract validation and must show before/after dashboard data changes.

## Covered Findings

- Generator reconstruction with semantic shells instead of the reference export tree.
- Missing strict `_ak_c` / `_ak_c_opt` parity.
- High-level grid/flex-grid misuse for KPI row or pipeline header.
- Missing Full-width sections or KPI cards.
- Nonzero root Content padding.
- Duplicated filter label/placeholder text.
- Missing filter field metadata.
- Static package validation being mistaken for runtime filter linkage proof.
- User fields rendered with `dynamic-field`.
- Marketing Event fields copied into unrelated domains.

## Validation Added

- Focused dashboard golden-reference conformance regression coverage now includes reference quality lint, export-shape parity, filter contract checks, user-field dynamic control checks, copied Event-field rejection, and runtime filter proof pass/fail cases.
- Existing dashboard generation hard-gate tests now use the registered export-shaped reference tree as the valid dashboard fixture.

## Safety

Training branch only. Plugin metadata remains unchanged at the current stable version. No stable movement, tags, release archives, live Yeeflow writes, signing, install, import, or upgrade actions were performed.

## Recommendation

After the training PR is reviewed and merged, prepare a separate release bump PR. Do not combine this training work with the release version bump.
