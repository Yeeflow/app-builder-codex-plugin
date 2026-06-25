# Data List Form Fields Grid Template Training Report

## Summary

This training adds `data_list_form_fields_grid_v1_1` as the approved field-layout golden reference for current-record fields on generated custom Data List New, Edit, and View forms.

The source template was provided as:

`/Users/rengerhu/Downloads/data_list_form_grid_fields.json`

The approved template is registered under:

- `docs/reference/data-list-form-field-layout-templates.json`
- `docs/reference/data-list-form-fields-grid.template.json`

## Template Contract

The root wrapper is:

- `form_grid_fields_wrapper`
- control type: `flex_grid`

Generated field controls must be placed inside this wrapper. When used with Data List Form Layouts v1.1, the wrapper must live inside `section_content_area`.

The template is designed to be used inside:

- `data_list_form_layout_new_edit_v1_1`
- `data_list_form_layout_view_item_v1_1`

## Business Rules Captured

- PC/laptop Grid columns should be 2 or 3.
- Tablet columns must not exceed PC/laptop columns.
- Mobile columns should be 1.
- Every generated field control inside the wrapper must explicitly set margin to zero.
- Multiple line, Rich text, and Sub list controls must span the full parent Grid width on every configured breakpoint.
- A Grid cell may contain one direct control; use a Container or nested Grid when multiple controls must share a cell.
- Dynamic display rules may be applied to grouped Containers or nested Grids when several fields share the same visibility condition.
- Large field groups may be split into multiple `content_card_wrapper` sections, each with one `form_grid_fields_wrapper` in `section_content_area`.

## App Plan Impact

The App Plan `Custom Data List Forms Plan` now includes a `Form Fields Layout Template Selection` table.

Every generated current-record field group on a custom New/Edit/View form must select:

`data_list_form_fields_grid_v1_1`

The table records field group, responsive column counts, full-row fields, Dynamic display grouping, and proof boundary. It must not include generated IDs, copied JSON, or runtime payload details.

## Generator Impact

The full-app generated-final materializer now clones `form_grid_fields_wrapper` before placing current-record field controls in custom Data List forms. It no longer places generated fields directly into `section_content_area`.

## Gates Added

- `scripts/validate-data-list-form-fields-template.mjs`
- `scripts/test-data-list-form-fields-template-gates.mjs`
- first-generation preflight gate: `data-list-form-fields-v1.1`
- aggregate UI hard-gate registration
- YAPK cache artifact registration
- App Plan resource-order validation for `Form Fields Layout Template Selection`

## Safety Boundary

This training does not move `stable`, create tags/releases/plugin archives, call live Yeeflow write APIs, sign packages, install/import applications, or run runtime browser proof.
