# Approval Form Layouts v1.1 Standard

## Purpose

Approval Form Layouts v1.1 is the page-level golden reference standard for generated Yeeflow Approval form submission pages and workflow task pages. It aligns Approval forms, Data list workflow task forms, and Schedule workflow task forms with Dashboard Page Layouts v1.1 and Data List Form Layouts v1.1 while preserving workflow-specific runtime controls.

Generation must copy one of the approved export-shaped Approval form templates first, then remove, duplicate, or adapt only the allowed business regions according to the App Plan. Generated packages must remove unused copied modules; the source template may contain optional examples, but generated Approval forms must not keep unused visual sections.

## Registry

The canonical registry is:

`docs/reference/approval-form-layout-templates.json`

Approved template ids:

- `approval_form_layout_submission_v1_1`
- `approval_form_layout_task_v1_1`

Source template files:

- `docs/reference/approval-form-layout-submission.template.json`
- `docs/reference/approval-form-layout-task.template.json`

The templates were parsed from the user-provided `Approval form page layout.ywf` export. The source Approval form is `Approval form page layout`, with one submission page and one task page.

## Template Selection

Use `approval_form_layout_submission_v1_1` for the single submission form page in every generated Approval form.

Use `approval_form_layout_task_v1_1` for every generated workflow task form page. This includes:

- Approval form task pages
- Data list workflow task forms
- Schedule workflow task forms

An Approval form may have zero or multiple task forms, but every generated task form must use this template. Data list workflows and Schedule workflows may also contain zero or multiple task forms; every generated task form in those workflow families must use this same task template. When there is no special business need for assignee-editable fields, task-form field controls should be readonly and should present submitted or workflow context for review.

## Required Page Shell

Both generated Approval form page templates must preserve:

- parseable Yeeflow Approval form `pageurls[].formdef` JSON
- root `attrs.container.cw = "2"`
- root token-array zero padding
- root background `#f4f7fb`
- root custom CSS that hides the native form title with `.form-name { display: none !important; }`
- `main > content`
- `main` as a centered column layout
- `content` as a column layout with custom width `1280`
- the exported `content` padding/background/spacing from the selected template
- the exported `page_title_section`
- the exported `action_panel_flow_history_wrapper`

The root form padding is zero. Inner form sections keep the exported template padding and layout.

## Standard Sections

Supported section patterns:

- page title section
- 1-column content section
- 2-column section
- 3-column section
- 60/40 2-column section
- action panel and workflow history section

Each content card must preserve:

- `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`
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

Within `page_title_content`, the text of `page_title_text` and `page_title_description` may change to match the current Approval form purpose.

Within `section_title_header`, the text of `section_title_text` and `section_title_description` may change to describe the content inside the associated content card.

Within `Operations`, generated controls must be real configured action controls. Placeholder or visual-only buttons are forbidden in generated packages. If a page title section or content card has no real page-level or section-level action, remove that `Operations` container from the generated form.

Within `section_content_area`, generated resources may insert Approval form field controls, the approved Data List Form field-grid template, approved Collection templates, Text/Heading controls, or other plugin-supported controls appropriate to Approval forms.

Approval form field controls must use the Approval Form Field Layouts v1.1 templates from `docs/reference/approval-form-field-layout-templates.json`. Select `approval_form_fields_grid_2col_v1_1` or `approval_form_fields_grid_3col_v1_1`, then place the cloned `form_grid_fields_2col_wrapper` or `form_grid_fields_3col_wrapper` only inside `content_card_wrapper > section_content_area`.

Approval form field planning is a generation contract, not descriptive prose. When the App Plan includes `Submission Form Fields` or `Task Form Fields`, generated `Forms[].DefResource.pageurls[].formdef` must materialize those planned business fields inside the approved Approval Form Field Layout wrapper. A generated Approval form that only replaces page titles, preserves the layout shell, or leaves source-template domain labels without injecting planned field controls is incomplete and must fail before signing readiness.

Generated Approval form field controls must carry business-specific labels, field names/bindings, and `nv_label` or `nav_label` values derived from the App Plan. Task form fields should be readonly unless the App Plan explicitly states that assignees must edit them. Field controls must use zero margin, full-row spans for Multiple line, Rich text, and Sub List fields, and appropriate control families for the planned field type.

Approval forms must not use Data Analytics controls, Data Analytics golden reference templates, chart templates, pivot table templates, Summary/KPI analytics, or `kpi_metrics_wrapper`.

If an Approval submission page, Approval task page, Data list workflow task form, or Schedule workflow task form contains two or more page-level Data Filter controls, those filters must be grouped inside `dashboard_standard_filter_group` from `docs/reference/data-filter-standard-filter-group.template.json`. The group must be placed inside an approved `section_content_area` and must preserve the standard filter-group wrapper and child filter visual contract.

