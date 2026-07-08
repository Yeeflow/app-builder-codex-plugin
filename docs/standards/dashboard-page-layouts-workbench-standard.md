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

## Standard Filter Group

When a Workbench Dashboard has two or more page-level/global Data Filter controls, the filters must be placed inside `dashboard_standard_filter_group` in the top `section_content_area`.

For Workbench, `dashboard_standard_filter_group` must be copied from `docs/reference/data-filter-standard-filter-group.template.json` exactly as the standard `flex_grid` control:

- PC/laptop: four `1fr` columns
- tablet: two `1fr` columns
- mobile: one `1fr` column
- one `auto` row definition
- 16px column gap and 16px row gap
- `displayLabel = [null, false]`
- `nv_label = "dashboard_standard_filter_group"`

Each Grid cell may host one mapped Data Filter control. The generator may add rows through the Grid's normal wrapping behavior when there are more than four filters, but it must not replace the Grid with a container or use simplified `columns.count/type/minmax` properties. Those simplified Grid properties are not Designer-safe and are a generated-final error.

## Main Work Queue Columns

`main_work_queue_wrapper` starts from the two-column Workbench template because the optional `right_side_panel` may contain supporting context.

If the generated page removes `right_side_panel` or leaves it without real business content, `main_work_queue_wrapper` must also remove the second column track. In that case, the Grid should serialize as a single `1fr` column for PC/laptop, tablet, and mobile. A generated Workbench page with only `primary_working_area` but a retained empty second desktop column is invalid because it creates a blank right-side area in Designer/runtime.

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

`chart_cards_section` is the preferred host for chart-like Data Analytics templates on Workbench dashboards. It may appear under `primary_working_area` or `right_side_panel`.

Rules:

- Use `chart_cards_section` when multiple chart-like Data Analytics templates are displayed together.
- Place no more than three chart-like Data Analytics templates in a single `chart_cards_section`.
- Add another `chart_cards_section` when more than three analytics cards are needed.
- Remove `chart_cards_section` when no chart-like Data Analytics template is planned or materialized.
- `chart_cards_section` must not appear outside `primary_working_area` or `right_side_panel`.
- Do not place `data_analytics_pivot_table_standard` / `pivot_table_standard` inside `chart_cards_section`. Pivot tables are table-like regions and must be hosted in `content_card_wrapper > section_content_area`, preferably inside `1_columns_section`; use `2_columns_section`, `2_columns_60/40_section`, or `3_columns_section` only when the pivot has few columns.

Data Analytics templates must still clone the approved Data Analytics golden reference subtree and include runtime `ReportIds`/`exts` model registration before signing readiness.

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

Every `section_content_area` copied from the Workbench Dashboard golden reference must preserve `attrs.style.gap = [null, "--sp--s200"]`. Do not keep or regenerate the legacy `--sp--s0` gap for Workbench content slots.

Approved chart-like Data Analytics templates may be placed inside Workbench `chart_cards_section` when the page design requires grouped chart cards. Pivot table templates must be placed in a normal content-card section, not in `chart_cards_section`.

## Validation

Generated Workbench dashboards must pass:

- `scripts/validate-dashboard-page-layout-template.mjs`
- `scripts/test-dashboard-workbench-page-layout-template-gates.mjs`
- aggregate Dashboard hard gates before signing readiness

Do not sign or install a package whose generated Workbench page leaves empty section shells, empty chart sections, empty right-side panels, unresolved template placeholders, or template-provenance-only analytics.
