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

| Field Order | Business Label | Display Name | Internal ID / Field Key | Exact Yeeflow Field Type | Exact Yeeflow Control Type | Support Source | Proof Label | Fallback / Deferred Reason | Required | Unique | Default Value | Placeholder | Validation Rules | Choice Values | Lookup Target | Lookup Display Field | Additional Lookup Fields | Allow Barcode / QR Scan | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Contract title | Title | Title | Title | input control | plugin-known field/control type | validator-backed | N/A | Yes | No | | <Placeholder text> | | | | | | No | Native title field |

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
- Set `Allow Barcode / QR Scan = Yes` only for Text fields rendered with the input control. Generated fields then serialize `Rules = {"allowScan":true}`; never infer scanning from a field name alone.
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

When an Assignment Task uses a direct Job Position assignee, add or include Job Position proof columns before generation: `Required Job Position`, `Job Position ID`, `Job Position Source`, `Job Position Proof Status`, `Job Position OAuth Status`, `OAuth Refresh Status`, `Job Position Lookup Status`, `Job Position Lookup Attempted`, `Job Position Create Attempt Count`, `Job Position Create Response ID Recorded`, `Job Position Duplicate Scan`, `Job Position Creation Confirmed`, and `Job Position Admin Confirmed`. API-assisted Job Position routing is not generation-ready if OAuth refresh/lookup proof is missing.

When `Node Type = SetVariableTask`, add a `Set Variable Assignments` column using `VariableId :: variableType :: Business Name :: JSON expression token array`, separated by `;;` for multiple assignments. Exact assignments are mandatory; never use an empty/default placeholder.

#### Workflow Set Data List Action Plan

| Workflow Host | Workflow Name | Node Name | Target Mode | Target Resource | Target Resource Type | Operation | Mappings JSON | Filters JSON | Batch Source Type | Batch Source | Batch Source Fields JSON | Parent Loop | Proof Boundary | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Approval Form / Data List / Scheduled | <Workflow> | <ContentList node> | current/select | <Host or selected resource> | Data List / Document Library | add/edit/remove | <JSON array of Columns, Per, Data> | <JSON array of where conditions> | Workflow List Variable / Data List Sub List Field / blank | <List variable id or Sub list field id> | <JSON array of child field IDs> | <Loop name or blank> | export-proven/runtime-proof-required/export-learning-required | <Business intent> |

Rules:

- Approval Form and Scheduled workflows must use `Target Mode = select`.
- Data List workflows may use `current`; preserve the export-proven `current + add` shape for current-record mutation.
- `add` and `edit` require a non-empty `Mappings JSON` array. `edit` and `remove` require non-empty, field-specific `Filters JSON`.
- Numeric operation codes are `0` Value, `1` Increase, `2` Decrease, `3` Multiply, and `4` Divide. Codes `1` through `4` require a numeric target field.
- Document Library targets are export-proven for Type 16 node shape. Add operations must map `Title`, `Text4` (Upload file), and `_Path`; mark actual file mutation execution `runtime-proof-required` until disposable-library runtime proof exists.
- When `Parent Loop` is nonblank, the node is materialized inside the named `LoopBody`; the plan must also contain an exact Workflow Loop Planning row. It must never be flattened into a host graph or recreated as repeated static nodes.

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

| Action Name | Step Name | Host Resource | Host Form | Host Surface / Page | Trigger | Exact Step Type | Query Mode | Source Resource Type | Source Resource | Filters | Sorts | Result Target Type | Result Target | Field Mapping | Count Target Type | Count Target | Page Size | Page Number | Persistence / Lifetime | Bound Control | Result Consumer / Use | Proof Boundary | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Action> | <Step> | <Approval form / Data List / Dashboard name> | <Submission / Task / Print / Custom form / Dashboard page> | Approval Submission / Task / Print / Data List New / Edit / View / Dashboard | Page Load / Field Change / Submission / Button | Query Data / Set variable / Confirm / Submit / other proven type | single_to_variables / single_to_temp_variables / single_to_list_fields / single_to_list_fields_and_temp_variables / multiple_to_sublist / multiple_to_list_sublist / multiple_to_temp_collection / multiple_count_only / N/A | Data List / Document Library / Form Report / Data Report / N/A | <Resource> | <Field/operator/value or None> | <Field asc/desc or None> | Workflow variables / Temp variables / Current Data List fields / Current fields + Temp variables / Approval Sub list / Current record Sub list / Temp collection / None | <Target id/name or None> | <Source field -> target id; ... or None> | Workflow number / Temp variable / None | <Target id/name or None> | 100 default / 1..1000 | 1 default / positive integer | Persisted instance / Current page session / N/A | <Control or trigger> | Text / calculation / Custom Code / persisted field / editable Sub list / None | export-proven / runtime-proven / focused-proof-required | <Notes and business rationale> |

