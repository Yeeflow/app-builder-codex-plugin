# Dashboard Filter Module Synthesis Gates Training Report

## Context

Office Asset Loan Management full E2E validation on active plugin `0.8.17` reached generated-final preflight and stopped before signing because Dashboard filters were generated as ad hoc controls instead of approved Dashboard Page Layouts v1.1 / Event Portfolio filter modules.

The run correctly passed planning, ID provenance, navigation runtime metadata, schema, FontAwesome app icon, grid-table Collection, dataset presentation references, and generated-final resource completeness, then failed Dashboard hard gates. Signing, install/import, Version Management, and browser runtime proof were not attempted.

## Source Evidence

- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-20260623-182304-0817-full-e2e/validation/run-summary.md`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-20260623-182304-0817-full-e2e/validation/run-summary.json`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-20260623-182304-0817-full-e2e/validation/dashboard-generation-hard-gates-r5.json`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-20260623-182304-0817-full-e2e/validation/generated-final-preflight-r5.json`

## Covered Failure Classes

- `DASH_FILTER_FIELD_UNRESOLVED`
- `DASH_FILTER_LABEL_TYPOGRAPHY_MISSING`
- `DASH_FILTER_PLACEHOLDER_COLOR_MISSING`
- `DASH_FILTER_RADIUS_MISSING`
- `DASH_GOLDEN_COMPETING_ROOT_SHELL`
- `DASH_GOLDEN_RESOURCE_FILTER_PLACEHOLDER_MISSING`
- `DASH_GOLDEN_RESOURCE_FILTER_DATA_FIELD_MISSING`
- `DASH_LAYOUT_INVENTED_LAYOUT_MODULE`
- `DASH_LAYOUT_BUSINESS_CONTROL_OUTSIDE_ALLOWED_SLOT`
- `DASH_LAYOUT_DATA_FILTER_FIELD_MISSING`
- `DASH_LAYOUT_RESOURCE_CONTENT_PADDING_MISMATCH`

## Training Decision

Do not relax validators. The failed package was not signing-ready because filters were not generated from approved v1.1/Event Portfolio filter modules and did not preserve required data/style contracts.

The generator lifecycle now requires Dashboard filters to be copied from approved v1.1/Event Portfolio filter modules, placed inside approved business-content slots such as `section_content_area`, and then mapped to app-specific list, field, display/value fields, label, placeholder, style, and downstream Collection/KPI consumer linkage.

## Enforcement

The Dashboard generation hard-gate regression suite now includes:

- a pass case for a v1.1 dashboard whose filter group lives in an approved section content slot and is consumed by a Collection
- a failure case for copied filters missing app-specific `attrs.data.field`
- a failure case for copied Event Portfolio filter groups placed directly under root `Content`
- a failure case for invented ad hoc filter layout modules under root `Content`
- a failure case for obsolete forced-zero v1.1 `Content` padding

## Boundary

Functional Specification and App Plan remain business/control-level documents. They may specify dashboard filters, filter source fields, and selected control categories, but they must not carry runtime IDs, copied control JSON, or low-level style/property payloads. Filter module synthesis happens during generation and is verified before signing readiness.
