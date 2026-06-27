# Dashboard Workbench Page Layout Template Training Report

## Summary

This training adds `dashboard-page-layouts-workbench` as a second approved Dashboard page layout template alongside the default `dashboard-page-layouts-v1.1` general Dashboard shell.

The template was extracted from the `Workbench Dashboard` page in the manually exported `Application page layouts-V2.1.yapk`. The complete parsed Workbench Dashboard page resource is now preserved as an independent JSON template:

`docs/reference/dashboard-page-layout-workbench.template.json`

The registry was updated at:

`docs/reference/dashboard-page-layout-templates.json`

## Template ID

`dashboard-page-layouts-workbench`

## When To Use

Use Workbench for operational dashboards that need:

- a primary working area
- an optional right-side context panel
- queue/list/work item regions
- filters near the top of the page
- KPI cards
- grouped Data Analytics cards
- supporting side-panel context such as alerts, related records, or actions

Use the default `dashboard-page-layouts-v1.1` template for broad overview dashboards, report-style dashboards, and pages that do not need the Workbench two-panel structure.

## Key Structure

The extracted Workbench template includes:

- `main > content`
- `page_title_header`
- top `section_content_area`
- `dashboard_standard_filter_group`
- top `kpi_cards_kpi_row`
- `main_work_queue_section`
- `main_work_queue_wrapper`
- `primary_working_area`
- optional `right_side_panel`
- `chart_cards_section` under both `primary_working_area` and `right_side_panel`

## Controlled Slots

Business content is allowed only inside approved Workbench slots:

- `page_title_content`
- `Operations`
- `section_content_area`
- `section_title_header`
- `dashboard_standard_filter_group`
- `kpi_cards_kpi_row`
- `kpi_card_wrapper`
- `primary_working_area`
- `right_side_panel`
- `chart_cards_section`

Non-slot structural containers must preserve the template's exported structure, style, layout, padding, typography, direction, gap, and background settings.

## Repeatable And Removable Modules

The generator may remove, duplicate, or reorder:

- `content_card_wrapper`
- `content_card_60_wrapper`
- `content_card_40_wrapper`
- `1_columns_section`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `1_row_section`
- `2_rows_section`
- `3_rows_section`
- `kpi_metrics_wrapper`
- `kpi_cards_kpi_row`
- `kpi_card_wrapper`
- `chart_cards_section`

New layout must come from copying an approved repeatable module. Invented layout containers are not allowed.

## Chart Cards Section

`chart_cards_section` is the preferred host for multiple Data Analytics templates in Workbench dashboards.

Rules added:

- Place `chart_cards_section` only under `primary_working_area` or `right_side_panel`.
- Remove `chart_cards_section` when no Data Analytics template is materialized.
- Put no more than three Data Analytics templates in one `chart_cards_section`.
- Add another `chart_cards_section` if more than three analytics templates are required.

## Right Side Panel

`right_side_panel` is optional and must be removed when it has no real business content.

## Validator Updates

`scripts/validate-dashboard-page-layout-template.mjs` now:

- recognizes both registered Dashboard page layout templates
- keeps `dashboard-page-layouts-v1.1` as the default template
- selects `dashboard-page-layouts-workbench` when a generated page declares that template marker
- applies template-specific allowed business slots
- applies template-specific repeatable/removable modules
- validates Workbench `chart_cards_section` parent and analytics count rules
- rejects empty Workbench `chart_cards_section`
- rejects empty Workbench `right_side_panel`
- preserves the default v1.1 validator behavior for existing dashboards

## Regression Coverage

Added focused regression coverage:

`scripts/test-dashboard-workbench-page-layout-template-gates.mjs`

The test covers:

- registry includes Workbench
- generated Workbench page can delete unused right-side panel
- generated Workbench page can keep right-side panel when it has business content
- empty `chart_cards_section` fails
- `chart_cards_section` outside approved panels fails
- more than three analytics templates in one `chart_cards_section` fails
- empty `right_side_panel` fails

Existing v1.1 tests continue to pass:

- `scripts/test-dashboard-page-layout-template-gates.mjs`
- `scripts/test-dashboard-page-layout-controlled-slots-gates.mjs`

## Safety Boundary

This training changes template registry, validation, standards, skill guidance, and cache artifact expectations only. It does not bump plugin version, move stable, sign packages, install packages, or perform live Yeeflow writes.
