# Dashboard Golden Reference Selection Standard

Dashboard Golden Reference Selection is a required stage between the Page Function Plan and Dashboard blueprint generation.

The Page Function Plan remains business/page-function requirements only. The Dashboard Golden Reference Selection artifact is the first structured downstream implementation-intent artifact that maps those business requirements to plugin-contained Dashboard golden references.

## Stage Order

```text
Functional Specification
-> Yeeflow App Plan
-> Page Function Plan
-> Dashboard Golden Reference Selection
-> Application Design System
-> Dashboard Blueprint
-> Resource generation
```

## Required Selection Artifact

Generate one selection artifact per Dashboard page before blueprint generation.

Required fields:

- `selectionId`
- `dashboardPageId`
- `dashboardPageName`
- `sourcePageFunctionPlanId`
- `selectedPageGoldenReferenceId`
- `selectedSectionGoldenReferenceIds[]`
- `regionMappings[]`
- `requirements`
- `appPlanFields[]`

Each `regionMappings[]` entry must include:

- Page Function Plan business region id/name
- selected golden reference section id
- source data list
- source/display fields
- filters when relevant
- metrics when relevant
- actions when relevant
- dynamic-control intent when relevant
- App Plan field mapping

Default Dashboard pages should select `event_portfolio_dashboard_golden_reference` unless the Page Function Plan clearly requires another plugin-contained pattern.

## Blueprint Contract

Every Dashboard blueprint must reference the selected Dashboard Golden Reference Selection artifact.

Every major Dashboard blueprint section must declare:

- `derivedFromGoldenReference`
- source data list
- fields
- filters, metrics, actions, or display fields preserved from the selection
- dynamic-control intent where the section renders row-context data

Blueprint generation must fail if a Dashboard page has no Golden Reference Selection or if any major section lacks `derivedFromGoldenReference`.

## Generated Resource Contract

Generated Dashboard resources must preserve enough provenance metadata or inspectable structure to prove each major section was generated from the selected golden reference.

For the default Event Portfolio golden reference, generated resources must include:

- `Main` container
- `Content` container
- header band
- filter group when filters are required
- KPI cards wrapper when summary metrics are required
- content section
- grid-table Collection region when a portfolio, work queue, or list region is required

Generated resource/package readiness must fail when:

- Dashboard Golden Reference Selection is missing
- blueprint sections lack `derivedFromGoldenReference`
- generated resources cannot be traced back to the selected reference
- required reference sections are missing
- Event Portfolio field names are copied into unrelated apps instead of mapped to current App Plan fields
- source lists, fields, filters, metrics, actions, or dynamic-control intent are lost between selection, blueprint, and generated resource

## Validation

Use:

```bash
node scripts/validate-dashboard-golden-reference-registry.mjs --dashboard-selection <selection.json>
node scripts/validate-dashboard-golden-reference-registry.mjs --dashboard-selection <selection.json> --dashboard-blueprint <blueprint.json>
node scripts/validate-dashboard-golden-reference-registry.mjs --dashboard-selection <selection.json> --dashboard-resource <resource-trace.json>
```

These checks are local and package-readiness oriented. They do not call Yeeflow APIs, sign packages, install/import/upgrade packages, or prove live runtime behavior.
