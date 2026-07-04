# <Application Name> - Yeeflow App Plan

Use this template as Stage 2 / Step 2 for every Yeeflow application build. This plan must be created from the approved Functional Specification, which is the business source of truth for process, rules, data, roles, dashboard content, reporting, and audit needs. Its purpose is to convert business requirements into Yeeflow-standard resources and define the correct generation order.

Canonical schema rule: this Markdown document is the single primary App Plan contract and must use the title shape `# <Application Name> - Yeeflow App Plan`. Validators, generation contracts, traceability checks, and lifecycle docs must treat `yeeflow-app-plan.md` in this resource-order format as canonical. Do not require a conflicting `Yeeflow Application Plan` schema as the primary App Plan artifact; any compatibility entrypoint must validate this same Markdown contract.

This document is the implementation contract for package generation after user approval. It must use only Yeeflow resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes supported by the active `@yeeflow-app-builder` plugin knowledge base, skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references.

Primary artifact rule: generate this plan as the primary human-readable Markdown file named `yeeflow-app-plan.md`. Machine-readable JSON may exist only as a companion/projection artifact for validation, traceability, or tests, such as `app-plan.trace.json`; JSON must not replace this Markdown document. The Markdown file must contain the Yeeflow resource plan and detailed Dashboard Pages Plan with legal Yeeflow control-type planning, not just a link to JSON.

## 1. Plan Status

- Application name:
- Functional specification path:
- Functional specification status:
- Planning plugin:
- Plugin version:
- Source artifacts:
- Current phase:
- Package target: `.yapk` by default / `.yap` only if explicitly requested
- Generation status:
- Approval status:
- Known blockers:

## 2. Requirement-to-Yeeflow Resource Mapping Summary

Map each major requirement from the Functional Specification to Yeeflow resources.

| Requirement Area | Business Requirement | Yeeflow Resource Type | Planned Resource Name | Required | Notes |
| --- | --- | --- | --- | --- | --- |
| Data management | <Requirement> | Data list or Document library | <Name> | Yes/No | Select one exact Yeeflow resource type |
| Approval/review | <Requirement> | Approval form | <Name> | Yes/No | <Notes> |
| Approval output | <Requirement> | Form report | <Name> | Yes/No | Must be based on a specific Approval form |
| List browsing | <Requirement> | Data List view | <Name> | Yes/No | Must belong to a specific Data list or Document library |
| Dashboard/workbench | <Requirement> | Dashboard page | <Name> | Yes/No | Page-level UI resource, not a Form report |
| Automation | <Requirement> | Data-list workflow / Schedule workflow / Form action | <Name> | Yes/No | <Notes> |
| AI | <Requirement> | AI Agent / Copilot / AI Assistant node | <Name> | Yes/No | <Notes> |

Rules:

- Every core business requirement must map to a Yeeflow resource, a supported configuration, or an explicitly deferred item.
- App Plan dashboard planning must trace back to the Functional Specification's business-level dashboard questions, source business objects/data lists, summary metrics, source fields, calculation logic, data regions, display fields, filters, sorting/grouping, user actions, mobile support, and alerts.
- Functional Specification to App Plan traceability is executable with `scripts/validate-functional-spec-to-app-plan-traceability.mjs --spec <functional-spec.md> --plan <app-plan.md>`.
- Form report is a standalone Yeeflow resource type created from a specific Approval form. Do not merge Form report planning with Dashboard page planning or Data List view planning.
- Do not include resources only to make the plan look complete. Every generated resource must serve a runtime purpose.
- Do not invent unsupported controls, Dynamic controls, field types, workflow node types, variable types, action shapes, property paths, bindings, or configuration shapes.
- Validator wording tolerance: the App Plan should follow this canonical template, but validators must also accept equivalent business wording for the same required intent, such as `Submission fields`, `Task page fields`, `Form reports are independent approval-based resources`, `Form reports are separate from Dashboard/page planning`, `Unsupported shapes should not be generated`, and `No Sub List actions are needed`. Equivalent wording does not relax resource-order, schema, or generation-readiness requirements.

## 3. Resource Generation Order

Define the exact order in which resources must be generated.

| Order | Resource Type | Resource Name | Depends On | Reason for Order | Blocking If Missing |
| --- | --- | --- | --- | --- | --- |
| 1 | Data list | <Parent/master list> | None | Lookup parent must exist first | Yes/No |
| 2 | Data list | <Child/transaction list> | <Parent list> | Needs lookup to parent | Yes/No |
| 3 | Approval form | <Form> | <Lists/fields> | Needs lookup/sublist/field bindings | Yes/No |

Standard order:

1. Data lists and Document libraries.
2. Approval forms and approval workflows.
3. Form reports based on their related Approval forms.
4. Schedule workflows.
5. AI Agents.
6. Copilots.
7. Custom Data List forms.
8. Data List workflows.
9. Notifications.
10. Data List views.
11. Dashboard pages.
12. Application navigation.
13. Target users, roles, groups, and permissions.

Rules:

- Parent/master data lists must be generated before child/transaction lists that depend on them.
- Lookup target lists and display fields must exist before dependent Lookup fields are generated.
- Approval forms that use list lookups, sublists, summaries, Query data, or Set data list actions must depend on those lists.
- Dashboards must depend on the lists, views, forms, actions, and variables they display or trigger.

## 4. Data Lists and Document Libraries Plan

Repeat this subsection for each Data list or Document library.

### 4.x <List or Library Name>

- Selected Yeeflow resource type: Data list or Document library
- Package/navigation representation: Type `1` Data list / documented Document library representation / `export-learning-required`
- Description:
- Business purpose:
- Master/transaction/reference:
- Creation order:
- Depends on:
- Used by:
- Navigation visibility:
- Sample/reference data required: Yes/No

#### Fields

| Field Order | Business Label | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Support Source | Proof Label | Fallback / Deferred Reason | Required | Unique | Default Value | Placeholder | Validation Rules | Choice Values | Lookup Target | Lookup Display Field | Additional Lookup Fields | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Contract title | Title | Title | Title | input control | plugin-known field/control type | validator-backed | N/A | Yes | No | | <Placeholder text> | | | | | | Native title field |

Field rules:

- Field types must follow active plugin Data List / Document Library field standards.
- Distinguish business-friendly labels from exact Yeeflow implementation types. `Business Label` may say `Owner/person`, but `Exact Yeeflow Field Type` must say the exact plugin-supported type such as `User`.
- Do not use slash-combined final implementation types such as `Title/Text`, `Currency/Number`, `User/person`, `Attachment/File upload`, `Document library / Data list`, or `Type 1/document library` unless the row is marked `export-learning-required`, `runtime-proof-required`, or `deferred` with a fallback/deferred reason.
- Document Library planning must select one clear Yeeflow resource type. If the package/navigation representation is not known, mark it `export-learning-required` or `runtime-proof-required` and do not treat the resource as generation-ready.
- Keep the native `Title` field unless the plugin standard explicitly allows otherwise.
- Choice fields must define runtime-visible choices using the supported schema.
- Lookup fields must identify target list, display field, and additional fields when needed.
- User/person fields must use supported User field shapes.
- Date fields must use supported Date/DateTime types.
- Currency/number fields must use supported numeric field types.
- Multiline notes, descriptions, and justifications must use supported multiline text fields.
- Barcode, serial number, asset tag, and external code values should use text unless a supported barcode-specific field is required.
- Placeholder text must be defined for user-entered fields when the exact selected field/control type supports placeholders. If placeholder support is unknown, mark the row `runtime-proof-required`, `export-learning-required`, or `deferred` with reason, fallback, and proof/generation impact.

