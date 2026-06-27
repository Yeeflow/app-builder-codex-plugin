# Dashboard Page Layouts Workbench Standard

## Purpose

`dashboard-page-layouts-workbench` is an approved alternate Dashboard page layout for operational workbench pages. It coexists with the default `dashboard-page-layouts-v1.1` general Dashboard shell. The App Plan must explicitly select the page layout template for each Dashboard page before generation.

Use Workbench when the page needs a primary working area plus optional supporting context, such as queues, operational follow-up lists, filters, KPI cards, and compact analytics panels. Use the default `dashboard-page-layouts-v1.1` shell for general overview dashboards, broad reporting pages, and simpler section-first dashboards.

## Registered Source

The registry is:

`docs/reference/dashboard-page-layout-templates.json`

The complete extracted template resource is:

`docs/reference/dashboard-page-layout-workbench.template.json`

The template id and version are:

`dashboard-page-layouts-workbench`

The source was extracted from `Workbench Dashboard` in the manually exported `Application page layouts-V2.1.yapk`.

## Required Shell

Generated Workbench dashboards must copy the registered Workbench shell before business mapping. Preserve:

- page root `attrs.hideHeaderAll = true`
- root background `#f4f7fb`
- zero root page padding
- `main > content`
- canonical Workbench `content` padding
- `page_title_header`
- optional top `section_content_area` for filters or other valid top content
- optional top `kpi_cards_kpi_row`
- `main_work_queue_section`
- `main_work_queue_wrapper`
- `primary_working_area`
- optional `right_side_panel`

Do not copy a source app root shell, source IDs, source fields, or source domain labels from the template package.

## Workbench Structure

The primary structure is:

- `page_title_header`: page title, description, and optional operations.
- top `section_content_area`: usually filter controls such as `dashboard_standard_filter_group`; it may also host other approved top-level Workbench content when planned.
- top `kpi_cards_kpi_row`: optional KPI cards.
- `main_work_queue_section`: the main two-panel workbench region.
- `main_work_queue_wrapper`: parent of the primary area and optional right-side panel.
- `primary_working_area`: the main operational queue/analytics area.
- `right_side_panel`: optional supporting context panel.

`primary_working_area` may contain selected modules copied from the template, including `kpi_metrics_wrapper`, `1_columns_section`, `2_columns_section`, `3_columns_section`, `2_columns_60/40_section`, and `chart_cards_section`.

`right_side_panel` may contain selected modules copied from the template, including `kpi_metrics_wrapper`, `1_row_section`, `2_rows_section`, `3_rows_section`, and `chart_cards_section`.

## Controlled Slots

Business content may be mapped only inside approved Workbench business slots:

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

Every other container is structural and must preserve the template's exported style, layout, typography, padding, direction, gap, and background contract.

## Repeatable And Removable Modules

The following Workbench modules may be removed, duplicated, or reordered based on business requirements:

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

New layout must be added by copying one of these approved modules. Do not invent new layout containers.

## Chart Cards Section

`chart_cards_section` is the preferred host for Data Analytics templates on Workbench dashboards. It may appear under `primary_working_area` or `right_side_panel`.

Rules:

- Use `chart_cards_section` when multiple Data Analytics templates are displayed together.
- Place no more than three Data Analytics templates in a single `chart_cards_section`.
- Add another `chart_cards_section` when more than three analytics cards are needed.
- Remove `chart_cards_section` when no Data Analytics template is planned or materialized.
- `chart_cards_section` must not appear outside `primary_working_area` or `right_side_panel`.

Data Analytics templates inside `chart_cards_section` must still clone the approved Data Analytics golden reference subtree and include runtime `ReportIds`/`exts` model registration before signing readiness.

## Right Side Panel

`right_side_panel` is optional. Keep it only when it contains real business content such as context cards, alerts, analytics, related records, or actions.

If the entire `right_side_panel` has no planned business content, remove it from the generated page. An empty right-side panel is a generated-final error.

## Section Cleanup

Generated Workbench dashboards must not retain empty copied sections. Remove any empty:

- `section_content_area`
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
- `chart_cards_section`

Template-source empty slots are allowed only in the registry template. They are not allowed in generated-final resources.

## KPI Cards

Workbench KPI cards use the generic `kpi_card_wrapper` from the Workbench template. KPI cards are demand-driven:

- If no KPI metrics are planned, remove KPI containers.
- If one to three KPI cards are planned, include exactly that number.
- If more KPI cards are needed, duplicate `kpi_card_wrapper` and map the business metric.
- Do not keep source KPI examples only because the template contains them.

Live KPI values require the same Summary-backed runtime contract as other Dashboard KPI cards.

## Collection And Data Analytics Components

Approved Dashboard Collection templates may be placed inside Workbench business content slots such as a `section_content_area` in the primary working area or right-side panel. Clone the selected Collection template exactly and map only approved editable regions.

Approved Data Analytics templates may be placed inside Workbench `chart_cards_section` or other planned Workbench content slots when the page design requires it. `chart_cards_section` is preferred for grouped analytics.

## Validation

Generated Workbench dashboards must pass:

- `scripts/validate-dashboard-page-layout-template.mjs`
- `scripts/test-dashboard-workbench-page-layout-template-gates.mjs`
- aggregate Dashboard hard gates before signing readiness

Do not sign or install a package whose generated Workbench page leaves empty section shells, empty chart sections, empty right-side panels, unresolved template placeholders, or template-provenance-only analytics.
