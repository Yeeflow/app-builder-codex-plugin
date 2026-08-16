# Yeeflow App Builder v1.12.3

## Version decision

- Previous stable version: `1.12.2`
- New version: `1.12.3` (patch)
- Scope: Dashboard filter-generation safeguards, validation clarification, and regression coverage.

## Included changes

- Add a reusable Filter Dependency Closure standard and filter applicability matrix.
- Separate declared `filter_...` identifiers from their `__filter_...` runtime bindings.
- Block runtime-prefixed `filterVars[]` declarations with `DASHBOARD_FILTER_VAR_ID_RUNTIME_PREFIX`.
- Require same-source consumer field resolution and a declared mirror/related-query proof for cross-list filtering.
- Require browser filtering smoke evidence before reporting filters usable.

## Verification boundary

- Static validator and skill checks establish package readiness only.
- Browser evidence remains required for actual filtered result changes, intersections, and clear/reset behavior.
