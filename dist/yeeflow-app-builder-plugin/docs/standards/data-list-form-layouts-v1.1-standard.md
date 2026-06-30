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
- `data_list_form_layout_workbench`

Source template files:

- `docs/reference/data-list-form-layout-new-edit.template.json`
- `docs/reference/data-list-form-layout-view-item.template.json`
- `docs/reference/data-list-form-layout-workbench.template.json`

Current-record field layout template:

- `data_list_form_fields_grid_v1_1` from `docs/reference/data-list-form-field-layout-templates.json`
- source file `docs/reference/data-list-form-fields-grid.template.json`

The templates were parsed from the user-provided `Data list page layouts.ydl` and `Data list page layouts (1).ydl` exports. The source Data List is `Data list page layouts`, with `New and Edit form` assigned to New Item/Edit Item, `View item` available for standard View Item pages, and `Workbench item details` available for full-page Workbench View Item pages.

## Template Selection

Every generated business Data List and Document Library must use custom Data List forms for all three item entry points:

- New Item
- Edit Item
- View Item

Do not use the Yeeflow built-in `default` layout for any generated business Data List New/Edit/View entry point. `ListModel.LayoutView.add`, `ListModel.LayoutView.edit`, and `ListModel.LayoutView.view` must each point to a Type `1` custom form layout owned by the same list.

Use `data_list_form_layout_new_edit_v1_1` for every custom Data List form used as New Item or Edit Item. If a list uses separate New and Edit custom forms, both forms must use this template as their page layout source.

Use `data_list_form_layout_view_item_v1_1` for standard View Item custom forms. Use `data_list_form_layout_workbench` for View Item custom forms that need a full-page workbench with a primary working area, optional right-side panel, chart card sections, richer related datasets, KPI cards, and explicit record actions. Workbench View Item forms must be assigned to `ListModel.LayoutView.view` and opened as Full page; they must never be used for New Item or Edit Item.

System/support lists may skip custom forms only when the App Plan explicitly declares a system/support-list form-layout exemption with the reason, runtime impact, and proof boundary. Silent omission, empty `LayoutView`, missing `add`/`edit`/`view`, or literal `default` is not generation-ready.

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
- Workbench full-page item-detail shell
- optional right-side Workbench panel
- Workbench chart cards section

Each content card must preserve:

- `content_card_wrapper`
- `section_content_area`

`section_title_area` and `section_title_header` are optional business modules in generated forms. Keep `section_title_header` only when the section needs a distinct title/description that is not already supplied by the current-record field group, Collection, Data table, chart, or related component. If `section_title_header` is omitted and the sibling `Operations` region is also omitted or has no configured actions, remove `section_title_area` as well. Do not keep copied template headers solely to preserve the source example layout.

The 60/40 section may use the exported 60 and 40 wrapper containers. The percentage values may be changed only when the App Plan's business content requires a different split, and the generated layout must still copy the template section structure.

## Controlled Business Slots

Business-specific content may be added or changed only inside these containers:

- `page_title_content`
- `Operations`
- `section_content_area`
- `section_title_header`
- `kpi_card_wrapper`
- `primary_working_area`
- `right_side_panel`
- `chart_cards_section`

Within `page_title_content`, the text of `page_title_text` and `page_title_description` may change to match the current Data List form purpose.

Within `section_title_header`, the text of `section_title_text` and `section_title_description` may change to describe the content inside the associated `content_card_wrapper`.

Within `Operations`, generated controls must be real configured action controls. Placeholder or visual-only buttons are forbidden. If no real action is needed for a page title or content section, remove the `Operations` container from that generated form region instead of leaving template buttons behind.

Within `section_content_area`, generated resources may insert current-record field controls, Dynamic user/image/file/field controls, related record display components, approved Collection templates, approved Data Analytics templates, or other plugin-supported controls appropriate to the form type. For Data List Form Layouts v1.1, these business-content `section_content_area` regions must belong to an approved content card wrapper: `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`.