## Locked Action And History Region

`action_panel_flow_history_wrapper` is locked.

It must preserve:

- the exported wrapper container structure and styling
- one Action panel control
- one workflow history control
- the exported section-content host structure

Generated Approval forms must not remove, restyle, or replace this region. Business content belongs in the allowed business slots, not inside this locked wrapper except for the existing Action panel and workflow history controls.

## Repeatable And Removable Modules

Generated Approval form pages must remove unused modules. New modules may only be created by copying one of these approved repeatable/removable modules from the selected template:

- `1_columns_section`
- `content_card_wrapper`
- `2_columns_section`
- `3_columns_section`
- `2_columns_60/40_section`
- `content_card_60_wrapper`
- `content_card_40_wrapper`

Copied modules must preserve the template's structure, hierarchy, control types, width, padding, direction, gap, background, typography, and required children. Do not invent new Approval form layout modules.

Generated forms must not keep empty copied business sections. A copied `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper` is valid only when its `section_content_area` contains real business content such as an approved Approval Form Field Layout wrapper, a configured Collection template, a data filter group, Dynamic controls, or an action button with real Yeeflow action configuration. A copied `1_columns_section`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section` that does not contain real business content must be removed. The locked `action_panel_flow_history_wrapper` is the exception and must remain intact.

## App Plan Requirements

When the app includes Approval forms, the App Plan Approval Forms Plan must select the correct Approval Form Layout template for every generated submission and task page.

Add an Approval Form Layout Template Selection table under the Approval Forms Plan:

| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Approval Form> | <Submission or Task page> | Submission/Task | <approved template id> | <Sections> | <None or related datasets> | <Reason> | <Proof> |

Rules:

- Select exactly one approved template per Approval form page.
- Submission pages must select `approval_form_layout_submission_v1_1`.
- Task pages must select `approval_form_layout_task_v1_1`.
- Do not include generated `ListID`, `FormID`, `ProcModelID`, `FlowKey`, `DefResourceID`, runtime IDs, JSON property paths, or copied control payloads in the App Plan.
- If a task page needs assignee-editable fields, the App Plan must state that business reason; otherwise task fields should be generated readonly.
- Approval form pages may use approved Collection templates and current-record field layout templates in allowed slots, but must not select Data Analytics templates.

The Approval Forms Plan must also include an Approval Form Fields Layout Template Selection table for each generated field group that displays submission or task fields:

| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Approval Form> | <Submission or Task page> | <Field group> | approval_form_fields_grid_2col_v1_1 or approval_form_fields_grid_3col_v1_1 | Submission fields or task fields | 2 or 3 | <= PC/laptop | 1 | <Multiple line/Rich text/Sub List fields> | <None or grouping rule> | Generated-final validation |

When a Data list workflow or Schedule workflow includes a task form, that workflow plan section must include a Workflow Task Form Layout Template Selection table and select `approval_form_layout_task_v1_1` for each generated workflow task form.

Add this table under the Data List Workflows Plan or Schedule Workflows Plan when workflow task forms are planned:

| Workflow | Host Resource | Task Form | Workflow Surface | Selected Workflow Task Form Layout Template | Business Sections Needed | Editable Task Inputs | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Workflow> | <List/Library/Schedule> | <Task form> | Data list workflow task / Schedule workflow task | approval_form_layout_task_v1_1 | <Sections> | <None or fields> | <Reason> | Generated-final validation |

Rules:

- Data list workflow task forms must select `approval_form_layout_task_v1_1`.
- Schedule workflow task forms must select `approval_form_layout_task_v1_1`.
- Do not create a separate or simplified task-page template for Data list workflows or Schedule workflows.
- The same locked `action_panel_flow_history_wrapper`, hidden form title CSS, page background, content width, section structure, allowed slots, readonly-default field guidance, and Data Analytics prohibition apply to workflow task forms outside Approval forms.
- Do not include generated `ListID`, `FormID`, workflow IDs, task URLs, runtime IDs, JSON property paths, or copied control payloads in the App Plan.

## Required Gates

Run:

```bash
node scripts/validate-approval-form-layout-template.mjs --registry docs/reference/approval-form-layout-templates.json
```

Generated-final `.yapk` packages must also pass:

```bash
node scripts/validate-approval-form-layout-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
node scripts/validate-approval-form-fields-template.mjs --package <app.yapk> --plan <yeeflow-app-plan.md>
```

First-generation preflight invokes these gates before signing readiness. Signing, install/import, upgrade, Version Management, and runtime proof must remain blocked when generated Approval form pages violate this standard or when planned Approval form fields are missing from the decoded `DefResource.pageurls[].formdef`.