Set Variable rows must additionally state in `Notes and business rationale`: exact target kind and ID, RHS fixed value or expression, optional condition, `continue` behavior, and the Dynamic Display/field/control consumer. Follow `docs/standards/set-variable-golden-reference-standard.md`.

##### Form Action Set Variable Planning

Required whenever a Form Action contains `Set variable` or `Start another action`. One row represents one assignment. Repeat `Action Name` and `Step Order` to build a multi-variable step.

| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control / Field | Target Kind | Target ID | Target Value Type | RHS Expression Tokens | Condition Tokens | Continue | Start Another Action Target | Result Consumer / Use | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Resource> | <Submission form / Task form / Custom form / Dashboard> | Approval / Data List Form / Dashboard | <Business action name> | 1 | <Business step name> | Page Load / Field Change / Button Click / Container Click / None | <Control binding, nv_label, or None> | Workflow variable / Temp variable / Current list field / None | <Exact target ID or None> | <Exact Yeeflow value type or N/A> | <JSON expression token array or N/A> | <JSON expression token array or None> | true / false | <Action name or None> | <Dynamic Display, readonly derived field, persisted field, or other consumer> | export-proven / validator-backed / runtime-proof-required |

Rules:

- `RHS Expression Tokens` must be a JSON array. Do not replace `currentUser`, `getUserAttr`, `getOrgAttr`, `isInGroup`, or nested expressions with prose.
- `Temp variable` targets are declared on the same page and serialized with the `__temp_` runtime prefix. Approval workflow-variable targets keep their exact workflow variable ID.
- `Current list field` is allowed only on a Data List custom form. Dashboard and Approval Form Actions cannot target Data List fields.
- `Page Load` binds through `formAction.onLoad`; `Field Change` binds through the source control's `attrs.control_event_rule`; button/container triggers bind through `attrs.control_action`.
- `Start Another Action Target` must resolve to another action on the same page. Use it to chain derived-value actions such as Requester -> Department/Department name.
- Approval field rows that consume Set Variable output must set `Read Only = Yes` for derived display values. When generated Dynamic Display behavior is required, the field row's `Dynamic Display` cell must contain an exact JSON rule array; generation rewrites every rule `controlId` to the containing control ID and rejects undeclared variable references.
- Data List Workflow `SetVariableTask` cannot update the current record. Use a `ContentList` / Set Data List node with `listtype = "current"` for current-item field writes.
- A bulk Sub list write is an export-proven `ContentList` `add` action, not a Loop substitute: use `key: "_list.<childField>"` in each row-derived mapping. Approval Form and Scheduled workflows use `exprType: "variable"` from a declared Workflow List variable; Data List workflows use `exprType: "list_field"` from a current-record Sub list field. Declare the corresponding Batch Source columns above, use an explicit selected target, and include a parent-form/list association mapping such as Applicant, Employee, or instance ID whenever the target rows need to remain traceable to their source.

##### Form Action Set Data List Planning

Required whenever an Approval Submission/Task form, Data List or Document Library custom form, or Dashboard Form Action contains `Set Data List`. One row represents one step and `Step Order` is the order inside the named action. Approval Print Page Set Data List remains `focused-export-proof-required`.

| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Operation | Target Mode | Target Resource Type | Target Resource | Field Mapping JSON | Filter JSON | Execution Condition Tokens | Continue When Not Met | Status Target Kind | Status Target ID | Item Result Target Kind | Item Result Target ID | Item Result Attribute | Proof Boundary | Business Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Resource> | <Submission form / Task form / New/Edit/View form / Dashboard> | Approval Submission / Approval Task / Data List New / Data List Edit / Data List View / Document Library New / Document Library Edit / Document Library View / Dashboard | <Business action> | 1 | <Business step> | Page Load / Field Change / Button Click / Container Click | <Control identity or None> | Set Data List | add / edit / remove | current / select | Data List / Document Library / None | <Exact resource or None> | <JSON listdatas array or None for remove> | <JSON wheres array or None for add/current> | <JSON expression token array or None> | true / false | Temp variable / Workflow variable / None | <Exact ID or None> | Temp variable / Workflow variable / None | <Exact ID or None> | itemid / totalcount / None | export-proven / validator-backed / runtime-proof-required | <Persistence intent and risk rationale> |

Rules:

