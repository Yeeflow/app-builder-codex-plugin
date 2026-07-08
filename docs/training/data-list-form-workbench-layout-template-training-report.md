# Data List Form Workbench Layout Template Training Report

## Purpose

This training adds `data_list_form_layout_workbench` as a third approved Data List Form Layouts v1.1 golden reference template. The template is parsed from the user-provided `Data list page layouts (1).ydl` export and corresponds to the `Workbench item details` custom Data List form.

## Template Contract

- Template ID: `data_list_form_layout_workbench`
- Source form: `Workbench item details`
- Intended usage: Data List or Document Library View Item custom forms only
- Required opening behavior: Full page
- Default operation buttons: hidden by the template and must remain hidden
- Source template file: `docs/reference/data-list-form-layout-workbench.template.json`

Generated forms must preserve the exported root shell, page background, full-width content, padding, typography, and locked layout regions. Business content may be mapped only into the approved Workbench regions, including `page_title_content`, `Operations`, `section_content_area`, `section_title_header`, `kpi_card_wrapper`, `primary_working_area`, `right_side_panel`, and `chart_cards_section`.

## Workbench-Specific Rules

- `data_list_form_layout_workbench` must not be assigned to New Item or Edit Item forms.
- `ListModel.LayoutView.view` must point to the Workbench Type `1` layout.
- `ListModel.LayoutView.opentype.view` must open the Workbench View as Full page.
- `right_side_panel` is optional and must be removed when it contains no real business content.
- `chart_cards_section` is optional and must be removed when it contains no chart-like Data Analytics or other business content.
- Each `chart_cards_section` should contain no more than three chart-like Data Analytics templates; create another `chart_cards_section` when more chart cards are required.
- Chart-like Data Analytics templates on Workbench View forms must be placed inside `chart_cards_section`.
- Pivot table templates must be placed inside `content_card_wrapper > section_content_area`, not inside `chart_cards_section`.

## App Plan Changes

The App Plan Data List Form Layout Template Selection table now accepts:

- `data_list_form_layout_new_edit_v1_1` for New/Edit forms
- `data_list_form_layout_view_item_v1_1` for standard View forms
- `data_list_form_layout_workbench` for full-page Workbench View forms

Workbench rows must explicitly declare `Open in: Full page`.

## Validator Coverage

The Data List Form Layouts v1.1 validator now checks:

- Workbench template registry presence and source template availability
- required Workbench root regions
- Workbench View-only usage
- full-page `LayoutView.opentype.view` display assignment
- empty Workbench `right_side_panel` rejection
- empty Workbench `chart_cards_section` rejection
- overfilled `chart_cards_section` analytics rejection
- App Plan Workbench full-page declaration

The Data Analytics golden reference validator now treats Workbench Data List View forms like Workbench dashboards for chart-like analytics placement: charts must be inside `chart_cards_section`, while Pivot tables must use `content_card_wrapper > section_content_area`.

## Regression Tests

Updated focused suites:

- `scripts/test-data-list-form-layout-template-gates.mjs`
- `scripts/test-data-analytics-golden-reference-gates.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

No release bump is included in this training PR.