#### List Relationships

| Related List | Relationship | Field | Required | Notes |
| --- | --- | --- | --- | --- |
| <List> | parent/child/reference | <Lookup field> | Yes/No | <Notes> |

#### Sample or Reference Rows

| Row Purpose | Key Values | Depends On | Required for Validation | Notes |
| --- | --- | --- | --- | --- |
| <Purpose> | <Values> | <Lookup rows> | Yes/No | <Notes> |

## 5. Approval Forms Plan

Repeat this subsection for each Approval form.

### 5.x <Approval Form Name>

- Approval form name:
- Description:
- Business purpose:
- Submitter role:
- Approval status lifecycle:
- Depends on Data lists / Document libraries:
- Form reports required: Yes/No
- Assignment task required: Yes/No
- Generation blocker if missing: Yes/No

#### Submission Form Fields

| Field Order | Business Label | Field Name | Field ID / Variable ID | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Support Source | Proof Label | Fallback / Deferred Reason | Binding | Read Only | Required | Default Value | Placeholder | Dynamic Display | Custom Validation | Lookup Target | Lookup Display Field | Additional Lookup Fields | Sublist/Summary Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Business label> | <Field> | <ID> | <Exact variable type> | <Exact control type> | <Plugin skill/doc/export reference> | validator-backed/runtime-proof-required/export-learning-required/deferred | <Reason or N/A> | <Binding> | Yes/No | Yes/No | <Default> | <Placeholder text> | <Rule> | <Rule> | <List> | <Field> | <Fields> | <Notes> | <Description> |

Submission form rules:

- Variable and control types must follow active plugin Approval Form standards.
- Distinguish business labels from exact Yeeflow implementation types. Slash-combined or vague implementation wording is not generation-ready unless marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- Lookup fields must identify target list, display field, and additional fields.
- Sublist fields must define row fields, summary fields, and any summary-to-form-field bindings.
- Default values, dynamic display rules, read-only state, and validations must be explicit.
- Placeholder text must be planned for editable fields when the exact selected variable/control type supports placeholders. If support is unknown, mark the row `runtime-proof-required`, `export-learning-required`, or `deferred` with reason, fallback, and proof/generation impact.

#### Approval Workflow Nodes

| Step Order | Node Name | Node Type | Purpose | Assignee / Actor | Configuration | Branches | Branch Conditions | Data Read/Write | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Start | <Node type> | <Purpose> | <Actor> | <Config> | <Branches> | <Conditions> | <Data> | <Notes> |

Workflow rules:

- Node types must come from the active plugin workflow-node knowledge base.
- Branches must cover normal, exception, empty, and unexpected routing values where relevant.
- Assignment task nodes require Task form planning.
- Query data and Set data list actions must identify target application, list, filters, fields, and write behavior.

#### Assignment Task Forms

Required when the approval workflow contains Assignment task nodes.

| Task Form Name | Used By Workflow Node | Purpose | One Shared Form or Multiple Forms | Notes |
| --- | --- | --- | --- | --- |
| <Task form> | <Node> | <Purpose> | Shared/Specific | <Notes> |

##### Task Form Fields

| Field Order | Business Label | Field Name | Field ID / Variable ID | Exact Yeeflow Variable Type | Exact Yeeflow Control Type | Support Source | Proof Label | Fallback / Deferred Reason | Binding | Read Only | Required | Default Value | Placeholder | Dynamic Display | Custom Validation | Lookup Target | Lookup Display Field | Additional Lookup Fields | Sublist/Summary Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Business label> | <Field> | <ID> | <Exact variable type> | <Exact control type> | <Plugin skill/doc/export reference> | validator-backed/runtime-proof-required/export-learning-required/deferred | <Reason or N/A> | <Binding> | Yes/No | Yes/No | <Default> | <Placeholder text> | <Rule> | <Rule> | <List> | <Field> | <Fields> | <Notes> | <Description> |

#### Approval Form Layout Template Selection

| Approval Form | Form Page | Page Role | Selected Approval Form Layout Template | Business Sections Needed | Related Data Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Approval form> | <Submission form> | Submission | approval_form_layout_submission_v1_1 | <Sections> | <Related data or None> | <Reason> | Generated-final validation |
| <Approval form> | <Task form> | Task | approval_form_layout_task_v1_1 | <Sections> | <Related data or None> | <Reason> | Generated-final validation |

Approval form layout rules:

- Every Approval form has exactly one submission form page. It must select `approval_form_layout_submission_v1_1`.
- Every generated task form page must select `approval_form_layout_task_v1_1`.
- The selected template must come from `docs/reference/approval-form-layout-templates.json`.
- The App Plan may describe business sections and related data needs, but must not include generated `ListID`, `FormID`, `ProcModelID`, `FlowKey`, `DefResourceID`, runtime IDs, JSON property paths, or copied control payloads.
- Approval form pages must not select Data Analytics templates, chart templates, pivot table templates, Summary/KPI analytics, or `kpi_metrics_wrapper`.
- Task form field controls should be readonly unless this table or the Task Form Fields table states a business reason for assignee-editable fields.

#### Approval Form Fields Layout Template Selection

Required for every generated Approval form submission or task page that displays Approval form fields.

| Approval Form | Form Page | Field Group | Selected Approval Form Fields Layout Template | Field Source | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Approval form> | <Submission or task form> | <Field group> | approval_form_fields_grid_2col_v1_1 or approval_form_fields_grid_3col_v1_1 | Submission fields or task fields | 2 or 3 | <= PC/laptop | 1 | Multiple line / Rich text / Sub list fields | <None or grouping rule> | Generated-final validation |

Approval form field-layout rules:

- Select `approval_form_fields_grid_2col_v1_1` or `approval_form_fields_grid_3col_v1_1` from `docs/reference/approval-form-field-layout-templates.json` for every generated field group on an Approval form submission or task page.
- Field-grid template selection is required in addition to the page-level Approval Form Layout Template Selection table.
- When the form page uses Approval Form Layouts v1.1, place the selected field-grid wrapper only inside `content_card_wrapper > section_content_area`.
- Every generated Approval form field control inside the selected field-grid wrapper must explicitly set margin to zero and must use a business-specific `nv_label` or `nav_label`.
- Multiple line, Rich text, and Sub list controls must span the full parent Grid width on every responsive breakpoint.
- Tablet columns must not exceed PC/laptop columns; mobile columns must be one.
- App Plan selection is a business/layout decision only. It must not include generated `ListID`, `FormID`, `ProcModelID`, `FlowKey`, field runtime IDs, JSON property paths, placeholder IDs, copied control JSON, or runtime payload fields.