- `current` is valid only on Data List/Document Library custom forms and means an immediate update of the current record. It does not require a selected target resource or filters.
- On New/Edit forms, prefer `Set Variable` plus `Submit Form` for ordinary field changes. A direct current-record Set Data List write is allowed only with an explicit immediate-side-effect rationale.
- View Item forms cannot persist through Submit Form; use `current + edit` when a business command must update the viewed record.
- `select + add` requires field mappings. `select + edit/remove` requires explicit non-empty filters so the mutation scope is bounded.
- Target resources are Data Lists or Document Libraries. Form Report/Data Report are not Set Data List mutation targets.
- `Per` in `Field Mapping JSON` is `0` Value, `1` Increase, `2` Decrease, `3` Multiply, or `4` Divide. Arithmetic modes are valid only for compatible numeric target fields.
- `Status Target` and `Item Result Target` are optional. When configured, they must resolve to declared variables. Dashboard result targets must be page temp variables.
- Mutually exclusive conditional Add/Update steps normally set `Continue When Not Met = true`, allowing the next branch step to be evaluated.
- Form Action Set Data List cannot expand Sub List rows into multiple target records. Use Workflow Set Data List for bulk Sub List-to-Data List/Document Library writes.
- Document Library Add must map one single-file value to native Upload File `Text4`. `_Path` is the export-proven folder pseudo-field. Multi-file, array, List, and Sub List upload sources require Workflow Set Data List.
- Public Forms cannot contain Set Data List Form Action steps.
- Use `docs/standards/form-action-set-data-list-golden-reference-standard.md`, run `validate-form-action-set-data-list-plan.mjs` before materialization, and run `validate-form-action-set-data-list.mjs --strict-generated` before signing.


##### Form Action Open Resource Planning

Required whenever a Form Action opens an Item Form, Approval Form, or Dashboard. One row represents one step; use exact step types `listitem`, `openform`, and `opendashboard`.

| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Operation Type | Target Mode | Target Resource Type | Target Resource | Item / Form ID Expression Tokens | Selected Custom Form | Default / Set Variables JSON | Query Parameters JSON | Open Mode | Modal Size | Custom Width | Return Item ID Temp Variable | Execution Condition Tokens | Continue When Not Met | Business Rationale | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Resource> | <Submission form / Task form / Custom form / Dashboard> | Approval Submission / Approval Task / Data List New/Edit/View / Document Library New/Edit/View / Dashboard | <Business action> | 1 | <Business step> | Button Click / Container Click / Field Change / Page Load | <Exact control identity> | listitem / openform / opendashboard | add / edit / view / new / submitted / open | current / select / N/A | Data List / Document Library / Approval Form / Dashboard | <Exact target> | <JSON token array or None> | <Target custom form or None> | <JSON array or None> | <JSON array or None> | slide / modal / target / new | 0 / 1 / 2 / 3 / 9 / None | <positive width for size 9 or None> | <temp variable or None> | <JSON token array or None> | Yes / No | <Reason> | export-proven / runtime-proof-required |

Rules:

- Follow `docs/standards/form-action-open-resource-golden-reference-standard.md`; do not substitute direct control action settings for Form Action steps.
- Selected Item Edit/View requires exact Item ID expression tokens. Current item mode is available only on Data List or Document Library custom forms.
- `openform/new` may use target Approval variable defaults and query parameters. `openform/submitted` requires Form ID tokens and forbids both.
- Optional custom item forms must belong to the selected target Data List or Document Library and match the requested operation.
- Dashboard-host expressions may reference only declared temp variables.
- Slide/Pop-up use modal sizes 0/1/2/3/9. Size 9 requires Custom Width. Full page/New window carry no modal size.
- Public Forms cannot plan or materialize these steps.

##### Form Action Print Page and Barcode Scan Planning

Required whenever an Approval Submission/Task form, custom Data List/Document Library form, or Dashboard uses Print page or Barcode scan. One row represents one step. This focused baseline proves Dashboard print targets and Dashboard barcode scanning.

| Host Resource | Host Form / Page | Host Type | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Target Page Type | Target Page | Print Title Expression Tokens | Paper Size | Print Layout | Scale Percent | Margins | Scanning Mode | Barcode Type | Result Temp Variable | Error Temp Variable | On Read Error | Barcode Filter Field | Business Rationale | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Inventory | Inventory | Dashboard | Print inventory | 1 | Print inventory records | Button Click | btn_print_inventory | print | Dashboard | Print inventory | `[{"type":"str","value":"Inventory List_"},{"type":"op","op":"&"},{"type":"func","func":"dateFormat","params":[[{"type":"func","func":"now","params":[]}],[{"type":"str","value":"DDMMYY"}]]}]` | A4 | landscape | 80 | Minimum | N/A | N/A | N/A | N/A | N/A | N/A | Print all inventory records | export-proven |
| Barcode Scan | Barcode Scan | Dashboard | Scan items | 1 | Scan inventory barcodes | Container Click | scan_trigger | barcode | N/A | N/A | N/A | N/A | N/A | N/A | N/A | multiple | auto | var_SelectedItems | var_ScanErrorMsg | Stop | Text10 | Filter Inventory Collection to scanned serial numbers | export-proven |

Rules:

