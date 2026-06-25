# Dashboard Select Filter Option Source Placeholder Training Report

## Summary

This training closes the follow-up gap found after the Dashboard Collection action placeholder gates shipped. The 0.8.48 validator correctly blocked unresolved Dashboard template placeholders, but full-app materialization still emitted a literal `{{ListDataID}}` token in generated Dashboard `select-filter.attrs.data.filter[].value` option-source filters.

Generated-final Dashboard resources must not carry source-template or current-item placeholder strings. Select-filter option sources are page-level filter controls, not Collection item templates, so `{{ListDataID}}` has no valid current-item context there.

## Classification

- Type: generator bug plus diagnostic hard-gate refinement.
- Scope: generated Dashboard select-filter option-source filters inside full-app materialization.
- Boundary: local generated-final validation and regression tests only. No Yeeflow signing, install/import, upgrade, Version Management, seed data, or browser/runtime proof was performed.

## Rules Added

- `select-filter.attrs.data.filter[].value` must not contain literal `{{ListDataID}}` or any other source-template placeholder.
- If a generated select-filter does not need an option-source filter, emit `filter: []`.
- If an option-source filter is intentionally required, use a proven Yeeflow expression object with concrete generated IDs and variables, not a placeholder string.
- The dataset presentation validator emits `DASH_SELECT_FILTER_OPTION_SOURCE_PLACEHOLDER_UNRESOLVED` for this specific failure so future reports point directly to select-filter option-source generation.

## Implementation

- Updated the standalone full-app materializer so generated Dashboard select filters use an empty option-source filter array instead of the old placeholder-bearing `not_empty` condition.
- Kept the broader unresolved-placeholder scan active for all Dashboard resources.
- Added focused regression coverage for a Dashboard select-filter containing `{{ListDataID}}` in `attrs.data.filter[].value`.
- Updated the Dashboard dataset presentation Golden Reference standard and dist mirrors.

## Validation

Validated with syntax checks, focused Dashboard dataset presentation tests, full-app materialization tests, first-generation preflight-related suites, dashboard hard gates, generated-final completeness/materialization suites, YAPK schema/package/cache gates, planning gates, app icon gates, approval/export-shaped YAP validators, aggregate UI gates, source/dist mirror checks, release safety audit, and private/forbidden content scans.
