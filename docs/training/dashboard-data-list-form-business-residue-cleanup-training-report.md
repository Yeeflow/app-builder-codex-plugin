# Dashboard And Data List Form Business Residue Cleanup Training Report

## Scope

This training pass hardens generated Dashboard pages and custom Data List View forms against copied template residue. It is based on Service Tickets validation evidence where generated master-detail Dashboard and View Item forms rendered functional controls, but still retained Office Asset / Loan business copy and optional sections that had no Service Tickets purpose.

## Confirmed Failure Mode

Generated Service Tickets pages retained copied template modules and text such as:

- `Active Loan Pipeline`
- `current loan volume`
- `return activity signal`
- `watch coordinator follow-up`
- `Office Asset records`
- `Coordinator guidance: prioritize overdue items and returns due within the next seven days.`

The affected regions included:

- Dashboard detail-pane KPI cards that were not backed by real Service Tickets KPI/Summary requirements.
- `content_card_wrapper > section_title_area > section_title_header` copied from a source template.
- Custom Data List View Item forms for supporting lists such as ticket attachments and comments.

This is a generator/template adaptation defect. The package may be structurally valid and visually render, but the final application is not business-correct because copied modules from another domain remain on the page.

## Generation Rule

Generated pages and forms must treat title headers, operations, KPI rows, and copied related-content sections as optional business modules, not mandatory skeleton content.

The generator must:

- Clone approved golden reference templates first.
- Materialize only the sections required by the Functional Specification and App Plan.
- Remove unused copied modules before generated-final validation.
- Remove source-template business copy unless it is explicitly mapped to real current-domain content.
- Never keep loan, Office Asset, event, or other source-domain helper copy in a different business app.

## Section Title Area Rule

`section_title_header` may be edited or removed. It is not required on every generated `content_card_wrapper`.

If `section_title_header` is not needed and the sibling `Operations` region is also absent or has no configured actions, the owning `section_title_area` must be removed.

This rule applies to:

- Dashboard page layouts, including master-detail workspace layouts.
- Custom Data List form layouts v1.1.
- Workbench View Item forms.

For master-detail Dashboard detail panes, nested related components such as Collections, Data tables, charts, and field grids should carry the visible business title when appropriate. Do not keep copied section headers such as `Left Ticket List` or `Active Loan Pipeline` just because the source template included them.

## KPI Rule

KPI modules are optional. Generate `kpi_metrics_wrapper`, `kpi_cards_kpi_row`, and `kpi_card_wrapper` only when the App Plan requires KPI metrics and the generator can produce runtime-bound Summary/KPI controls for the current business domain.

Custom Data List View forms for supporting lists such as attachments, comments, audit rows, or lightweight child records must not inherit Dashboard KPI cards by default.

## Validator Coverage

This training adds or strengthens gates for:

- `DASH_SOURCE_TEMPLATE_BUSINESS_TEXT_RESIDUE`
- `DASH_EMPTY_SECTION_TITLE_AREA`
- `DASH_MASTER_DETAIL_REDUNDANT_SECTION_TITLE_HEADER`
- `DATA_LIST_FORM_LAYOUT_TEMPLATE_RESIDUAL_LABEL`
- `DATA_LIST_FORM_LAYOUT_EMPTY_SECTION_TITLE_AREA`

The gates must fail generated packages that retain visible copied source-domain business copy or empty/title-only section title areas.

## Regression Expectations

Before release readiness, run:

```bash
node scripts/test-dashboard-generation-hard-gates.mjs
node scripts/test-data-list-form-layout-template-gates.mjs
node scripts/test-dashboard-master-detail-workspace-page-layout-template-gates.mjs
node scripts/test-dashboard-page-layout-template-gates.mjs
```

The generated-final preflight must reject packages that preserve copied source-domain copy or optional title/KPI modules without real business content.
