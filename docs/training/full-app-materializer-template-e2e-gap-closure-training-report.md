# Full-App Materializer Template E2E Gap Closure Training Report

## Source Evidence

This training round is based on the clean full-app regeneration feedback for active plugin `yeeflow-app-builder@yeeflow 0.8.75`, especially:

- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0875-clean-e2e-revalidation-report.md`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0875b-generated-final-validation-summary.md`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0875-dashboard-deep-resource-inspection.json`

The package stopped before signing because generated-final validation still failed. No signing, install, upgrade, seed-data, or browser runtime proof should be inferred from this training.

## Defects Covered

The 0.8.75 clean E2E run exposed materializer and validator drift in several places:

- Full-app materialization could emit wrapper `TenantID: "0"` instead of failing closed when no tenant identity was available.
- Dashboard planning parsers treated generic coverage or decision tables as real dashboard pages.
- Dashboard dataset, data table, and analytics template rows were not consistently read from `Selected Template`, `Selected Golden Reference Template`, or `Template ID` columns.
- Dashboard collection templates could collapse to a single default template because scoped records were rotated across pages.
- Data table template selections were not materialized from App Plan records.
- KPI/Summary controls could be mistaken for summary-like resources based on business text instead of actual summary control type.
- Summary runtime registration needed both `save_var` and `saveVar` surfaces for downstream validators and runtime consumers.
- Approval form generation could lose legitimate business fields named `Purpose` because broad generic filtering treated the word as non-resource prose.
- Approval workflow materialization and validation did not consistently normalize service-action style nodes used for create, update, archive, or master-data workflow steps.
- Data-list form layout validation could confuse View-form operation text containing `edit` with New/Edit form layout declarations.
- App Plan resource-order validation could inspect placeholder or instruction lines as if they were real planned resources.

## Training Rules Added

Full-app materialization must now follow these rules:

- Refuse non-fixture materialization when no tenant ID is available. Do not emit generated-final packages with `TenantID: "0"`.
- Only treat real dashboard page headings as dashboard pages. Ignore coverage matrices, template-selection tables, business decision gates, and other planning support sections.
- Build the required dashboard list from all dashboard-specific App Plan records, including filters, KPI/Summary metrics, dataset presentations, data analytics, and data tables.
- Materialize dashboard dataset/data-table/analytics records only for the intended page and template. Do not rotate scoped records into unrelated pages to fill gaps.
- Preserve all approved template IDs from the App Plan and record explicit provenance on generated controls.
- Keep unscoped KPI/Summary metric plans available to each planned dashboard only when there is no page-specific metric plan.
- Register Summary runtime fields with both `save_var` and `saveVar` so control JSON and runtime models remain aligned.
- Treat Summary controls by control type, not by names or labels containing words such as `summary`.
- Preserve literal business field labels such as `Purpose` in approval forms.
- Normalize approval workflow service-action nodes into publish-ready runtime node categories.
- Validate data-list form layout declarations by the relevant table cells, not by unrelated operation text.
- Ignore placeholder and instruction rows in App Plan resource-order checks.

## Validator Alignment

The validators were aligned with the materializer contract:

- Dashboard dataset presentation validation now recognizes approved template-selection column labels and explicit provenance variants.
- Data analytics validation ignores generic template-selection matrices when no real dashboard page context is present.
- Generated-final resource completeness ignores planning support headings that are not actual dashboard pages.
- Default YAPK validation only treats actual summary controls as summary controls.
- Approval workflow publish-readiness validation accepts the normalized service-action workflow node shapes.
- Data-list form layout validation avoids false positives from View-form operation wording.
- App Plan resource-order validation skips placeholder and required-instruction rows.

## Regression Coverage

Focused regression coverage was extended to prove:

- Missing tenant identity fails closed before package generation.
- Fixture mode still uses a deterministic non-zero numeric tenant ID.
- A nontrivial App Plan can materialize a complete resource graph with data lists, approval forms, dashboards, dashboard collections, data analytics, data tables, navigation, and runtime metadata.
- Approval form fields preserve a field named `Purpose`.
- Generic dashboard template coverage sections do not create fake dashboard page requirements.
- Dataset and analytics template records are mapped to their intended dashboard pages.
- View item form rows mentioning edit behavior do not require New/Edit layout templates.
- App Plan placeholder rows do not trigger unsupported-template findings.

## Proof Boundary

This training closes local materializer and validator gaps found by the 0.8.75 generated-final feedback. It does not claim that the previously generated 0.8.75 package is now signed, installed, upgraded, or runtime verified. Any future generated package must still pass generated-final preflight, signing readiness, signing, install or upgrade acceptance, Version Management `Succeed`, and browser runtime proof before being considered live-ready.