- `print` currently supports an export-proven Dashboard target only. The target Dashboard must use `dashboard-print-multi-record-table-v1`, with a Collection, `table-v2` layout, at least one row/column merge example, and current-Collection-item QR binding.
- A4 serializes as `settings.Size = "6"`; Scale Percent serializes as a decimal (`80` -> `"0.8"`); Minimum margins serialize as `settings.Margins = "3"`.
- `barcode` modes are `multiple`, `select`, and `auto`. Export-proven barcode types in this round are Auto (omitted `attrs.type`) and `ean-13`.
- Result and error targets must be declared page temp variables. The result variable must be consumed by a Collection filter using operator `9` (contains/in scanned values); orphan scan output is a generated-final failure.
- This export proves Stop action on read error. Continue-to-next-step remains focused-export-proof-required.
- Public Form Barcode scan remains governed separately by the Public Form action allowlist and remains serialization-unproven until a Public Form export proves its exact shape.

##### Form Action Query Data Planning Rules

- One table row represents one Form Action step. Repeat `Action Name` for multi-step actions and preserve row order.
- Data List Form rows must identify both `Host Resource` and `Host Form`; these values are part of Plan-vs-Actual validation.
- Query Data steps must select an exact mode from `docs/standards/form-action-query-data-golden-reference-standard.md`.
- Decide the native capability before selecting a Query Data mode. A read-only multi-row region should normally bind Collection/Data Table directly to its Data List source. Do not add a Query Data temp collection merely to feed a dataset control.
- `single_to_variables` maps source fields to declared Approval workflow variables.
- `single_to_temp_variables` maps source fields to declared page temp variables and is not persisted.
- `single_to_list_fields` is Data List New/Edit only and maps source fields to current-record fields using the canonical current-field target encoding.
- `single_to_list_fields_and_temp_variables` is Data List New/Edit only and may populate persisted current fields plus page-session display values in one query step.
- `multiple_to_sublist` requires a declared list variable/listref row schema and explicit source-to-row-field mappings.
- `multiple_to_list_sublist` writes queried rows into the current Data List record's Sub list and must use `__list_`; its count target uses a declared temp variable.
- Prefer Collection or Data Table for read-only reverse-related display. Use Query Data into a current-record Sub list only when rows become an editable working copy, such as quote lines loaded by product type before quantity or description changes.
- Prefer New/Edit Item forms for `multiple_to_list_sublist`. A View Item host is export-proven by the focused sample but requires an explicit save/edit workflow and business rationale.
- Data List Form field-change actions bind through the source control's `control_event_rule`; page-load actions bind through `formAction.onLoad`.
- `multiple_count_only` uses no record-result target and no field mapping; it only declares a workflow/temp count target.
- Public Forms must not plan or materialize Query Data Form Action steps.
- Pagination is shared across Approval Form, Custom Data List Form, and Dashboard Query Data. Omitted `Page Size` means `100`; an explicit Page Size must be `1..1000`. Omitted `Page Number` means `1`.
- Serialize a non-default Page Number with export-proven `querydata_pageindex`; omit it for default Page Number 1.
- Dashboard Query Data may write only declared temp variables/temp collections. Dashboard counts also use temp variables; workflow/current-record targets are forbidden.
- Dashboard temp collections are JSON payloads, not Collection/Data Table data sources. Plan `JSONStringfy` for text output or an explicitly justified Custom Code renderer for custom tabular presentation.
- Every temp collection/JSON row must name its `Result Consumer / Use`. Generic region names are insufficient; identify `JSONStringfy`, a calculation/aggregate, or a specifically justified Custom Code renderer.
- Generation-ready result targets must be exact. Terms such as `temp collection / import buffer`, `Query Data or lookup-bound display`, `preferably`, or `equivalent` are planning blockers unless the alternative is explicitly deferred with one selected implementation.
- Lookup-backed filters and chained ID mappings must state that the stored target record `ListDataID`/target identifier is used. A display title or ambiguous `lookup value` is not an ID contract.
- `validate-generation-readiness-review.mjs` automatically runs `validate-form-action-query-data-plan.mjs` when Form Action Query Data intent is detected. Resource-order validation alone is not planning readiness.
- Native Document Library custom forms use the same Query Data planning and target rules as Custom Data List forms. Form Report and Data Report cannot be independent Form Action hosts.
- Focused exports prove Approval Submission, Custom Data List Form, Document Library custom form, Approval Task Form, and Dashboard hosts. Query Data sources are generation-safe for Data List, Document Library, and Form Report. Form Report is a source but not a Form Action host; Data Report remains focused-proof-required.
- Form Action `querydata_sorts[]` supports at most two sort fields, in listed priority order.

#### Workflow Query Data Planning

Required for every `QueryData` node in an Approval Form workflow, Data List workflow, or Scheduled Workflow. This table is separate from Form Action Query Data planning.