#### Form Actions and Temp Variables

| Action Name | Host Form | Trigger Location | Trigger Type | Temp Variables | Steps | Data Read | Data Write | Bound Controls | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Action> | Submission / Task / Other | Page Load / Field Change / Submission / Button | <Type> | <Variables> | <Steps> | <Data> | <Data> | <Controls> | <Notes> |

#### Sub List List Actions

Required whenever a Sub List control appears on a submission page or task page.

| Host Form | Sub List Field/Control | Action Name | Exact Yeeflow List Action Type | Support Source | Proof Label | Fallback / Deferred Reason | Current Row Context | Steps | Summary Fields Affected | Parent Field Binding | Runtime Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Form> | <Sub List> | No custom Sub List actions required / <Action> | add item / duplicate item / delete item / import items / move up/down / insert before/after / supported custom action | <Plugin skill/doc/export reference> | validator-backed/runtime-proof-required/export-learning-required/deferred | <Reason or N/A> | <Current row context> | <Steps> | <Summary fields> | <Binding> | Runtime action execution is separate proof |

Rules:

- State exactly which form hosts each form action.
- State where the action is triggered.
- Temp variables are frontend-only.
- Query data and Set data list actions must identify target application/list/fields.
- If a form includes a Sub List, explicitly state whether custom List actions are required.
- If custom Sub List actions are required, list each action and its steps.
- Supported list action types must come from plugin-known/export-proven Sub List action shapes, such as add item, duplicate item, delete item, import items, move up/down, insert before/after, or supported custom action patterns.
- `Exact Yeeflow List Action Type` must use a plugin-known/export-proven action type or be marked `export-learning-required`, `runtime-proof-required`, or `deferred`.
- Each Sub List action must state current row context.
- If Summary fields are used, identify which Summary fields are affected.
- If Summary is bound to parent form fields, state the binding.
- Runtime execution proof for Sub List actions is separate from package validation.
- If no custom List actions are required, explicitly write: `No custom Sub List actions required`.

## 6. Form Reports Plan

Normally, each Approval form should have a corresponding Form report.

| Form Report Name | Related Approval Form | Purpose | Includes Sublist | Fields Included | Extra Field Configuration | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Report> | <Approval form> | <Purpose> | Yes/No | <Fields> | <Config> | <Notes> |

Rules:

- If a report needs Sublist data, plan a report structure that supports Sublist display.
- If an Approval form does not need a Form report, state the reason.

## 7. Schedule Workflows Plan

| Schedule Workflow Name | Description | Schedule Configuration | Trigger Frequency | Nodes | Branches | Data Read/Write | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Workflow> | <Description> | <Supported config> | Daily/Weekly/Monthly/etc. | <Nodes> | <Branches> | <Data> | proven/export-proven/runtime-proof-required/deferred | <Notes> |

#### Workflow Task Form Layout Template Selection

Required when a Schedule workflow includes a generated task form page.

| Workflow | Host Resource | Task Form | Workflow Surface | Selected Workflow Task Form Layout Template | Business Sections Needed | Editable Task Inputs | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Schedule workflow> | <Schedule> | <Task form> | Schedule workflow task | approval_form_layout_task_v1_1 | <Sections> | <None or fields> | <Reason> | Generated-final validation |

Rules:

- Schedule configuration must use properties supported by the plugin's Schedule workflow documentation.
- Each node must include type, order, configuration, branch conditions, and data read/write behavior.
- If a Schedule workflow includes a task form, it must select `approval_form_layout_task_v1_1`. The generated task form must follow the same Approval Form Layouts v1.1 task template contract as Approval form task pages, including readonly-by-default fields unless assignee input is required.

## 8. AI Agents Plan

| AI Agent Name | Description | Purpose | Inputs | Outputs | Tools | Used By Forms/Workflows | Human Review | Proof Level |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Agent> | <Description> | <Purpose> | <Inputs> | <Outputs> | <Tools> | <Nodes/actions> | Required/Not required | <Proof> |

Rules:

- After identifying AI Agents, recheck Approval forms, Schedule workflows, Data List workflows, and Form actions for AI Assistant usage.
- Do not embed connection secrets.
- Runtime execution proof is separate from package generation.

## 9. Copilots Plan

| Copilot Name | Description | Purpose | Inputs | Outputs | Tools | App Resource Access | Human Review | Proof Level |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Copilot> | <Description> | <Purpose> | <Inputs> | <Outputs> | <Tools> | <Access> | Required/Not required | <Proof> |

## 10. Custom Data List Forms Plan

Return to the Data lists and Document libraries from Section 4 and plan their custom forms.

Every business Data List or Document Library from Section 4 must plan custom forms for New Item, Edit Item, and View Item. Do not plan Yeeflow's built-in default layout for generated business lists. If a generated list is a hidden system/support list and custom forms are intentionally not needed, add an explicit system/support-list form-layout exemption with reason, user impact, fallback, and proof boundary.

### 10.x <Data List or Document Library Name>

| Form Name | Form Type | Purpose | Used By | Layout Pattern | Actions Required | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Form> | New/Edit/View/Detail/Custom/Print | <Purpose> | <Users/pages> | <Layout> | Yes/No | <Notes> |

#### Data List Form Layout Template Selection

Required for every Section 4 Data List or Document Library. Each business list must have New/Edit and View custom form coverage.

| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <List> | <Form> | New/Edit/View | <approved template id> | <Sections> | <None or related datasets> | <Reason> | <Proof> |

Rules:

- The Selected Data List Form Layout Template must be one of `data_list_form_layout_new_edit_v1_1`, `data_list_form_layout_view_item_v1_1`, or `data_list_form_layout_workbench` from `docs/reference/data-list-form-layout-templates.json`.
- New Item and Edit Item custom forms must select `data_list_form_layout_new_edit_v1_1`. If New and Edit use separate forms, both must still select this template.
- Standard View Item custom forms must select `data_list_form_layout_view_item_v1_1`.
- Full-page Workbench View Item custom forms must select `data_list_form_layout_workbench` and explicitly state `Open in: Full page` in the row's business sections, selection reason, or proof boundary.
- Default New/Edit/View layouts are forbidden for generated business Data Lists and Document Libraries.
- System/support-list exemptions must be explicit; silent omission of custom forms is not generation-ready.
- New/Edit forms focus on the current list item and must not plan related Collection/Data Analytics/KPI regions.
- View Item forms may plan current-record display plus related business data, approved Collection templates, approved Data Analytics templates, and KPI regions inside the v1.1 allowed slots. Field-grid and Collection templates may use the `section_content_area` of `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper` depending on the required section width. Workbench View Item forms may use `primary_working_area`, optional `right_side_panel`, and `chart_cards_section`; empty Workbench right panels or chart sections must be pruned.
- App Plan selection is a business/layout decision only. It must not include generated `ListID`, `LayoutID`, action type codes, JSON property paths, placeholder IDs, copied control JSON, or runtime payload fields.

#### Form Fields

#### Form Fields Layout Template Selection

