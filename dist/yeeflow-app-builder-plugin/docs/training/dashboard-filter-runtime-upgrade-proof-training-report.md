# Dashboard Filter Runtime And Upgrade Proof Training Report

## Source Evidence

- Source report: `dashboard-pages-full-upgrade-v8-final-report.md`
- Structured source report: `dashboard-pages-full-upgrade-v8-final-report.json`
- Evidence source: Office Asset Loan Management dashboard full-upgrade validation.

## Problem Summary

The previous static validator contract treated Dashboard filter linkage as sufficient when `filterBindings[]` were consumed by Collection `attrs.data.filter[]`, and `collection_control_grid_table_with_multiselect` encouraged `op` / `operator = "9"` conditions. Live runtime proof showed this is unsafe: an empty page-level `select-filter` variable combined with an `In` condition can make every Dashboard Collection render `No data` on initial load, even when local static gates pass.

The same validation cycle also confirmed that Dashboard-only sparse upgrade packages are unsafe for complete applications. A Dashboard replacement must be delivered as a full upgrade package that preserves non-Dashboard resources unchanged, and API `apiStatus: 0` must remain classified as submitted/accepted rather than final success.

## Training Changes

- Added `scripts/validate-dashboard-select-filter-runtime-contract.mjs`.
- Added `scripts/inspect-dashboard-upgrade-runtime-proof.mjs`.
- Added `scripts/test-dashboard-filter-runtime-upgrade-proof-gates.mjs`.
- Registered the select-filter runtime contract in `scripts/yapk-first-generation-preflight.mjs`.
- Extended generated-final resource completeness so proven `search-filter` regions can satisfy planned Dashboard filter intent while unsafe select-filter runtime linkage is deferred.
- Updated the standalone materializer to avoid generating page-level select-filter to Collection `op = 9` runtime conditions until an export-proven empty-value bypass contract exists.
- Extended YAPK upgrade scope validation so Dashboard-scoped upgrades require a full package and non-Dashboard unchanged proof.

## New Hard Gates

- `DASH_SELECT_FILTER_COLLECTION_IN_EMPTY_UNPROVEN`: page-level `select-filter` variables must not feed Collection `attrs.data.filter[]` conditions with `op` / `operator = "9"` until an export-proven empty-value bypass contract exists.
- `DASH_FULL_UPGRADE_SPARSE_PACKAGE_FORBIDDEN`: Dashboard-only sparse upgrade packages are forbidden for complete existing applications.
- `DASH_FULL_UPGRADE_NON_DASHBOARD_UNCHANGED_PROOF_MISSING`: Dashboard upgrades must prove non-Dashboard resource groups were preserved unchanged.
- `DASH_UPGRADE_API_STATUS_SUBMITTED_ONLY`: `upgrade-check` / `upgrade-apply` API status `0` is submitted/accepted only.
- `DASH_RUNTIME_BUSINESS_ROWS_MISSING`: Dashboard runtime proof must show business rows after initial load.
- `DASH_RUNTIME_NO_DATA_VISIBLE`: Dashboard runtime proof must not show `No data` when business data exists.
- `DASH_RUNTIME_OBJECT_OBJECT_VISIBLE`: Dashboard runtime proof must not show `[object Object]`.
- `DASH_RUNTIME_COLLECTION_REAL_LIST_BINDING_MISSING`: Dashboard Collections must be proven against real Data Lists.
- `DASH_RUNTIME_SEARCH_FILTER_*`: Search filter proof is required when generated and must show a real before/after effect.

## Generator Guidance

Until a proven select-filter empty-state bypass contract is available, generators should prefer runtime-proven Search filter / Collection fulltext behavior or visible unfiltered Collections. Static `filterBindings[]` consumption is not enough evidence for a runtime-safe page-level select-filter to Collection `In` condition.

Dashboard-only upgrades must be full upgrade packages. The upgrade package must preserve Data Lists, Forms, FormNewReports, DataReports, Groups, Tags, Metadatas, Agents, Connections, Knowledges, Themes, Components, PortalInfo, root identity, and non-target pages unless the scope explicitly declares otherwise.

## Proof Boundary

This training adds validator and generator guardrails. It does not claim that every select-filter runtime shape is invalid; it blocks the unsafe unproven shape until a focused export/runtime proof identifies a safe empty-value bypass contract. It also separates local package proof, upgrade API submission, Version Management final status, and browser/runtime proof.