On View Item forms, Data Analytics golden reference templates from `docs/reference/data-analytics-golden-references.json` may be placed in `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`. The generator must clone the full approved template subtree, preserve locked style/layout/typography properties, and map only the approved title/data-binding editable regions. New/Edit forms must not use Data Analytics templates.

On `data_list_form_layout_workbench`, Data Analytics golden reference templates should be placed inside `chart_cards_section` under `primary_working_area` or `right_side_panel`. A single `chart_cards_section` should contain no more than three Data Analytics templates. If more analytics modules are needed, copy another `chart_cards_section` from the Workbench template. If no Data Analytics or business content is planned for a `chart_cards_section`, remove that section. If the entire `right_side_panel` has no real business content, remove `right_side_panel`.

Current-record Data List fields must be placed inside the approved `data_list_form_fields_grid_v1_1` field-layout template. Do not place field controls directly in `section_content_area`. If the form has many fields, create multiple approved content-card sections and put one `form_grid_fields_wrapper` inside each section's `section_content_area`. The approved host wrappers are `content_card_wrapper`, `content_card_60_wrapper`, and `content_card_40_wrapper`. Field controls inside the wrapper must receive business-specific `nv_label`/`nav_label` values. Sub list fields must use the control-level `data_list_form_control_sublist_v1_1` template and preserve its locked style/table/header/card settings.

If a generated custom Data List form contains two or more page-level Data Filter controls, those filters must be grouped inside `dashboard_standard_filter_group` from `docs/reference/data-filter-standard-filter-group.template.json`. Place the group inside an approved `section_content_area` hosted by `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`.

Within `kpi_card_wrapper`, generated View Item forms may map KPI card text, icons, bindings, and Summary-backed values. New/Edit forms must not use KPI cards.

View Item KPI cards are optional. Generate `kpi_metrics_wrapper` only when the Functional Specification or App Plan explicitly requires record-detail KPI metrics and the generated form includes runtime-bound Summary/KPI values for the current business domain. Supporting lists such as attachments, comments, audit rows, or other lightweight child records must not inherit Dashboard KPI rows by default.

## Repeatable And Removable Modules

Generated forms must remove unused modules. New modules may only be created by copying one of these approved repeatable/removable modules from the selected template:

- `1_columns_section`
- `content_card_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `kpi_metrics_wrapper`
- `kpi_card_wrapper`
- `kpi_cards_kpi_row`
- `1_row_section`
- `2_rows_section`
- `3_rows_section`
- `chart_cards_section`
- `right_side_panel`

Copied modules must preserve the template's structure, hierarchy, control types, width, padding, direction, gap, background, typography, and required children. Do not invent new form layout modules.

Every `section_content_area` copied from a Data List Form Layouts golden reference must preserve `attrs.style.gap = [null, "--sp--s200"]`. The legacy `--sp--s0` gap is not valid for generated custom Data List forms or updated template sources.

Generated forms must not keep title-only copied sections. A `content_card_wrapper`, `content_card_60_wrapper`, `content_card_40_wrapper`, `1_columns_section`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section` is allowed in the final form only when it contains real business content in an approved slot. Empty `section_content_area` containers, copied placeholder section titles such as `Active Loan Pipeline`, and sections that do not contain current-record fields, approved related components, configured actions, or other real business controls must be pruned before generated-final validation.

If a `section_content_area` would have no generated business content, remove the entire copied section/card that owns it. Do not keep an empty `section_content_area` as a spacer or as a future placeholder.

Each generated custom Data List form is a single dependency scope. When cloning approved component templates into New/Edit, View Item, or Workbench Item Details forms, rename template-owned `filterVars`, `tempVars`, `actions`, and `formAction` entries with a form/section namespace before merging them into the form resource, and rewrite every in-template `__filter_...`, `__temp_...`, and action reference. Do not allow two Search/Data Filter controls in one custom form to produce the same filter variable unless they are intentionally the same control instance.

Generated forms must not retain source-template business copy from another domain. For example, a Service Tickets or Ticket Attachments form must not contain loan/Office Asset text such as `Active Loan Pipeline`, `current loan volume`, `return activity signal`, `Office Asset records`, or `Coordinator guidance: prioritize overdue items and returns...`. Map such text to the current domain only when the section has real planned business content; otherwise remove the copied module.

