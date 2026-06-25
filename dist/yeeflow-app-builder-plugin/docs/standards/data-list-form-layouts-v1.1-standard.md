# Data List Form Layouts v1.1 Standard

## Purpose

Data List Form Layouts v1.1 is the page-level golden reference standard for generated Yeeflow custom Data List forms. It gives New/Edit and View item forms the same visual system as Dashboard Page Layouts v1.1 while keeping form responsibilities separate.

Generation must copy one of the approved export-shaped custom form templates first, then remove, duplicate, or adapt only the allowed business regions according to the App Plan.

## Registry

The canonical registry is:

`docs/reference/data-list-form-layout-templates.json`

Approved template ids:

- `data_list_form_layout_new_edit_v1_1`
- `data_list_form_layout_view_item_v1_1`

Source template files:

- `docs/reference/data-list-form-layout-new-edit.template.json`
- `docs/reference/data-list-form-layout-view-item.template.json`

Current-record field layout template:

- `data_list_form_fields_grid_v1_1` from `docs/reference/data-list-form-field-layout-templates.json`
- source file `docs/reference/data-list-form-fields-grid.template.json`

The templates were parsed from the user-provided `Data list page layouts.ydl` export. The source Data List is `Data list page layouts`, with `New and Edit form` assigned to New Item/Edit Item and `View item` assigned to View Item.

## Template Selection

Use `data_list_form_layout_new_edit_v1_1` for every custom Data List form used as New Item or Edit Item. If a list uses separate New and Edit custom forms, both forms must use this template as their page layout source.

Use `data_list_form_layout_view_item_v1_1` for every custom Data List form used as View Item.

New/Edit forms focus on editing the current list item. They must not include related business-data regions, Collection templates, charts, pivot tables, or KPI analytics.

View Item forms may show current-record details plus related business data. They may use Dashboard-validated Collection templates, Data Analytics templates, KPI cards, filters, and related datasets, but only inside the approved business-content slots.

## Required Page Shell

Both generated custom Data List form templates must preserve:

- parseable Yeeflow custom Data List form resource JSON
- root `attrs.container.cw = "2"`
- root token-array zero padding
- root background `#f4f7fb`
- `main > content`
- `main` as a full-width column layout
- `content` as a full-width column layout
- the exported `content` padding/background/spacing from the selected template
- non-empty selected business section containers

Do not normalize the inner `content` container to a different spacing model. The root form padding is zero; inner form sections keep the exported template padding and layout.

## Standard Sections

Supported section patterns:

- 1-column content section
- 2-column section
- 3-column section
- 60/40 2-column section
- KPI metrics wrapper on View Item forms
- page title section on View Item forms

Each content card must preserve:

- `content_card_wrapper`
- `section_title_area`
- `section_title_header`
- `section_content_area`

The 60/40 section may use the exported 60 and 40 wrapper containers. The percentage values may be changed only when the App Plan's business content requires a different split, and the generated layout must still copy the template section structure.

## Controlled Business Slots

Business-specific content may be added or changed only inside these containers:

- `page_title_content`
- `Operations`
- `section_content_area`
- `section_title_header`
- `kpi_card_wrapper`

Within `page_title_content`, the text of `page_title_text` and `page_title_description` may change to match the current Data List form purpose.

Within `section_title_header`, the text of `section_title_text` and `section_title_description` may change to describe the content inside the associated `content_card_wrapper`.

Within `Operations`, generated controls must be real configured action controls. Placeholder or visual-only buttons are forbidden.

Within `section_content_area`, generated resources may insert current-record field controls, Dynamic user/image/file/field controls, related record display components, approved Collection templates, approved Data Analytics templates, or other plugin-supported controls appropriate to the form type.

Current-record Data List fields must be placed inside the approved `data_list_form_fields_grid_v1_1` field-layout template. Do not place field controls directly in `section_content_area`. If the form has many fields, create multiple `content_card_wrapper` sections and put one `form_grid_fields_wrapper` inside each section's `section_content_area`.

Within `kpi_card_wrapper`, generated View Item forms may map KPI card text, icons, bindings, and Summary-backed values. New/Edit forms must not use KPI cards.

## Repeatable And Removable Modules

Generated forms may remove unused modules. New modules may only be created by copying one of these approved repeatable/removable modules from the selected template:

- `1_columns_section`
- `content_card_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `kpi_metrics_wrapper`
- `kpi_card_wrapper`

Copied modules must preserve the template's structure, hierarchy, control types, width, padding, direction, gap, background, typography, and required children. Do not invent new form layout modules.

## New/Edit Form Rules

New/Edit forms must use `data_list_form_layout_new_edit_v1_1`.

They may contain:

- current-item fields
- Dynamic field controls for ordinary fields
- Dynamic user controls for user/person fields
- Dynamic image controls for image fields
- Dynamic file controls for file/attachment fields
- configured form action buttons when needed

They must not contain:

- `page_title_section`
- `kpi_metrics_wrapper`
- Collection templates
- Data Analytics templates
- related-record grids/lists
- Dashboard page shells
- Approval form controls

## View Item Form Rules

View Item forms must use `data_list_form_layout_view_item_v1_1`.

They must include:

- `page_title_section`
- `page_title_content`
- `page_title_text`
- `page_title_description`
- `kpi_metrics_wrapper`
- at least one content section with `section_content_area`

They may contain:

- current item display fields
- related business data
- approved Dashboard Collection templates
- approved Data Analytics templates
- Summary-backed KPI cards
- configured action buttons

Dashboard Page Layouts v1.1 and Dashboard component golden references remain component sources only. Do not copy a Dashboard page root shell into a Data List form as a competing root shell.

## App Plan Requirements

The App Plan Custom Data List Forms Plan must select the correct Data List Form Layout template for each planned custom form.

Add a Data List Form Layout Template Selection table under each relevant custom form plan:

| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <List> | <Form> | New/Edit/View | <approved template id> | <Sections> | <None or related datasets> | <Reason> | <Proof> |

Rules:

- Select exactly one approved template per custom Data List form.
- New/Edit forms must select `data_list_form_layout_new_edit_v1_1`.
- View forms must select `data_list_form_layout_view_item_v1_1`.
- Do not include generated `ListID`, `LayoutID`, runtime IDs, JSON property paths, or copied control payloads in the App Plan.
- Data Analytics and Collection template choices for View Item related regions must still use their own approved template selection tables when those components are planned.
- Current-record field groups must also select `data_list_form_fields_grid_v1_1` in a Form Fields Layout Template Selection table.

## Required Gates

Run:

```bash
node scripts/validate-data-list-form-layout-template.mjs --registry docs/reference/data-list-form-layout-templates.json
node scripts/validate-data-list-form-fields-template.mjs --registry docs/reference/data-list-form-field-layout-templates.json
```

Generated-final `.yapk` packages must also pass:

```bash
node scripts/validate-data-list-form-layout-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
node scripts/validate-data-list-form-fields-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
```

First-generation preflight invokes this gate before signing readiness. Signing, install/import, upgrade, Version Management, and runtime proof must remain blocked when generated custom Data List forms violate this standard.
