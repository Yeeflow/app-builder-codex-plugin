# Data Analytics Golden Reference Standard

This standard defines the only approved Data Analytics templates for generated Yeeflow Dashboard pages and Data List forms.

## Approved Templates

- `data_analytics_pie_chart_with_title`
- `data_analytics_column_chart_with_title`
- `data_analytics_bar_chart_with_title`
- `data_analytics_line_chart_with_title`
- `data_analytics_pivot_table_standard`

Each template is stored as an export-shaped JSON artifact under `docs/reference/`. Generators must clone the approved template subtree and remap only the declared editable business regions. They must not create simplified chart or pivot lookalikes.

## Surface Rules

Data Analytics templates may be used on:

- Dashboard pages.
- Data List forms.

Data Analytics templates must not be used on Approval forms because Approval forms do not support Data Analytics controls.

## Dashboard Page Layouts v1.1 Placement

When a Dashboard page uses `dashboard-page-layouts-v1.1`, Data Analytics templates must be placed inside a `2_columns_section` or `3_columns_section` business-content area. They must not be placed directly under root `Content`, page title regions, `Operations`, KPI wrappers, Collection-only regions, or copied source-app shells.

## Fidelity Rules

For chart-with-title templates, the outer wrapper and all descendants are locked except:

- The chart container data-source binding.
- The title Text value.

For the pivot table template, the exported pivot-table style settings are locked. Only legal rows, columns, values, filters, and data-source binding may change.

Generated-final validation must fail when:

- A Data Analytics control has no approved template provenance.
- A chart wrapper is missing.
- A pivot table does not preserve the approved template identity.
- A template appears on an Approval form.
- A Dashboard v1.1 page places an analytics template outside `2_columns_section` or `3_columns_section`.
- A generator emits an ad hoc chart/pivot control instead of cloning the approved template.