Required for every generated custom Data List New/Edit/View form that displays current-record fields.

| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <List> | <Form> | <Field group> | data_list_form_fields_grid_v1_1 | 2 or 3 | <= PC/laptop | 1 | Multiple line / Rich text / Sub list fields | <None or grouping rule> | Generated-final validation |

Rules:

- Select `data_list_form_fields_grid_v1_1` from `docs/reference/data-list-form-field-layout-templates.json` for every generated field group on a New/Edit/View custom Data List form.
- Current-record field controls must be placed inside the selected `form_grid_fields_wrapper`, not directly inside `section_content_area`; the field grid itself must be hosted in the `section_content_area` of `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper`.
- Multiple line, Rich text, and Sub list controls must be listed as full-row field controls and generated with column span equal to the parent Grid's column count for each responsive breakpoint.
- PC/laptop columns should be 2 or 3, tablet columns must not exceed PC/laptop columns, and mobile columns should be 1.
- Sub list field controls must use the control-level `data_list_form_control_sublist_v1_1` template inside `form_grid_fields_wrapper`; the App Plan names the Sub list business field and nested fields, while generation maps concrete `attrs.list-variables` and `attrs.list-fields`.
- Generated field controls must receive business-specific `nv_label` / `nav_label` values derived from their field or group purpose.
- If a custom form intentionally has no current-record field controls, state that explicitly with the business reason and proof boundary.
- This table is a planning contract only. Do not include generated `ListID`, `LayoutID`, `FieldID`, JSON property paths, copied control JSON, or runtime payload fields.

| Form Name | Field Order | Business Label | Field Name | Field ID | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Support Source | Proof Label | Fallback / Deferred Reason | Binding | Read Only | Required | Default Value | Placeholder | Dynamic Display | Custom Validation | Lookup Target | Lookup Display Field | Additional Lookup Fields | Sublist/Summary Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Form> | 1 | <Business label> | <Field> | <ID> | <Exact field type> | <Exact control type> | <Plugin skill/doc/export reference> | validator-backed/runtime-proof-required/export-learning-required/deferred | <Reason or N/A> | <Binding> | Yes/No | Yes/No | <Default> | <Placeholder text> | <Rule> | <Rule> | <List> | <Field> | <Fields> | <Notes> | <Description> |

#### Custom Form Actions and Temp Variables

| Action Name | Host Form | Trigger Location | Trigger Type | Temp Variables | Steps | Data Read | Data Write | Bound Controls | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Action> | <Form> | Page Load / Field Change / Submission / Button | <Type> | <Variables> | <Steps> | <Data> | <Data> | <Controls> | <Notes> |

#### Sub List List Actions

Required whenever a Sub List control appears on a New/Edit/View/Detail/Custom/Print form.

| Host Form | Sub List Field/Control | Action Name | Exact Yeeflow List Action Type | Support Source | Proof Label | Fallback / Deferred Reason | Current Row Context | Steps | Summary Fields Affected | Parent Field Binding | Runtime Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Form> | <Sub List> | No custom Sub List actions required / <Action> | add item / duplicate item / delete item / import items / move up/down / insert before/after / supported custom action | <Plugin skill/doc/export reference> | validator-backed/runtime-proof-required/export-learning-required/deferred | <Reason or N/A> | <Current row context> | <Steps> | <Summary fields> | <Binding> | Runtime action execution is separate proof |

Rules:

- Every list that users create or edit records in should have a runtime-safe Add/New form plan.
- Every generated New/Edit/View custom Data List form must select the correct Data List Form Layouts v1.1 template before generation.
- Every generated field group on a New/Edit/View custom Data List form must select `data_list_form_fields_grid_v1_1` before generation.
- Query data and Set data list actions must identify target application/list/fields.
- Data List custom form root padding must follow the active plugin standard.
- Distinguish business labels from exact Yeeflow implementation types. Slash-combined or vague implementation wording is not generation-ready unless marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- If a custom Data List form includes a Sub List, explicitly state whether custom List actions are required.
- If custom Sub List actions are required, list each action and its steps, current row context, affected Summary fields, and parent field bindings.
- Supported list action types must come from plugin-known/export-proven Sub List action shapes, such as add item, duplicate item, delete item, import items, move up/down, insert before/after, or supported custom action patterns.
- Runtime execution proof for Sub List actions is separate from package validation.
- If no custom List actions are required, explicitly write: `No custom Sub List actions required`.

## 11. Data List Workflows Plan

Return to the Data lists and Document libraries from Section 4 and plan list workflows.

| Workflow Name | Host List/Library | Trigger Condition | Nodes in Order | Branches | Branch Conditions | Data Read/Write | Notifications/AI/External Calls | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Workflow> | <List> | <Trigger> | <Nodes> | <Branches> | <Conditions> | <Data> | <Calls> | <Proof> | <Notes> |

#### Workflow Task Form Layout Template Selection

Required when a Data list workflow includes a generated task form page.

| Workflow | Host Resource | Task Form | Workflow Surface | Selected Workflow Task Form Layout Template | Business Sections Needed | Editable Task Inputs | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Data list workflow> | <List or Library> | <Task form> | Data list workflow task | approval_form_layout_task_v1_1 | <Sections> | <None or fields> | <Reason> | Generated-final validation |

Rules:

- Node types must come from active plugin workflow-node documentation or export-proven references.
- Runtime execution proof is separate from package validation.
- If a Data list workflow includes a task form, it must select `approval_form_layout_task_v1_1`. The generated task form must follow the same Approval Form Layouts v1.1 task template contract as Approval form task pages, including readonly-by-default fields unless assignee input is required.

## 12. Notifications Plan

Return to the Data lists and Document libraries from Section 4 and plan notifications.

| Notification Name | Host Resource | Trigger Condition | Recipients | Message Content | Data Fields Used | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Notification> | <List/Form/Workflow> | <Trigger> | <Users/roles/fields> | <Content> | <Fields> | config-proven/delivery-proof-required/deferred | <Notes> |

Rules:

- Notification configuration proof is separate from delivery proof.
- Do not use real users/emails unless explicitly approved.

## 13. Data List Views Plan

Return to the Data lists and Document libraries from Section 4 and plan views.

| View Order | List/Library | View Name | URL / Route Key | Default | Access Scope | Filter Conditions | Sort/Grouping | Display Fields | Query/Search Fields | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <List> | <View> | <url> | Yes/No | All users / role-specific | <Filters> | <Sort> | <Fields> | <Fields> | <Notes> |

Rules:

- Each generated list should have meaningful default display columns.
- Query/search fields must use fields that exist in the list.
- View order must be explicit.

## 14. Dashboard Pages Plan

Repeat for each Dashboard page.

### 14.x <Dashboard Page Name>

- Page name:
- Business purpose:
- Source Functional Specification dashboard requirement reference:
- Source data lists/business objects:
- Navigation placement:
- Page Function Plan reference if applicable:
- Depends on:
- Temp variables required:
- Page/form actions required:
- Runtime proof required:
- Functional Specification dashboard source: business questions, source business objects/data lists, summary metrics, metric source fields, calculation logic, data regions, display fields, filters, sorting/grouping, user actions, mobile support, and alerts from Stage 1.

