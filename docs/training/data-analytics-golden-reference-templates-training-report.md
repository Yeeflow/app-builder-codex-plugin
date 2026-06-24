# Data Analytics Golden Reference Templates Training Report

## Purpose

This training introduces export-shaped golden reference templates for Pie chart, Column chart, Bar chart, Line chart, Area chart, and Pivot table Data Analytics controls.

## Source Templates

- `Pie_chart_with_title.json` -> `data_analytics_pie_chart_with_title`
- `Column_chart_with_title.json` -> `data_analytics_column_chart_with_title`
- `Bar_chart_with_title.json` -> `data_analytics_bar_chart_with_title`
- `Line_chart_with_title.json` -> `data_analytics_line_chart_with_title`
- `Area_chart_with_title.json` -> `data_analytics_area_chart_with_title`
- `pivot_table_standard.json` -> `data_analytics_pivot_table_standard`

## Behavior Added

- Data Analytics templates are a closed approved list.
- Dashboard and Data List form usage is allowed.
- Approval form usage is blocked.
- Dashboard Page Layouts v1.1 placement is restricted to `2_columns_section` and `3_columns_section`.
- Chart-with-title templates must preserve wrapper, style, layout, and typography while allowing business title text and chart data binding.
- Pivot table generation must preserve exported style settings.
- Generated-final preflight now runs Data Analytics golden reference validation.

## Safety Boundary

This training adds local validation and generation guidance only. It does not sign, install, import, upgrade, or call live Yeeflow package APIs.
