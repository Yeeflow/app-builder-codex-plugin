# Dashboard Default Golden Reference Event Portfolio Structure Training Report

## Summary

This training promotes the Marketing Event Management Event Portfolio dashboard structure into a reusable default Dashboard Golden Reference family for future Yeeflow App Builder dashboard generation.

Baseline plugin version: `0.7.2`

Training branch: `codex/dashboard-default-golden-reference-event-portfolio-structure`

Release target after review/merge: `0.7.3`

## Source Boundary

The reference source was `Dashboard_Page_layout_ref1.json`. The training extracts only reusable structural and style lessons. The plugin does not commit the raw source JSON, private runtime evidence, tenant IDs, app IDs, list IDs, screenshots, raw API responses, raw package payloads, or Marketing Event private artifacts.

The resulting registry explicitly forbids copying Marketing Event-specific field names, labels, sample data, or business semantics into unrelated apps. Generators must map the structure to the current Functional Specification, App Plan, Page Function Plan, and Application Design System.

## Extracted Golden Reference IDs

- `event_portfolio_dashboard_golden_reference`
- `dashboard_default_shell_event_portfolio_ref`
- `dashboard_header_band_event_portfolio_ref`
- `dashboard_filter_group_event_portfolio_ref`
- `dashboard_kpi_cards_event_portfolio_ref`
- `dashboard_content_section_event_portfolio_ref`
- `dashboard_collection_grid_table_event_portfolio_ref`

## Extracted Structure

- Default dashboard shell: `Main` container with nested `Content` container.
- Header band: page title, subtitle/description, page-level filter/action row, and primary actions when required.
- Filter group: filter icon area, filter wrappers, multiple bound filters, source list/field mapping, and target-region consumption.
- KPI cards: Summary/KPI source binding or fallback boundary, visual KPI card row, icon block, metric label, metric value, trend/helper text, metric note, and Text style contract continuity.
- Content section: major dashboard content region with title/subtitle, local filters/actions, main data region, and export/view/status action intent.
- Grid-table Collection: custom header grid, Collection-bound row grid, field columns, Dynamic fields, badge/status/health treatment, progress/metric cells, owner/person display, and row actions.

## Responsibility Split

The Page Function Plan remains business/page-function requirements only. It describes what the dashboard must accomplish, what data it uses, what fields must be shown or summarized, what filters and actions users need, and what mobile behavior is expected.

Dashboard Golden Reference selection happens downstream, after Page Function Plan approval and before Application Design System-guided design, blueprinting, and resource generation. The default Event Portfolio golden reference is a construction style, not an event-specific clone.

## Validation Added

- `scripts/validate-dashboard-golden-reference-registry.mjs`
- `scripts/test-dashboard-default-golden-reference-gates.mjs`

The tests prove:

- the golden reference registry is present and valid
- Facility Maintenance dashboard requirements can map into the default Event Portfolio structure using facility-specific fields
- missing `Main` / `Content`, header band, filter group, KPI cards, grid-table Collection, Dynamic controls, or row actions fail
- copying event-specific fields into unrelated apps fails

## Preserved Hard Gates

This training preserves existing Dashboard Pattern Library, Page Function Plan, Application Design System, Container/Button action, Dashboard Text/control, Summary/KPI, grid-table Collection, aggregate UI, and YAPK hard gates. It does not add a version bump, move `stable`, create tags/releases, generate plugin archives, run live Yeeflow writes, or sign/install/import/upgrade Yeeflow application packages.