For New/Edit forms, the common case is a single current-record field section. Do not keep the remaining template example sections unless the App Plan explicitly requires additional current-record field groups and those sections are fully materialized with real fields or configured actions.

For View Item forms, keep only the page title, required view structure, and the sections that are backed by current-record details, related datasets, Data Analytics, KPI cards, filters, or configured actions. Do not keep copied Dashboard or loan/event placeholder section text when no corresponding business content was generated.

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

Standard View Item forms must use `data_list_form_layout_view_item_v1_1`.

They must include:

- `page_title_section`
- `page_title_content`
- `page_title_text`
- `page_title_description`
- at least one content section with `section_content_area`

They may contain:

- current item display fields
- related business data
- approved Dashboard Collection templates
- approved Data Analytics templates in `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`
- Summary-backed KPI cards when explicitly planned and runtime-bound
- configured action buttons

Dashboard Page Layouts v1.1 and Dashboard component golden references remain component sources only. Do not copy a Dashboard page root shell into a Data List form as a competing root shell.

## Workbench View Item Form Rules

Workbench View Item forms must use `data_list_form_layout_workbench`.

They must include:

- `page_title_header`
- `page_title_content`
- `page_title_text`
- `page_title_description`
- `main_work_queue_section`
- `main_work_queue_wrapper`
- `primary_working_area`

They may contain:

- current item display fields
- related business data
- approved Dashboard Collection templates
- approved Data Analytics templates inside `chart_cards_section`
- Summary-backed KPI cards
- filters grouped in approved filter regions
- configured record action controls such as edit/delete buttons

They must preserve `attrs.hideop = true` so the generated full-page item details view hides default operation buttons. Any visible operation controls must be generated explicitly and must carry real Yeeflow actions. `ListModel.LayoutView.view` must point to the Workbench Type `1` layout, and `ListModel.LayoutView.opentype.view` must open it as Full page.

Workbench `right_side_panel` is optional. Keep it only when it contains real business content. Workbench `chart_cards_section` is optional. Keep it only when it contains Data Analytics templates or other planned business content, and prefer creating another `chart_cards_section` when more than three analytics modules are required.

## App Plan Requirements

The App Plan Custom Data List Forms Plan must select the correct Data List Form Layout template for each Data List or Document Library from Section 4, unless the list is explicitly documented as a system/support-list exemption.

Add a Data List Form Layout Template Selection table under each relevant custom form plan:

| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <List> | <Form> | New/Edit/View | <approved template id> | <Sections> | <None or related datasets> | <Reason> | <Proof> |

Rules:

- Every business Data List or Document Library planned in Section 4 must have New/Edit and View custom form rows in Section 10.
- Select exactly one approved template per custom Data List form.
- New/Edit forms must select `data_list_form_layout_new_edit_v1_1`.
- Standard View forms must select `data_list_form_layout_view_item_v1_1`.
- Full-page Workbench View forms must select `data_list_form_layout_workbench` and declare Open in: Full page.
- Default New/Edit/View layouts are forbidden for generated business lists.
- System/support-list exemptions must be explicit and must include a reason, user impact, fallback, and proof boundary.
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

The package gate must fail when a generated business list:

- has no parseable `LayoutView` display settings
- omits `add`, `edit`, or `view`
- assigns any of those usages to literal `default`
- points any usage to a missing layout or a non-Type `1` layout
- assigns New/Edit to a form that does not carry `data_list_form_layout_new_edit_v1_1`
- assigns View to a form that does not carry `data_list_form_layout_view_item_v1_1` or `data_list_form_layout_workbench`
- assigns `data_list_form_layout_workbench` to New/Edit or to a View form that is not configured to open as Full page
- keeps an empty `section_content_area` inside a visible content card wrapper
- keeps a copied section module that has only template title/description text and no real business content
- retains unrelated source-template labels in generated form sections instead of mapping them to the current Data List purpose