| Workflow | Workflow Host Type | Node Name | Workflow Query Mode | Source Resource Type | Source Resource | Filters | Sorts | Result Variable | Result Variable Type | ListRef / Complex Type | Field Mapping | Count Variable | Page Size | Page Number | Downstream Consumer / Use | Branch Coverage | Proof Boundary | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Workflow> | Approval / Data List / Scheduled Workflow | <Business action name> | single_to_variables / multiple_to_list_variable / multiple_to_text_variable / multiple_count_only | Data List / Document Library / Form Report | <Resource> | <Field/operator/value; Lookup filters explicitly use ListDataID; or None> | <Field asc/desc; maximum 2; or None> | <Workflow variable or None> | Workflow variables / List workflow variable / Text workflow variable / None | <ListRef/Complex Type name or None> | <Source field -> workflow variable/ListRef field; or None> | <Number workflow variable or None> | 100 default / 1..1000 | 1 default / positive integer | Branch / Assignment assignee / Loop through list items / Invoke Custom Service / Send Email / calculation | <Complete complementary branches or N/A> | export-proven / runtime-proof-required | <Business rationale> |

Workflow Query Data planning rules:

- Use `docs/standards/workflow-query-data-golden-reference-standard.md`; do not serialize a Form Action `querydata` step as a Workflow `QueryData` node.
- Workflow Query Data writes to declared normal workflow variables. Page temp variables are not available in Approval, Data List, or Scheduled workflow execution.
- `multiple_count_only` has no row result variable, Complex Type, or field mapping. It requires a number workflow variable and complete branch coverage such as `count > 0` plus `count <= 0`.
- `single_to_variables` requires explicit source-field to workflow-variable mappings. Query-derived User assignees must map to a declared User workflow variable before Assignment Task use.
- `multiple_to_list_variable` requires a List workflow variable, a linked ListRef/Complex Type definition, and source-field to ListRef-field mappings. A downstream Loop through list items must use this mode.
- `multiple_to_text_variable` is reserved for a proven JSON/text consumer. Do not use it as a substitute for a List variable when the workflow iterates rows.
- Lookup-backed filters must compare source `ListDataID` with the stored Lookup target record identity, never display text.
- Page Size is `1..1000`; omitted means `100`. Page Number is a positive integer; omitted means `1`.
- Export-proven source types are Data List, Document Library, and Form Report. Data Report remains `focused-learning-required` until its dedicated training round.
- A Query Data action supports at most two sort fields. Plan both explicitly when deterministic secondary ordering matters.
- Approval, Data List, and Scheduled workflows share the QueryData result contract. Host-specific current-record expressions still require host-specific export proof.
- `validate-generation-readiness-review.mjs` automatically runs `validate-workflow-query-data-plan.mjs` whenever Workflow Query Data intent is detected.
- Data List Workflow current-record filters must identify the exact source list field and target field. A related-record query commonly compares the target Lookup field to current-record `ListDataID`.

#### Workflow Loop Planning

Required for every Workflow `Loop` node.

| Workflow | Workflow Host Type | Loop Node Name | Loop Mode | Loop Source Parent | Loop Source | Loop Value Expression JSON | LoopBody Actions | Current Iteration / Current Item Use | Delay or Repeated Side Effects | Proof Boundary | Business Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Workflow> | Approval / Data List / Scheduled Workflow | <Business action name> | list / values / number | __variables_ / __list_ / blank for expression | <List variable or Sub List field> | <required for values/number; expression token array> | <Ordered actions inside LoopBody> | <LoopIndex / LoopItem fields / None> | <Email, mutation, Delay, or None> | export-proven / runtime-proof-required | <Why iteration is required> |

Workflow Loop planning rules:

- `list + __variables_` requires a declared List workflow variable linked to a ListRef/Complex Type.
- `list + __list_` is Data List Workflow-only and requires a real Sub List field on the host list.
- `values` requires a non-empty expression-token array that returns multiple values; V1.7 proves a multiple User field.
- `number` requires an expression-token array that resolves to a positive loop count; a fixed number uses a numeric token.
- For `values` and `number`, `Loop Value Expression JSON` is required and is copied exactly into `Loop.properties.loopValue.value`; do not serialize a business label or derive an expression from prose.
- Every mode requires a resolving `bodyRef` and explicit ordered `LoopBody Actions`.
- List current iteration is `LoopIndex`; current row fields use `LoopItem.<field>`. Do not invent field IDs.
- Repeated email, mutation, external calls, and Delay execution are runtime-sensitive even when their serialization is export-proven.
- `validate-generation-readiness-review.mjs` automatically runs the Workflow Loop planning gate whenever Loop intent is detected.

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
- Data List Workflow Set Variable rows must target declared workflow variables only. A current-list field may appear only in the RHS expression. Plan current-record field mutation as Set Data List / `ContentList` with `Current list`, exact field mappings, and business values.
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

