# Dashboard FilterVar Consumer Materialization Training Report

## Context

Clean-room validation of `yeeflow-app-builder@yeeflow 0.8.81` showed that the
generated-final package had converged on most preflight gates, but the final
runtime-binding lesson gate still found dashboard `filterVars[]` declarations
that were not consumed by any runtime data surface.

Observed examples included `filter_keywords` and `filter_Tasks` on generated
Dashboard pages. The page contained `search-filter` controls bound to those
variables, but the corresponding Collection controls still had empty
`attrs.data.fulltext[]` arrays. A filter producer binding alone does not make the
page runtime-safe because the value is never applied to Summary, Collection, Data
table, chart, or pivot data retrieval.

## Root Cause

Collection golden reference templates can carry page-level filter dependencies
and `search-filter` controls. The full-app materializer copied those producer
bindings into the Dashboard resource, but did not always materialize the matching
consumer contract on the generated Collection.

The previous cleanup also used broad JSON-string matching, so a producer binding
such as `binding = "__filter_filter_keywords"` could keep a `filterVars[]`
declaration alive even when no downstream consumer used it.

## Training Rule

Generated Dashboard pages must satisfy both sides of the filter contract:

- Data Filter controls may produce values through `binding = "__filter_<name>"`.
- Search filters must be wired to Collection/Data Table `attrs.data.fulltext[]`.
- Exact select/radio/check/range filters must be wired to consumer
  `attrs.data.filter[]` or proven chart/Summary/Pivot condition structures.
- Producer controls do not count as consumers.
- Any filter variable that cannot be wired into a real consumer must be omitted
  from `filterVars[]`, and stale producer bindings must be removed.

## Implementation

- `materialize-full-app-generated-final.mjs` now extracts search-filter bindings
  cloned from Collection templates and adds matching Collection
  `attrs.data.fulltext[]` entries.
- Search-derived variables are not added to `filterBindings[]`, because that
  property is reserved for exact `attrs.data.filter[]` conditions.
- `filterConsumedDashboardFilterVars(...)` now uses consumer-only inspection
  instead of broad JSON-string matching.
- Leftover producer bindings for unconsumed variables are pruned before the
  generated Dashboard resource is emitted.

## Regression Coverage

`test-full-app-materialization-entrypoint-gates.mjs` now asserts that every
generated Dashboard `filterVars[]` entry is consumed by a real data/analytics
control and that every generated `search-filter` binding feeds a real consumer
fulltext/filter contract.

## Safety Boundary

This training only changes generated-final materialization and validation
coverage. It does not sign, install, import, upgrade, write live Yeeflow data, or
claim browser/runtime proof.