Dashboard page identity:

| Dashboard Page Name | Business Purpose | Functional Spec Dashboard Requirement Reference | Source Data Lists/Business Objects | Navigation Placement | Page Function Plan Reference |
| --- | --- | --- | --- | --- | --- |
| <Dashboard> | <Purpose> | <Functional Spec section/requirement> | <Lists/objects> | <Navigation group/item> | <Page Function Plan path or not applicable> |

#### Dashboard Page Layout Template Selection

Required for every generated Dashboard page.

| Dashboard Page | Selected Dashboard Page Layout Template | Business Layout Need | Primary Regions Needed | Right Side Panel Needed | Chart Cards Section Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Dashboard> | dashboard-page-layouts-v1.1 / dashboard-page-layouts-workbench / dashboard-page-layouts-two-panel-workspace / dashboard-page-layouts-three-panel-workspace | General overview / operational workbench / master-detail workspace | <Sections/regions> | Yes/No | Yes/No | <Reason using template guidance> | Generated-final validation |

Rules:

- Select exactly one Dashboard page layout template per Dashboard page from `docs/reference/dashboard-page-layout-templates.json`.
- Use `dashboard-page-layouts-v1.1` for general overview dashboards, report-style dashboards, and section-first pages.
- Use `dashboard-page-layouts-workbench` for operational workbench pages that need a primary working area, optional right-side panel, top filters, KPI cards, grouped analytics, and queue/list regions.
- Use `dashboard-page-layouts-two-panel-workspace` when a Dashboard must manage one source dataset with a left record list and a right selected-record detail panel.
- Use `dashboard-page-layouts-three-panel-workspace` when the selected-record detail needs a main detail panel plus an additional right-side information/action panel.
- If `dashboard-page-layouts-workbench` is selected, state whether `right_side_panel` and `chart_cards_section` are needed. Empty Workbench right-side panels and empty chart sections must be removed during generation.
- If a master-detail workspace template is selected, state the source dataset, selected item title/description fields, left-panel filters/search, current-item operations, detail field groups, related-record sections, analytics sections, and whether the empty-selection state should keep or replace the template image/title/description.
- Master-detail workspace pages must preserve the `vCurrentItemID` temp variable. The left-panel Collection item click action must write the clicked item ID into `vCurrentItemID`, and the current-item detail Collection must limit records to `1` and filter record ID by `vCurrentItemID`.
- The App Plan may state selected template and business regions, but must not include copied control JSON, generated IDs, or low-level style/property payloads.

#### Dashboard Sections

| Section Order | Section Name | Business Purpose | Source Data List or Business Object | Required Fields or Metrics | Selected Yeeflow Control Type Category | Why This Control Type Is Appropriate | User Actions Needed | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Section> | <Purpose> | <List/object> | <Fields/metrics> | Summary / KPI card, Data Filter, Collection, Data table, Kanban, Vertical Timeline, Horizontal Timeline, Text / Heading, Button / action button, Container, Grid / flex grid, Chart / Data analytics if supported/proof-required | <Reason> | <Actions> | <Proof/deferred note> |

Rules:

- Each dashboard section must trace to a business-level Dashboard Page Requirement from the Functional Specification. Do not invent dashboard metrics, filters, regions, or actions that are not in the Functional Specification unless they are explicitly added as an App Plan assumption or clarification gate.
- Dashboard sections must map business requirements to legal Yeeflow control type categories. Allowed categories include Summary / KPI card, Data Filter, Collection, Data table, Kanban, Vertical Timeline, Horizontal Timeline, Text / Heading, Button / action button, Container, Grid / flex grid where needed for structured display, and Chart / Data analytics only if plugin-supported or marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- Unsupported or invented dashboard control type categories are not generation-ready unless marked `runtime-proof-required`, `export-learning-required`, or `deferred` with reason, fallback, and proof/generation impact.
- Summary/KPI cards must be data-bound using plugin-supported controls and bindings. Static text may be used only when explicitly marked fallback, `runtime-proof-required`, `export-learning-required`, or `deferred` with reason, fallback, and proof/generation impact.
- Collection, Kanban, Timeline, Data Filter, Data table, Summary/KPI, chart/data analytics, action button, Text/Heading, Container, and Grid/flex grid planning must include source data, fields/metrics, actions, and proof boundary at business/control-type level.
- Do not include concrete generated IDs, ListID/PageID/FormID/LayoutID/ProcKey values, actionTypeCode values, Yeeflow JSON property paths, exact Container nesting, exact style values, runtime binding payloads, implementation-level layout JSON, or fake placeholder IDs such as `LIST-*` or `LAYOUT-*`. Those belong to Blueprint/resource generation and validation.

#### Dashboard Filters

| Filter Name | Source Data List | Filter Field | Applies-to Dashboard Sections | Selected Yeeflow Filter/Control Type If Known | Default Business Scope | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| <Filter> | <List> | <Field> | <Sections> | Data Filter / Text search / choice/date filter / runtime-proof-required / export-learning-required / deferred | <Default scope> | <Proof/deferred note> |

#### Page Level Data Filter Group Template Selection

| Page/Form Surface | Page/Form Name | Filter Count | Selected Data Filter Group Template | Included Filters | Placement Region | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard / Custom Data List form / Approval submission / Approval task / Data list workflow task / Schedule workflow task | <Name> | <Count> | dashboard_standard_filter_group when count is two or more | <Filters> | <Approved section_content_area> | <Reason> | Generated-final validation plus runtime proof if linkage is claimed |

Rules:

- If a page or form contains two or more page level Data Filter controls, select `dashboard_standard_filter_group`.
- Do not use this table for local Collection toolbar search boxes.
- Do not include generated `ListID`, `ListSetID`, runtime field storage IDs, or copied control JSON.

#### Summary Metrics

| Metric Name | Source Data List | Source Field(s) | Calculation Logic | Selected Yeeflow Control Type Category | Display Format Intent | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| <Metric> | <List> | <Fields> | <Business calculation> | Summary / KPI card | count / percentage / currency / duration / number | <Proof/deferred note> |

#### Data Analytics Template Selection

Required for every Dashboard or Data List form section that uses a chart, pivot table, or Data Analytics control.

| Section | Surface | Data Source | Business Question | Selected Data Analytics Template | Grouping/Axis Fields | Value/Aggregate Fields | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Section> | Dashboard / Data List form | <Data List/Form Report/Data Report/Document Library metadata list> | <Question> | <approved Data Analytics template ID> | <Business fields only, no runtime IDs> | <Business fields/aggregate logic> | <Reason using template guidance> | <Local/runtime proof boundary> |

Rules:

- The Selected Data Analytics Template must be one of `data_analytics_pie_chart_with_title`, `data_analytics_column_chart_with_title`, `data_analytics_bar_chart_with_title`, `data_analytics_line_chart_with_title`, `data_analytics_area_chart_with_title`, or `data_analytics_pivot_table_standard` from `docs/reference/data-analytics-golden-references.json`.
- For each chart/pivot region, state the business question, source data, grouping/axis fields, value/aggregate fields, and selection reason. The rationale must use the selected template's `whenToUse`, `whenNotToUse`, `requiredBusinessSignals`, and `suitableSourceResourceTypes` guidance.
- Select exactly one approved Data Analytics template per analytics region. Do not list multiple possible templates for the same region and do not leave the template choice to generation.
- App Plan selection is a business decision only. It must not include generated `ListID`, `LayoutID`, `PageID`, action type codes, JSON property paths, placeholder IDs, or runtime payload fields in this table.
- Data Analytics templates are allowed only on Dashboard pages and Data List forms. They must not be planned for Approval forms.
- On Dashboard Page Layouts v1.1 pages, generated resources may place Data Analytics templates inside `content_card_wrapper`, `2_columns_section`, `3_columns_section`, or `2_columns_60/40_section`.
- On Workbench Dashboard pages, grouped analytics should use `chart_cards_section` under `primary_working_area` or `right_side_panel`; one `chart_cards_section` should contain no more than three Data Analytics templates.
- The App Plan may state the selected placement family, but must not prescribe low-level container properties.

#### Data Table Template Selection

Required for every Dashboard, Custom Data List form, Approval form page, workflow task form, or Approval print page section that uses a native Data table control.

| Host Surface | Page/Form | Region | Source Resource | Business Purpose | Selected Data Table Template | Column Width Mode | Caption/Search/Actions | Display Columns | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Dashboard / Custom Data List form / Approval submission / Approval task / Approval print / Data List workflow task / Schedule workflow task> | <Name> | <Section> | <Data List / Document Library metadata list / Form Report / Data Report> | <Why a native Data table is needed> | <approved Data table template ID> | Default scroll / Auto no-scroll | <None or caption title/search/add/import/export> | <Business field labels only, no runtime IDs> | <Reason using template guidance> | <Local/runtime proof boundary> |

Rules:

- The Selected Data Table Template must be one of `data_table_control_standard_scroll`, `data_table_control_standard_no_scroll`, or `data_table_control_caption_scroll` from `docs/reference/data-table-golden-references.json`.
- Select exactly one approved Data table template per Data table region. Do not list multiple possible templates for the same region and do not leave the template choice to generation.
- Use `data_table_control_standard_scroll` when many columns need readable widths and horizontal scrolling is acceptable.
- Use `data_table_control_standard_no_scroll` when the table has a small number of columns and should fit inside the current control without horizontal scrolling.
- Use `data_table_control_caption_scroll` when the Data table needs caption title, built-in search, add item, and import/export more-menu behavior.
- The App Plan selection is a business decision only. It must not include generated `ListID`, `ListSetID`, field storage IDs, JSON property paths, copied control payloads, or placeholder IDs.
- Use Data table for lightweight tabular display. Use approved Collection/Kanban/Timeline templates instead when the requirement needs rich cards, multi-select state, complex row operations, kanban boards, or timeline presentation.

#### Dashboard Actions

| Action Name | Business Purpose | Source/Target Business Object | Expected User Outcome | Supported Yeeflow Action Category When Known | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- |
| <Action> | <Purpose> | <Object> | <Outcome> | open dashboard/form, open detail, add data list item, run form action, runtime-proof-required, export-learning-required, deferred | <Proof/deferred note> |

Rules:

- Dashboard action planning may name supported action categories, but must not include concrete `actionTypeCode`, ListID, PageID, FormID, LayoutID, ProcKey, runtime payload fields, or implementation JSON.

#### Record Display Control Selection

Required for every Dashboard/Page section that displays Data List records.

| Section | Data Source | Display Need | Selected Record Display Control | Selected Collection Presentation Reference | Required Business Fields | Selection Reason | Detail/Open Behavior | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Section> | <Data List/Form Report/Document Library metadata list> | <Cards/table/status board/activity history/roadmap/etc.> | Data table / Collection / Kanban / Vertical timeline / Horizontal timeline | <approved Dashboard Collection reference ID or not applicable> | <Business fields only, no runtime IDs> | <Reason> | <Open/edit/detail behavior> | <Local/runtime proof boundary> |

Rules:

- Allowed selected controls are Data table, Collection, Kanban, Vertical timeline, and Horizontal timeline.
- Prefer Collection over Data table when both can satisfy the requirement, unless a dense native table/grid is specifically required.
- When the selected record display control is Collection, the Selected Collection Presentation Reference must be one of `collection_control_responsive_card_grid`, `collection_control_card_with_multiselect_toolbar`, `collection_control_grid_table`, `collection_control_grid_table_with_multiselect`, or `Event Pipeline Grid-Table` from `docs/reference/dashboard-dataset-presentation-golden-references.json`. Search/fulltext is planned as behavior inside the selected approved template, not as a separate Collection template ID.
- For Collection rows, state the required business fields and selection rationale. The rationale must use the selected template's `whenToUse`, `whenNotToUse`, `requiredBusinessSignals`, and `suitableSourceResourceTypes` guidance, such as card browsing, dense row/column scanning, free-text search, multiselect/bulk operation, or high-fidelity primary operations table.
- Select exactly one approved Collection presentation reference per Dashboard dataset region. Do not list multiple possible templates for the same region and do not leave the template choice to generation.
- App Plan selection is a business decision only. It must not include generated `ListID`, `LayoutID`, `PageID`, action type codes, JSON property paths, placeholder IDs, or runtime payload fields in this App Plan table.
- Use Kanban for status, lane, queue, or work-board patterns.
- Use Vertical Timeline for activity, history, audit, event feed, and chronological log patterns.
- Use Horizontal Timeline for roadmap, phase, lifecycle, and milestone progression patterns.
- Use Data table only when a true tabular data grid is required.
- The reason for the selected control must be stated.

#### Item Template Dynamic Controls

Required for every Collection, Kanban, Vertical Timeline, or Horizontal Timeline control.

| Host Control | Source List | Business Label | Source Field | Expected Dynamic Display Control Category | Display Purpose | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| <Collection/Kanban/Timeline> | <List> | <Business label> | <Field> | dynamic field / dynamic user / dynamic image / dynamic file / dynamic date / supported display category | <Purpose> | <Proof/deferred note> |

Rules:

- Dynamic display needs stay at business/control-type category level in the App Plan. Low-level control properties and runtime binding payloads belong to Page Function Plan, Blueprint, resource generation, and validation.
- Allowed Dynamic display categories must come from plugin-known/export-proven controls, such as dynamic field, dynamic user, dynamic image, dynamic file, dynamic date, or a supported display category if documented.
- Status or badge display is allowed only when backed by supported Yeeflow controls/categories or marked for proof/deferment.
- Collection, Kanban, Vertical Timeline, and Horizontal Timeline controls must not have empty item templates.
- Every visible item-template value must map to a Dynamic control and a real source field.
- User/person displays must bind to User/person fields.
- Status, priority, and condition displays must bind to supported Choice fields or supported display fields.
- Unsupported Dynamic control types or property paths must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`.

#### Collection and Kanban Item Actions

Required for Collection and Kanban controls.

| Host Control | Action Name | Business Purpose | Source/Target Business Object | Expected User Outcome | Supported Yeeflow Action Category When Known | Proof Boundary or Deferred Note |
| --- | --- | --- | --- | --- | --- | --- |
| <Collection/Kanban> | No Collection/Kanban item actions required / <Action> | <Purpose> | <Object> | <Outcome> | open detail, add data list item, open dashboard/form, run form action, runtime-proof-required, export-learning-required, deferred | Runtime action execution is separate proof |

Rules:

- Collection/Kanban actions must use plugin-known/export-proven action categories or be marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- Vague action wording such as `Open detail/slide panel where supported` or `Update row/status where supported` is not generation-ready unless marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- If an action writes data, state the source/target business object and expected user outcome at business level. Concrete runtime payload fields belong later.
- Runtime execution proof is separate from package validation.
- If no custom actions are required, explicitly write: `No Collection/Kanban item actions required`.

## 15. Application Navigation Plan

Application layout template: `application-layout-sidebar-workspace-1`.

#### Application Color Pattern Selection

| Color Role | Base Color | Light Model | Source / Rationale |
| --- | --- | --- | --- |
| Primary | <business-appropriate #RRGGBB> | Luminance | Business-domain primary rationale, such as travel approval, procurement, asset operations, finance, or workforce management |
| Secondary | <business-appropriate #RRGGBB> | Luminance | Business-domain secondary/accent rationale that complements the primary color |
| Neutral | <low-chroma #RRGGBB> | Luminance | Neutral UI-state rationale for forms, borders, read-only fields, and subtle backgrounds |

Rules:

- Every App Plan must choose the application color pattern used by the Type `0` `application style` theme in `Themes[]`.
- Only Primary, Secondary, and Neutral base colors are selected here. Success, warning, and danger remain Yeeflow semantic colors and must stay green, yellow, and red.
- `Light Model` must be exactly `Luminance` for Primary, Secondary, and Neutral.
- Primary and Secondary base colors must not be too light or too dark. Prefer OKLCH lightness `0.42-0.68`; values outside `0.35-0.82` are not generation-ready.
- Neutral must remain low-chroma. It must use OKLCH lightness `0.65-0.88` and chroma no greater than `0.06`.
- If the user provides approved brand colors, use those colors when they pass readability ranges.
- If the user does not provide brand colors, choose Primary, Secondary, and Neutral from the business function and explain the rationale. Do not keep the generic Yeeflow defaults only because the user was silent.
- The generic fallback palette `#0065FF` / `#00D1FF` / `#B3B7C0` may be used only when the business domain cannot be inferred or when the user explicitly requests/approves the Yeeflow default palette.
- Recommended examples: Business Travel / approval / reimbursement apps can use Primary `#1E40AF`, Secondary `#0F766E`, Neutral `#94A3B8`; procurement/vendor apps can use Primary `#0F766E`, Secondary `#1D4ED8`, Neutral `#94A3B8`; asset/operations apps can use Primary `#1D4ED8`, Secondary `#0F766E`, Neutral `#94A3B8`.
- Generated packages must write these selected base colors into the Type `0` `application style.Config` stringified JSON and preserve the Soft outline controls default control style binding.

| Navigation Order | Group | Item | Yeeflow Resource Type | Target Resource | Visible | Icon | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Group> | <Item> | Data list / Dashboard / Approval form / Report | <Resource> | Yes/No | <Icon> | <Notes> |

Runtime navigation rules:

- New generated apps use the `application-layout-sidebar-workspace-1` golden reference by default unless the user explicitly selects another approved Yeeflow application layout.
- The package must materialize the template through `ListSet.LayoutView.sortVer` and `ListSet.LayoutView.attrs`, including the 46px header, `h6-semi-bold` title typography, left navigation menu, and reference header/navigation colors.
- Every visible business navigation group and menu item must include a suitable FontAwesome icon. Do not leave the `Icon` cell blank for visible menu entries.
- Groups use `Type: "classes"` with `list`.
- Dashboards/pages use `Type: 103`.
- Approval forms use `Type: 105` with `ListID = Forms[].Key`.
- Data lists use `Type: 1`.
- Do not use runtime group `children` or `Childs`.
- Every intended resource must be reachable through navigation or explicitly hidden/deferred.

## 16. Target Users, Roles, Groups, and Permissions

| Role | User Group | Resource/Page/Form | View | Create | Edit | Delete/Archive | Approve | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Role> | <Group> | <Resource> | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | <Notes> |

Rules:

- Use placeholders, empty groups, requester/current-user expressions, or post-import setup unless real IDs are approved.
- Do not generate real users, emails, group members, departments, or job positions unless explicitly authorized and schema support is proven.

## 17. Plugin Capability and Standards Compliance

| Capability Area | Plugin Knowledge Source | Supported Shapes Used | Unsupported/Unproven Items | Validator/Check | Notes |
| --- | --- | --- | --- | --- | --- |
| Data list fields | <Skill/doc/reference> | <Types> | <Items> | <Validator> | <Notes> |
| Approval variables/forms | <Skill/doc/reference> | <Types> | <Items> | <Validator> | <Notes> |
| Workflow nodes | <Skill/doc/reference> | <Nodes> | <Items> | <Validator> | <Notes> |
| Dashboard controls | <Skill/doc/template> | <Controls> | <Items> | <Validator> | <Notes> |

Rules:

- The App Plan must be based on plugin-supported capabilities.
- All App Plan resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes must come from the active plugin's known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references.
- Business-friendly labels must be separate from exact implementation types. Use split columns such as `Business Label`, `Exact Yeeflow Field Type`, `Exact Yeeflow Variable Type`, `Exact Yeeflow Control Type`, `Exact Yeeflow Action Type`, `Support Source`, `Proof Label`, and `Fallback / Deferred Reason` where needed.
- Slash-combined or vague implementation wording such as `Title/Text`, `Currency/Number`, `User/person`, `Attachment/File upload`, `Document library / Data list`, `Type 1/document library`, `Lookup/read-only dynamic field`, `Document/list section`, `Open detail/slide panel where supported`, or `Update row/status where supported` is not generation-ready unless marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- If a requirement depends on an unknown capability, mark it as export-learning-required, runtime-proof-required, or deferred.
- Do not plan invented control shapes, Dynamic control types, field types, variable types, workflow nodes, action schemas, property paths, bindings, or configuration shapes.
- Unknown shapes must be marked `export-learning-required`, `runtime-proof-required`, or `deferred` and must not be treated as generation-ready.

## 18. Generation Contract and Hard Gates

### Output Package

- Default output: `.yapk`
- `.yap` only if explicitly requested
- Package generation expected in this task: Yes/No
- Planning-only task: Yes/No

### Required Gates

