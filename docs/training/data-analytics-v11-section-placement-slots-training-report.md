# Data Analytics v1.1 Section Placement Slots Training Report

## Purpose

This training updates the approved placement contract for the six Data Analytics golden reference templates:

- `data_analytics_pie_chart_with_title`
- `data_analytics_column_chart_with_title`
- `data_analytics_bar_chart_with_title`
- `data_analytics_line_chart_with_title`
- `data_analytics_area_chart_with_title`
- `data_analytics_pivot_table_standard`

The templates remain full template-clone components with locked style, layout, typography, runtime `ReportIds[]`, and `Resource.exts[]` contracts. Only the approved title and data-binding regions may be adapted to the generated business app.

## Updated Placement Contract

For Dashboard Page Layouts v1.1, Data Analytics templates may be placed in:

- `content_card_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`

For Custom Data List Form Layouts v1.1, Data Analytics templates may be placed only on View Item forms using `data_list_form_layout_view_item_v1_1`, and may be placed in:

- `content_card_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`

Data Analytics templates remain forbidden on Approval forms and Data List New/Edit forms.

## Generator Requirements

The full-app materializer must search the approved Dashboard v1.1 analytics host modules, including `content_card_wrapper` and `2_columns_60/40_section`, when placing planned Data Analytics regions. It must not invent new analytics host modules or place analytics directly under root `Content`.

When a Custom Data List View Item form plans analytics regions, generated output must use the same approved host contract and must not downgrade the View Item form into a Dashboard page shell.

## Validation Coverage

The focused Data Analytics golden-reference test suite now covers:

- Dashboard v1.1 analytics in `content_card_wrapper`
- Dashboard v1.1 analytics in `2_columns_section`
- Dashboard v1.1 analytics in `3_columns_section`
- Dashboard v1.1 analytics in `2_columns_60/40_section`
- Data List View Item analytics in the same approved hosts
- Data List New/Edit analytics rejection
- Approval form analytics rejection
- rejection of Dashboard/Data List View Item analytics outside approved hosts

These checks run through `scripts/validate-data-analytics-golden-references.mjs` and the generated-final / first-generation preflight path that invokes it.
