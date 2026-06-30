# Dashboard Workbench Materialization Hardening Training Report

## Scope

This training closes the gap found during the 0.8.93 clean regeneration check where the App Plan correctly selected `dashboard-page-layouts-workbench`, but generated Workbench dashboards still failed generated-final dashboard gates.

The training applies to:

- `dashboard-page-layouts-workbench`
- `dashboard-page-layouts-v1.1`
- dashboard KPI/Summary runtime materialization
- Dashboard Golden Reference conformance alignment for approved alternate dashboard page shells

## Defects Confirmed

1. Workbench pages could keep copied template KPI cards with Event Portfolio temp variables such as `__temp_event_portfolio_*`.
2. The materializer only handled the first KPI wrapper it found and missed Workbench KPI rows/columns.
3. Unused Workbench sample modules could remain in generated pages instead of being removed when they had no business content.
4. Dashboard generation hard gates treated approved page-layout shell containers as ad hoc business containers and reported missing `attrs.style.widthtype` even when page-layout validators owned that contract.
5. Dashboard Golden Reference conformance still judged Workbench pages against the Event Portfolio root-shell contract, causing false failures for header band, nesting depth, high-level flex grids, and root Content padding.

## Training Rules Added

- Workbench KPI rows (`kpi_cards_kpi_row` / `kpi_cards_kpi_column`) are valid KPI materialization hosts.
- Only one planned KPI region should be materialized from the copied Workbench template. Extra copied KPI examples must be cleared and removed by empty-section cleanup.
- Every visible Workbench KPI value must bind to the page-local Summary `attrs.save_var` expression object. Source-template Event Portfolio temp variables must not survive in visible KPI cards.
- Empty Workbench modules, including `1_row_section`, `2_rows_section`, `3_rows_section`, `chart_cards_section`, `dashboard_standard_filter_group`, and `right_side_panel`, must be removed unless they contain meaningful business content.
- Approved dashboard page-layout shell containers are governed by dashboard page-layout validators. Generation hard gates should not reject a missing `widthtype` on known structural shell containers, but must still reject raw-string or malformed generated width values.
- `dashboard-page-layouts-workbench`, `dashboard-page-layouts-two-panel-workspace`, and `dashboard-page-layouts-three-panel-workspace` are approved alternate Dashboard page shells. They must not be forced through Event Portfolio root-shell conformance checks.

## Validation Evidence

Local fixture regeneration from the 0.8.93 Workbench App Plan now shows:

- Dashboard Page Layout Template gate: pass
- Dashboard Generation Hard Gates: pass
- Dashboard Dataset Presentation Golden References: pass
- Dashboard Golden Reference Conformance: pass
- Existing dashboard generation hard-gate tests: pass
- Existing Workbench page-layout template tests: pass
- Existing Dashboard Golden Reference conformance tests: pass
- Existing full-app materialization entrypoint regression suite: pass, including first-generation preflight coverage

The full first-generation preflight for the historical fixture package still reports unrelated fixture/non-Dashboard blockers (`application-control-style-template` and fixture-mode `api-issued-content-id-provenance`). Dashboard-specific gates and Data List Form layout gates are clean.

## Proof Boundary

This training did not sign, install, import, upgrade, seed live records, or run browser runtime proof. It is a generator/validator alignment update for generated-final Dashboard Workbench materialization.