| Gate | Required | Pass Criteria | Blocks Generation/Signing/Install |
| --- | --- | --- | --- |
| Functional spec approved | Yes | Approved, answered, or user-default-approved-for-generation | Generation |
| App Plan approved | Yes | Approved by user | Generation |
| Business Clarification Gate | Yes | Planning mode may pass `default-applied-for-planning`; generation mode requires answered, not applicable, deferred with reason/fallback/proof impact, or `user-default-approved-for-generation`; `validate-business-clarification-gate.mjs --mode generation` passes before generation | Generation |
| Functional Spec to App Plan traceability | Yes | `validate-functional-spec-to-app-plan-traceability.mjs` passes | Generation |
| Generation Readiness Review | Yes | `validate-generation-readiness-review.mjs` passes | Design/generation |
| Plugin capability compliance | Yes | No invented unsupported shapes; any unsupported resource/control/action/property shape is marked `export-learning-required`, `runtime-proof-required`, or `deferred` | Generation |
| Schema validation | Yes | Package schema passes | Signing |
| API-issued ID provenance | For generated-final `.yapk` | All generated IDs API-issued and reported | Signing/install |
| Upgrade ID stability | For upgrades | Existing semantic IDs preserved | Upgrade |
| Approval form gate | If approval required | Forms, task pages, workflow, DefResource present | Signing/install |
| Navigation runtime gate | Yes | Runtime navigation metadata valid | Signing/install |
| Dashboard grid-table Collection gate | If planned | Header + Collection wrapper and detail links valid | Signing/install |
| Root padding gate | For dashboards/custom forms | Token-array root padding valid | Signing/install |
| Plan-to-package conformance | Yes | Planned resources implemented or explicitly deferred | Handoff |
| Advanced capability gate | If planned | AI Agents, Copilots, custom code, custom CSS, integrations, notifications, schedule workflows, and external execution are plugin-supported, export-proven, runtime-proof-required, or deferred | Generation/handoff |

- Business decision gates answered/user-default-approved-for-generation or no blockers: Yes/No

### Advanced Capability Gate

- AI Agents, Copilots, custom code, custom CSS, integrations, notifications, schedule workflows, external calls, advanced controls, Dynamic controls, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes must cite plugin-known skills, standards, validators, template library entries, control/property knowledge base entries, extension registry entries, or export-proven references before generation.
- Unknown or partially proven advanced capabilities must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`.
- Do not invent unsupported control, resource, action, workflow-node, schedule, AI, Copilot, custom-code, notification, integration, property, binding, or configuration shapes.
- Runtime execution proof for AI, notifications, schedule workflows, external integrations, custom code, and permission enforcement is separate from package generation, signing, install/import/upgrade acceptance, and browser render proof.

## 19. Validation Plan

| Validation Layer | Scope | Tool/Method | Expected Result | Proof Boundary |
| --- | --- | --- | --- | --- |
| App-plan conformance | Resources vs plan | <Validator/manual> | pass/fail | Local proof |
| Business clarification | Decision gates | `validate-business-clarification-gate.mjs` | pass/fail | Planning readiness only |
| Generation readiness | 13 resource areas and review gates | `validate-generation-readiness-review.mjs` | pass/fail | Planning readiness only |
| Functional Spec to App Plan traceability | Requirement categories vs planned resources | `validate-functional-spec-to-app-plan-traceability.mjs` | pass/fail | Planning traceability only |
| Package schema | `.yapk`/`.yap` schema | <Validator> | pass/fail | Local proof |
| Control/property fidelity | Controls and bindings | <Validator> | pass/fail | Local proof |
| Runtime UI | Browser load/screenshots | <Runtime test> | pass/fail | Runtime proof |
| Workflow execution | Workflow test | <Runtime/manual> | pass/fail | Execution proof |

Include:

- Data-list/schema validation:
- Approval-form validation:
- Form report validation:
- Schedule workflow validation:
- AI Agent/Copilot validation:
- Custom data list form validation:
- Data list workflow validation:
- Notification validation:
- View validation:
- Dashboard/control validation:
- Navigation validation:
- Permission validation:
- Signing validation:
- Upgrade-check/upgrade-apply validation:
- Runtime verification:

Report wording requirement:

- Functional Specification structure: pass/fail
- App Plan resource order: pass/fail
- Functional Spec to App Plan traceability: pass/fail
- Generation Readiness structural check: pass/fail
- Business Clarification Gate for planning: pass/fail
- Business Clarification Gate for generation: pass/fail
- Overall generation readiness: pass only if all required planning gates pass for generation

If Generation Readiness structural check passes but Business Clarification Gate for generation fails, write exactly: `Overall generation readiness: blocked by Business Clarification Gate`. Do not write only `Validation passed` or `all passed` when planning defaults are only applied for planning.

## 20. Proof Boundary

Separate these proof levels:

- Plan approval:
- Local generation validation:
- Package schema validation:
- ID provenance proof:
- Navigation runtime metadata proof:
- Dashboard/control proof:
- Signing proof:
- API install/import/upgrade acceptance:
- Runtime materialization/render proof:
- Workflow execution proof:
- Scheduled workflow execution proof:
- Notification delivery proof:
- AI Agent/Copilot execution proof:
- External integration execution proof:
- Permission enforcement proof:

Boundary rule:

- Signing/install/upgrade acceptance does not prove runtime UI fidelity, workflow execution, notification delivery, AI execution, permission enforcement, or external integration behavior.
- Business Clarification Gate, Generation Readiness Review, and Functional Spec to App Plan traceability prove planning readiness only. They must pass before full-page canonical design images, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, signing, install/import/upgrade, or runtime proof, but they do not prove generated package validity or runtime behavior.

## 21. Assumptions

- Business assumptions:
- Data assumptions:
- Role/user assumptions:
- UI/control assumptions:
- Workflow assumptions:
- Package/output assumptions:

## 22. Deferred or Runtime-Proof Items

| Item | Category | Reason | User Impact | Fallback | Required Proof or Follow-up |
| --- | --- | --- | --- | --- | --- |
| <Item> | deferred/runtime-proof-required/post-import-config | <Reason> | <Impact> | <Fallback> | <Proof/follow-up> |

Include:

- Anything not generated.
- Anything generated but not runtime-proven.
- Anything requiring browser/manual verification.
- Anything requiring tenant-specific users/groups/positions/configuration.
- Anything requiring custom code, custom CSS, scheduled execution, notification delivery, AI execution, or external integration proof.

## 23. Recommended Next Prompt

Use this prompt after the plan is approved:

`Use @yeeflow-app-builder to generate <Application Name> from <app plan path>. Treat the approved Functional Specification and App Plan as the implementation contract. Generate the complete planned application unless an item is explicitly deferred. Use .yapk by default unless .yap is explicitly requested. Follow the resource generation order in the App Plan. Use only plugin-supported Yeeflow resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes. Validate schema, ID provenance, navigation runtime metadata, approval forms, form reports, schedule workflows, AI/Copilot resources, custom data list forms, Sub List actions, data-list workflows, notifications, views, dashboard control selection, item-template Dynamic controls, Collection/Kanban actions, grid-table Collection patterns, root padding, graph, UI quality, app-plan conformance, package wrapper/signing readiness, and source/dist consistency. Do not run live Yeeflow API calls, write operations, install/import/upgrade, or runtime tests unless explicitly authorized. Report local validation, signing status, API acceptance, runtime proof, deferred items, and known risks separately.`