Every Type `1` Data List from Section 4 must plan custom forms for New Item, Edit Item, and View Item. Do not plan Yeeflow's built-in default layout for generated Data Lists. Public Forms are additive anonymous-submission surfaces and never replace internal New/Edit/View custom forms. Generated Type `1` Data Lists do not receive a system/support-list exemption from this requirement. Document Library custom forms remain subject to an export-proven Type `16` contract and are not implied by this Data List rule.

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
- Public Forms, hidden/support purposes, or a narrow generation request do not exempt a Type `1` Data List from New/Edit/View custom forms.
- New/Edit forms focus on the current list item and must not plan related Collection/Data Analytics/KPI regions.
- View Item forms may plan current-record display plus related business data, approved Collection templates, approved Data Analytics templates, and KPI regions inside the v1.1 allowed slots. Field-grid and Collection templates may use the `section_content_area` of `content_card_wrapper`, `content_card_60_wrapper`, or `content_card_40_wrapper` depending on the required section width. Workbench View Item forms may use `primary_working_area`, optional `right_side_panel`, and `chart_cards_section`; empty Workbench right panels or chart sections must be pruned.
- App Plan selection is a business/layout decision only. It must not include generated `ListID`, `LayoutID`, action type codes, JSON property paths, placeholder IDs, copied control JSON, or runtime payload fields.

#### Public Forms Plan

Optional and additive. Add rows only for Data Lists that require anonymous submission. Every host Data List must still include the New/Edit/View custom forms planned above.

| Host Data List | Public Form Name | Form Title | Description / Purpose | Included Fields | Public Form Page Layout Template | Public Form Fields Layout Template | Business Sections Needed | CTA Actions | Section Title / Operations | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Data List> | <Public Form> | <Visible title> | <Anonymous submission purpose> | <Field labels or field names> | public-form-page-layout-standard | public_form_fields_1col_v1_1 | 1 column survey fields | None | Business-mapped title; no Operations | Generated-final validation; anonymous runtime submit proof separate |

##### Public Form Form Action Planning

Required whenever a Data List Public Form contains a Form Action. Public Forms use an anonymous, current-list-only action surface and must not reuse the broader Custom Data List Form capability set.

| Host Data List | Public Form | Action Name | Step Order | Step Name | Trigger | Bound Control | Exact Step Type | Step Configuration JSON | Business Rationale | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Data List> | <Public Form> | <Action> | 1 | <Step> | Page Load / Button Click / Field Change / None | <Control or None> | Redirect page to / Show confirm dialog / Submit form / Start another action | <Exact JSON object> | <Reason> | export-proven / runtime-proof-required |

Rules:

- Follow `docs/standards/public-form-form-action-golden-reference-standard.md`.
- Public Form Set variables must use the shared Form Action Set Variable Planning table with `Host Type = Public Form`.
- Only Set variables, Execute custom code, Show confirm dialog, Redirect page to, Submit form, Start another action, Barcode scan, and NFC reader are product-supported.
- Query data, Set data list, Open item form, Open approval form, Open dashboard, Invoke custom service, and all other application-resource steps are forbidden.
- Execute custom code, Barcode scan, and NFC reader remain generated-final blockers until exact decoded Public Form step exports are available.
- Redirect configuration uses `{ "fixedUrl": "https://...", "openType": false }` or `{ "expressionTokens": [...] }`. Tokens may reference only fixed values, current-list fields, or same-form temp variables.
- Confirm configuration uses `{ "messageTokens": [...], "resultTempVariable": "var_Result" }`; Start another action uses `{ "targetActionName": "Other action" }`; Submit uses `{}`.

Rules:

- Public Forms are stored under the host Type `1` Data List `PublicForms[]`; they are not custom Data List forms and must not replace `List.LayoutView.add/edit/view`.
- The host Data List must complete normal field, view, custom New/Edit/View form, workflow, navigation, permission, package, and preflight generation before the Public Form is added.
- Use `public-form-page-layout-standard` and an approved Public Form field-layout template. Survey/questionnaire forms should prefer `public_form_fields_1col_v1_1`.
- Included Fields must resolve to fields on the host Data List and must use Public Form-compatible anonymous controls. User, Department, Metadata, Tag, Multi Meta, Location, Cost center, and Lookup fields are forbidden.
- Public Form generation does not create a reduced Public Form-only Data List package. Full application and standalone Data List generation must remain on the shared builder and validator path.

#### Reverse-Related Collection Selection

Required when a parent/detail lookup relationship should be displayed from the parent record's View Item or Workbench View Item form. This table is the plan-to-package contract that tells generation to add a reverse-related Collection section rather than only defining the lookup field.

| Host Data List | View Item Form | Related Child List | Child Lookup Field | Section Title | Collection Template | Search | Add Record | Default Value |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Parent list> | <Parent View Item form> | <Child list> | <Child lookup FieldName> | <Visible section title> | collection_control_grid_table | <Search fields or No> | <Add button label or No> | `<Child lookup FieldName> = current ListDataID` |

Rules:

- Generate reverse-related sections only for View Item or Workbench View Item forms, not New/Edit forms.
- Use this table when a child list has a lookup to the host list and users need to inspect or create those child records from the host record page.
- The Collection Template must be an approved grid-table Collection template for list-like child records.
- The generated Collection must source the child list and filter the child lookup field to the current host record's `ListDataID`.
- If Search is enabled, the search fields must resolve on the child list and the `search-filter` variable must be consumed by the Collection `fulltext` binding.
- If Add Record is enabled, the Add action must target the child list and pass the current host `ListDataID` into the child lookup field through default `passvalues`.
- Run `scripts/validate-data-list-form-layout-template.mjs --package <generated-final.yapk> --plan <yeeflow-app-plan.md>` before signing. A row in this table must fail generated-final validation if the matching reverse-related section is not materialized in the generated package.

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
- Every Data List workflow `ContentList` node must also appear in the Workflow Set Data List Action Plan with explicit target, mapping, and filter JSON.
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
- `Filter Conditions` are fixed `LayoutView.filter[]` constraints and must be planned separately from interactive `Query/Search Fields` in `LayoutView.query[]`.
- The fixed-filter column may be labeled `Filter Conditions` or `Filters`, but its contents must still be executable field-level conditions.
- If a view's business purpose narrows the dataset, write concrete field-level filters such as `Datetime1 is not empty`, `Text3 is not empty AND Text4 is not empty`, or `Decimal1 is not empty OR Text7 is not empty`; do not leave the fixed filter blank unless the view intentionally shows all records.
- Do not use vague fixed-filter phrases such as `All active meetings`, `lifecycle tracking`, or `active items` without naming the actual field and comparison. Convert them to concrete filters like `Meeting Status = Active` or `Meeting Date is not empty`.
- Any view that references business columns, query/search fields, or fixed filters requires a parseable field table for that Data List. Do not rely on prose such as `Fields: ...`; without a standard field table, generation must fail instead of downgrading the list to a native `Title`-only view.
- When business wording says `Today`, use the export-proven `now` expression in generated Data View filters; do not generate an unsupported `Today` function/token.
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
| <Dashboard> | dashboard-page-layouts-v1.1 / dashboard-page-layouts-workbench / dashboard-page-layouts-two-panel-workspace / dashboard-page-layouts-three-panel-workspace / dashboard-print-multi-record-table-v1 | General overview / operational workbench / master-detail workspace / multi-record print page | <Sections/regions> | Yes/No | Yes/No | <Reason using template guidance> | Generated-final validation |

Rules:

- Select exactly one Dashboard page layout template per Dashboard page from `docs/reference/dashboard-page-layout-templates.json`.
- Use `dashboard-page-layouts-v1.1` for general overview dashboards, report-style dashboards, and section-first pages.
- Use `dashboard-page-layouts-workbench` for operational workbench pages that need a primary working area, optional right-side panel, top filters, KPI cards, grouped analytics, and queue/list regions.
- Use `dashboard-print-multi-record-table-v1` only for a Dashboard selected as a Print page target. It provides one-record-per-Collection-item Table layout, merged row/column support, and a current-Collection-item QR region.
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
- On Workbench Dashboard pages and Workbench Data List View Item forms, chart-like analytics should use `chart_cards_section` under `primary_working_area` or `right_side_panel`; one `chart_cards_section` should contain no more than three chart-like Data Analytics templates.
- Pivot table analytics are table-like regions. Plan `data_analytics_pivot_table_standard` inside `content_card_wrapper > section_content_area`, preferably under `1_columns_section`; use `2_columns_section`, `2_columns_60/40_section`, or `3_columns_section` only for narrow/few-column pivots. Do not plan Pivot tables inside `chart_cards_section`.
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
- The App Plan generator must write this rationale at generation time. It must not emit a row that only names `collection_control_grid_table`, `collection_control_responsive_card_grid`, or another approved template ID without a matching business signal such as dense row/column scanning, card browsing, multiselect/bulk operation, work queue, record list, or primary operations table.
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

### Custom Code and Custom Service Planning

Use this section whenever the application may require client-side Custom Code, Form Action Custom Code, or backend Custom Service. If none are required, include one row marked `Not planned` and do not materialize any custom-code or custom-service resource, action step, workflow action, navigation entry, variable, or placeholder artifact from that row.

#### Custom Capability Decision Matrix

| Requirement / Use Case | Native Yeeflow Capability Considered | Why Native Capability Is Enough or Insufficient | Selected Capability | Host Surface | Planning Status | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- |
| <Business use case> | <Controls/expressions/form action/workflow action/reporting> | <Reason> | None / Custom Code control / Form Action Custom Code step / Custom Service | <Dashboard / approval form / data list form / workflow / scheduled workflow / AI/Copilot future proof> | Planned / Not planned / Deferred / export-learning-required / runtime-proof-required | <Proof required> |

Decision rules:

- Prefer native Yeeflow controls, expressions, Summary/Data Analytics, form actions, workflow actions, and data-list operations when they satisfy the requirement.
- Use a Custom Code control only for client-side UI behavior or immediate client-side calculation that cannot be built with native controls or expressions.
- Use a Form Action Custom Code step only for client-side action logic that must run inside a form action and can be proven with `execute(context, fieldsValues)`.
- Use Custom Service only for backend execution, heavier processing, file processing, server-side Yeeflow SDK operations, or integration with third-party systems through configured connection variables.
- Treat Custom Service invocation as server-side queued execution. Do not use it when the business requirement needs immediate client-side feedback unless the plan includes a user-facing waiting/progress pattern or a Custom Code fallback.
- Do not add Custom Code or Custom Service during materialization unless it is planned in the tables below or explicitly marked as a user-approved runtime-proof-required item.

#### Custom Code Plan

| Custom Code Name | Surface | Host Page/Form/Action | Business Purpose | Inputs / Required Fields | Writable Outputs | Native Fallback Considered | Security / Privacy Notes | Runtime Proof Required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Name> | Custom Code control / Form Action Custom Code step | <Host> | <Purpose> | <Fields/variables/temp variables/parameters> | <Fields/variables/temp variables or None> | <Fallback> | <Notes> | <Proof> |

Custom Code rules:

- Custom Code control scripts must use `render(context, fieldsValues, readonly)` and be hosted as page/form controls.
- Form Action Custom Code step scripts must use `execute(context, fieldsValues)` and be hosted inside `formdef.actions[].steps[]`.
- Do not generate `render(...)`-only code for a Form Action Custom Code step.
- Do not generate `execute(...)`-only code for a Custom Code control.
- Approval form outputs use form/workflow variables. Data list custom form outputs may use data-list fields or temp variables when export-proven. Dashboard outputs use temp variables.

#### Custom Service Plan

| Custom Service Name | Business Purpose | Connection Variables | Input Variables | Output Variables | Backend / Integration Work | Native Fallback Considered | Security / Privacy Notes | Runtime Proof Required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Name> | <Purpose> | <Connection IDs and types, or None> | <Text/Number/Boolean/Date-Time/File/Image/Rich text variables> | <Text/Number/Boolean/Date-Time/File/Image/Rich text variables> | <Yeeflow SDK / external API / file processing> | <Fallback> | <Notes> | <Proof> |

Custom Service rules:

- Custom Service code must use `main({ connections, params, modules })`.
- `DraftConfig` must define `params`, `connections`, and `outputs`; output keys returned by `main` must match configured output IDs.
- Use connection variables for HTTP API/OAuth 2.0 integrations. Do not hardcode credentials, tokens, tenant-specific secrets, or private/internal URLs.
- Use `modules.yeeSDKClient` for Yeeflow backend operations when the SDK shape is proven. Use `modules.fetch(..., { connection })` or the export-proven connection shape for third-party calls.
- Preserve 19-digit Yeeflow IDs as strings.

#### Custom Service Invocation Plan

| Invocation Name | Host Surface | Host Page/Form/Workflow | Service | Input Binding Source | Output Binding Target | Queue / Waiting UX | Follow-up Action | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Name> | Approval form action / Data list form action / Dashboard form action / Approval workflow / Data list workflow / Scheduled workflow / AI Agent or Copilot future proof | <Host> | <Service> | <Variables/list fields/temp variables/static values> | <Variables/temp variables/workflow variables/list update via follow-up> | <Expected wait behavior> | <Set Data List / refresh / notification / none> | <Proof> |

Invocation binding rules:

- Form action invocation uses `type: "invokeservice"`.
- Workflow invocation uses `stencil.id = "InvokeCode"`.
- Approval form action input/output bindings use `__variables_`.
- Custom data list form action inputs may use `__list_` for data-list fields or `__temp_` for temp variables; outputs use `__temp_` unless a focused export proves another target.
- Dashboard form action inputs and outputs use `__temp_`.
- Data list workflow invocation may bind current item fields with `exprType: "list_field"` and should write returned external IDs to workflow variables before a downstream Set Data List / `ContentList` action updates the current item.
- Scheduled workflow and task-form invocation must follow the same export-proven workflow/task-form rules or be marked `runtime-proof-required`.

#### Custom Capability Proof and Runtime Validation Plan

| Capability | Local Validation | Package Validation | Runtime Proof | Failure Handling / Fallback |
| --- | --- | --- | --- | --- |
| <Custom Code / Custom Service / invocation> | <Script lint/shape checks> | <Generated package placement/binding checks> | <User interaction/workflow run/service response proof> | <Fallback> |

Proof rules:

- Package schema/signing/install success does not prove Custom Code execution or Custom Service execution.
- Runtime proof must show parameter binding, output writing, error handling, and any downstream refresh/update behavior.
- Unknown AI Agent/Copilot invocation of Custom Service remains future-proof-required until a focused export/runtime proof exists.

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
