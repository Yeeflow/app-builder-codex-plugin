# Data List Form Layouts v1.1 Golden Reference Training Report

## Scope

This training introduces `data-list-form-layouts-v1.1` as the canonical page-level golden reference for generated Yeeflow custom Data List forms.

The source export is the user-provided `Data list page layouts.ydl`. The source Data List is `Data list page layouts` and contains two custom forms:

- `New and Edit form`, used by the source list for New Item and Edit Item.
- `View item`, used by the source list for View Item.

## Registered Templates

The extracted template artifacts are:

- `docs/reference/data-list-form-layout-new-edit.template.json`
- `docs/reference/data-list-form-layout-view-item.template.json`
- `docs/reference/data-list-form-layout-templates.json`

Approved template ids:

- `data_list_form_layout_new_edit_v1_1`
- `data_list_form_layout_view_item_v1_1`

## Generation Contract

New Item and Edit Item custom forms must clone `data_list_form_layout_new_edit_v1_1`.

View Item custom forms must clone `data_list_form_layout_view_item_v1_1`.

The generator must preserve the selected template root shell, page background, `main > content`, root full-width and zero-padding contract, section card structure, widths, spacing, typography, and locked non-business regions.

Business-specific content may be inserted or changed only inside:

- `page_title_content`
- `Operations`
- `section_content_area`
- `section_title_header`
- `kpi_card_wrapper`

New/Edit forms must focus on current-record editing and must not include related Collections, Data Analytics controls, KPI regions, or Dashboard page shells.

View Item forms may include current-record details plus related business data, approved Dashboard Collection templates, Data Analytics templates, and KPI cards, but only inside approved business-content slots.

## App Plan Contract

The App Plan Custom Data List Forms Plan must include a Data List Form Layout Template Selection table for each custom Data List form.

New/Edit form rows must select `data_list_form_layout_new_edit_v1_1`.

View form rows must select `data_list_form_layout_view_item_v1_1`.

The App Plan may describe business sections and related data needs, but it must not include generated `ListID`, `LayoutID`, runtime IDs, JSON payloads, or low-level generated package properties.

## Validation Coverage

New validator:

- `scripts/validate-data-list-form-layout-template.mjs`

Focused regression suite:

- `scripts/test-data-list-form-layout-template-gates.mjs`

Preflight integration:

- `scripts/yapk-first-generation-preflight.mjs`

Aggregate/cache registration:

- `scripts/test-ui-hard-gates-all.mjs`
- `scripts/test-yapk-hard-gate-cache-artifacts.mjs`

The gate validates registry quality, template resource shape, generated package template provenance, New/Edit versus View template selection, allowed business slots, forbidden New/Edit related-data regions, View Item page-title/KPI regions, and App Plan template-selection rows.

## Materializer Update

`scripts/materialize-full-app-generated-final.mjs` now loads the Data List Form Layouts v1.1 template artifacts when generating custom Data List forms. It chooses the New/Edit template for New/Edit-like forms and the View Item template for View/Detail-like forms, preserves the template shell, injects current-record field controls into `section_content_area`, and writes generated template provenance markers.

## Safety

This training did not bump the plugin version, move `stable`, create tags/releases/plugin archives, sign packages, install/import packages, upgrade Yeeflow apps, seed live data, or call live Yeeflow write APIs.
