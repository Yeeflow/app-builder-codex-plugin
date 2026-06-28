# Generated-Final Preflight App Plan and Runtime Alignment Training Report

## Summary

This training follows the `0.8.77` Office Asset Loan Management clean E2E validation. The generated package showed major progress: tenant identity, ID provenance, navigation, Collection template diversity, Data Analytics templates, Data Table templates, select-filter contract, and empty-section cleanup were all improved. The package still stopped before signing because generated-final preflight found remaining App Plan, Summary/KPI, and Data List Form layout alignment gaps.

## Source Evidence

The blocking evidence came from:

- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0877-clean-e2e-revalidation-report.md`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0877-generated-final-validation-summary.md`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0877-dashboard-dataset-presentation.txt`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0877-runtime-binding-lessons.txt`
- `/Users/rengerhu/Documents/Plugin Test2/office-asset-loan-management-20260628-001934-0872-template-e2e/validation/0877-yapk-first-generation-preflight.txt`

No signing, install/import, upgrade, seed-data, Version Management proof, or browser runtime proof should be inferred from this training.

## Defects Covered

The validation exposed three alignment issues:

- Dashboard dataset App Plan validation still scanned earlier prose-only planning rows after a later canonical exact-template table had already selected approved Collection template IDs.
- Full-app materialization needed a safe compatibility mapping for old prose descriptions such as "Grid-table with multiselect" and "Responsive cards" so they do not silently fall back to the base grid-table template.
- Dashboard Summary/KPI runtime validation treated `ListDataID` as a missing business field even though Summary count contracts use it as a Yeeflow system record field.
- Dashboard filter variable declarations could be carried in from copied Collection template dependencies even when no generated consumer used them.
- Data List Form planning must stay explicit: every generated business Data List or Document Library needs custom New/Edit and View/Workbench form rows with exact approved template IDs and Workbench View forms must declare Full page opening.

## Rules Added

App Plan generation and validation now follow these rules:

- A canonical Dashboard Collection selection table with exact approved IDs is authoritative. Earlier prose-only support tables must not override or poison the canonical table.
- Future App Plans must write exact approved Collection template IDs in the selected-template column. Prose descriptions may appear only as rationale.
- Legacy prose aliases are accepted only as a migration compatibility path when they map to exactly one approved Collection template.
- Summary count controls may use `ListDataID` as a system field. Validators must not require it to appear in business `Fields[]`.
- Summary control IDs must be registered on the dashboard resource's own `ReportIds[]`; compatible wrapper-level report-id surfaces may also be read, but the resource-level contract remains required.
- Page-level `filterVars[]` must contain only variables consumed by real generated filters or downstream consumers. Copied template dependencies that are not used in the final page must be pruned.
- Every business Data List and Document Library must have an App Plan row for a custom New/Edit form using `data_list_form_layout_new_edit_v1_1` and a custom View form using either `data_list_form_layout_view_item_v1_1` or `data_list_form_layout_workbench`.
- `data_list_form_layout_workbench` is valid only for View Item, and the App Plan must explicitly say it opens Full page.

## Validator and Generator Alignment

The Dashboard dataset validator now prefers structured exact-ID planning records when they are present. The materializer still supports old prose aliases, but only through deterministic mappings to approved template IDs. The runtime binding validator recognizes system dashboard fields and reads dashboard resource `ReportIds[]`. The materializer prunes unused copied filter variables after final control placement.

## Proof Boundary

This training aligns generated-final preflight contracts. It does not claim that the previously generated `0.8.77` package is now signing-ready, installed, upgraded, or runtime-verified. A regenerated package must still pass full generated-final preflight before any signing/install/runtime stage.
