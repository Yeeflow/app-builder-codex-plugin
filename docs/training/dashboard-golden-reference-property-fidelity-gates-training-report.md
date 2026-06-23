# Dashboard Golden Reference Property Fidelity Gates Training Report

## Source Evidence

This training is based on the 0.8.18 Office Asset Loan Management dashboard forensic reports:

- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-185300-0818-full-e2e/validation/dashboard-golden-reference-fidelity-forensics.md`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260623-185300-0818-full-e2e/validation/dashboard-golden-reference-fidelity-forensics.json`

The forensic result found 157 Golden Reference fidelity issues after structural dashboard gates had passed:

- 152 typography token drift findings.
- 5 select-filter contract drift findings.

## Root Cause

Generated dashboards preserved broad Dashboard Page Layouts v1.1 and Event Portfolio Golden Reference structure, but generator behavior still reconstructed child controls semantically instead of cloning module-level exported properties.

That allowed generated packages to keep provenance and structure while losing key UI fidelity properties such as:

- page title and subtitle typography
- KPI label/value/trend/note typography
- section subtitle typography
- grid-table column header typography
- select-filter label layout shape
- select-filter label typography
- select-filter placeholder color
- select-filter fixed-width positioning

## Training Change

Golden Reference enforcement is now module-level and property-level:

- Generated dashboards may replace business text, app data source bindings, fields, actions, icons, and labels.
- Generated dashboards must preserve required exported typography and filter appearance properties from the approved reference.
- Golden Reference conformance is no longer satisfied by structure/provenance alone.

## New Hard-Gate Coverage

The Dashboard Golden Reference conformance validator now fails generated packages when:

- `event_portfolio_title` is not `h2-bold`.
- `event_portfolio_subtitle` is not `body-medium`.
- KPI labels are not `s-medium`.
- KPI values are not `h2-bold`.
- KPI trend/note controls are not `caption-regular`.
- Section subtitles are not `caption-regular`.
- Grid-table column headers are not `caption-medium`.
- Select-filter labels are not `xs-light`.
- `attrs.lablay` is scalar such as `"top"` instead of `[null, "top"]`.
- `attrs.edit.placeholder.color` is missing.
- `attrs.edit.normal.border.radius` is not an export-shaped supported radius.
- Fixed-width filter positioning is missing or not custom-width 200.

## Regression Tests

Focused tests now cover:

- Reference registry typography drift.
- Generated package typography drift.
- KPI value typography drift.
- Grid-table header typography drift.
- Scalar `attrs.lablay`.
- Missing placeholder color.
- Missing fixed-width positioning.

These tests run through `scripts/test-dashboard-golden-reference-conformance.mjs` and the aggregate dashboard/UI gates.

## Safety Boundary

This training changes validation, standards, skill guidance, and the Golden Reference registry header typography token. It does not sign, install, import, upgrade, call live Yeeflow write APIs, create plugin archives, create GitHub releases, or move `stable`.
