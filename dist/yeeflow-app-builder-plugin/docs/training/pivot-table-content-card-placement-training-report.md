# Pivot Table Content Card Placement Training Report

Date: 2026-07-08

## Problem

The generator and Data Analytics placement validator treated `data_analytics_pivot_table_standard` like chart-card analytics. This allowed Pivot table controls to be placed inside `chart_cards_section` on Workbench Dashboards or Workbench Data List View Item forms.

That is not the right page semantics. A Pivot table is a table-like, multi-row/multi-column control, closer to Collection and Data table layout than to chart cards. When placed in `chart_cards_section`, the control inherits a card-grid host that is optimized for compact chart cards and does not provide the table-style reading area expected for a Pivot table.

## Required Rule

`data_analytics_pivot_table_standard` / `pivot_table_standard` must be hosted as a content section:

- Place it inside `content_card_wrapper > section_content_area`.
- Prefer hosting that `content_card_wrapper` inside `1_columns_section`.
- If the Pivot table has few columns, the card may be hosted inside `2_columns_section`, `2_columns_60/40_section`, or `3_columns_section`.
- Do not place Pivot tables inside `chart_cards_section`.

This rule applies to Dashboard pages and Data List View Item forms, including Workbench-style surfaces.

## Chart-Like Analytics Rule

Chart-like analytics remain chart cards:

- `data_analytics_pie_chart_with_title`
- `data_analytics_column_chart_with_title`
- `data_analytics_bar_chart_with_title`
- `data_analytics_line_chart_with_title`
- `data_analytics_area_chart_with_title`

On Workbench and workspace Dashboard layouts, these chart-like templates should continue to use `chart_cards_section` under an approved working-area container.

## Validator Changes

The Data Analytics golden-reference validator now distinguishes chart-like controls from Pivot tables:

- Chart-like analytics on Workbench/workspace layouts must still be placed in `chart_cards_section`.
- Pivot tables fail if any ancestor is `chart_cards_section`.
- Pivot tables fail unless the ancestor chain contains both `content_card_wrapper` and `section_content_area`.

New hard gate codes:

- `DATA_ANALYTICS_PIVOT_CHART_SECTION_FORBIDDEN`
- `DATA_ANALYTICS_PIVOT_SECTION_PLACEMENT_INVALID`

## Regression Coverage

`scripts/test-data-analytics-golden-reference-gates.mjs` now covers:

- Workbench Dashboard with chart-like analytics in `chart_cards_section` and Pivot table in `content_card_wrapper > section_content_area`.
- Workbench Data List View Item form with the same split placement.
- Negative Dashboard and Data List form cases where Pivot table is incorrectly placed inside `chart_cards_section`.

## App Plan Guidance

The App Plan must not group Pivot table into chart-card regions. When a Data Analytics table selects `data_analytics_pivot_table_standard`, the planned placement family should be a content-card section, not `chart_cards_section`.
