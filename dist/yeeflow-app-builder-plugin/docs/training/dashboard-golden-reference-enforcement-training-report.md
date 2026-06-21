# Dashboard Golden Reference Enforcement Training Report

## Training Scope

This training registers the Marketing Event Management `Event Portfolio` dashboard as the default dashboard construction golden reference for future generated operational dashboards. The source reference was extracted from the provided `Dashboard_Page_layout_ref1.json` file.

This is a generator, blueprint, resource, and package-validation hardening cycle only. It does not add low-level Yeeflow control-property requirements to Functional Specification, App Plan, or Page Function Plan documents.

## Extracted Golden Reference IDs

| Reference | Registered ID |
| --- | --- |
| Full dashboard shell | `event_portfolio_dashboard_golden_reference` |
| Root shell | `Main > Content` |
| Page header region | `event_portfolio_header_band` |
| Filter controls region | `event_portfolio_filter_group` |
| KPI cards region | `kpi_cards_wrapper` |
| Section/content region | `event_portfolio_pipeline_section` |
| Grid-table Collection region | `Event Pipeline Grid-Table` |

## New Registry And Selection Stage

- Added normalized registry `docs/reference/dashboard-golden-references.json`.
- Added standard `docs/standards/dashboard-golden-reference-standard.md`.
- Default dashboard selection is `event_portfolio_dashboard_golden_reference` for standard operational dashboard pages.
- Every generated dashboard page must have a Dashboard Golden Reference Selection artifact before blueprint/resource generation.
- The selection maps app-specific source lists, KPI metrics, filter fields, grid/table fields, and actions into the reference structure.
- Alternative references require an explicit reason and validation impact.

## New Enforcement Gates

- `scripts/validate-dashboard-golden-reference-conformance.mjs`
  - Validates selection artifacts.
  - Validates dashboard blueprint `derivedFromGoldenReference` provenance.
  - Validates generated YAPK dashboard resources preserve machine-checkable golden-reference provenance.
  - Fails shell-only dashboards with only `Main > Content`.
  - Fails missing planned header, filter, KPI, pipeline, or grid-table Collection regions.
  - Fails unrelated apps that copy Marketing Event fields such as Event, Stage, Region, Registration, or Budget.
- `scripts/test-dashboard-golden-reference-conformance.mjs`
  - Covers Facility/Office Asset style positive mapping.
  - Covers missing selection/provenance/region failures.
  - Covers copied Marketing Event field leakage.
  - Covers shell-only and missing grid-table Collection failures.
- `scripts/validate-dashboard-generation-hard-gates.mjs`
  - Now includes golden-reference package conformance for generated dashboard packages.
- `scripts/yapk-first-generation-preflight.mjs`
  - Registers the golden-reference conformance script as a pre-signing generation gate.
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`
  - Requires the new validator, test, standard, and registry to be present in installed cache artifacts.

## Future Dashboard Consumption Guarantee

Dashboard generation must now move through this sequence:

1. Page Function Plan records dashboard business requirements only: metrics, filters, data sources, fields, actions, mobile needs, and business exceptions.
2. Dashboard Golden Reference Selection maps those business needs to `event_portfolio_dashboard_golden_reference` or an explicitly justified alternative.
3. Dashboard blueprint generation records `derivedFromGoldenReference` and sub-region provenance.
4. YAPK dashboard resource generation preserves the same provenance and materializes visible business regions.
5. Preflight and dashboard hard gates reject packages that omit the selection/provenance, use empty shells, skip planned KPI/filter/grid-table regions, or copy Marketing Event business fields into unrelated apps.

## Safety Boundary

- No version bump in this training PR.
- No stable movement.
- No tags, releases, or plugin archives.
- No live Yeeflow writes.
- No package signing, install, import, or upgrade.
- Source/dist mirrors must match before PR handoff.

## Recommended Next Step

After the training PR is reviewed and merged, prepare a separate release bump PR only if validation and install/cache smoke policy require publishing this training work.
