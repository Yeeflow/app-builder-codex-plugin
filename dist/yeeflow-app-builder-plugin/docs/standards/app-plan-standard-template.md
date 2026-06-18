# <Application Name> - Yeeflow App Plan

Use this template as Step 2 for every Yeeflow application build. This plan must be created from the approved Functional Specification. Its purpose is to convert business requirements into Yeeflow-standard resources and define the correct generation order.

This document is the implementation contract for package generation after user approval. It must use only Yeeflow resource types, field types, variable types, controls, workflow nodes, form actions, and configuration shapes supported by the active `@yeeflow-app-builder` plugin knowledge base, skills, standards, validators, template library, or export-proven references.

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
| Data management | <Requirement> | Data list / Document library | <Name> | Yes/No | <Notes> |
| Approval/review | <Requirement> | Approval form | <Name> | Yes/No | <Notes> |
| Approval output | <Requirement> | Form report | <Name> | Yes/No | Must be based on a specific Approval form |
| List browsing | <Requirement> | Data List view | <Name> | Yes/No | Must belong to a specific Data list or Document library |
| Dashboard/workbench | <Requirement> | Dashboard page | <Name> | Yes/No | Page-level UI resource, not a Form report |
| Automation | <Requirement> | Data-list workflow / Schedule workflow / Form action | <Name> | Yes/No | <Notes> |
| AI | <Requirement> | AI Agent / Copilot / AI Assistant node | <Name> | Yes/No | <Notes> |

Rules:

- Every core business requirement must map to a Yeeflow resource, a supported configuration, or an explicitly deferred item.
- Form report is a standalone Yeeflow resource type created from a specific Approval form. Do not merge Form report planning with Dashboard page planning or Data List view planning.
- Do not include resources only to make the plan look complete. Every generated resource must serve a runtime purpose.
- Do not invent unsupported controls, field types, workflow node types, variable types, or action shapes.

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

- Resource type: Data list / Document library
- Description:
- Business purpose:
- Master/transaction/reference:
- Creation order:
- Depends on:
- Used by:
- Navigation visibility:
- Sample/reference data required: Yes/No

#### Fields

| Field Order | Display Name | Internal ID / Field Key | Yeeflow Field Type | Required | Unique | Default Value | Placeholder | Validation Rules | Choice Values | Lookup Target | Lookup Display Field | Additional Lookup Fields | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Title | Title | Title/Text | Yes | No | | <Placeholder text> | | | | | | Native title field |

Field rules:

- Field types must follow active plugin Data List / Document Library field standards.
- Keep the native `Title` field unless the plugin standard explicitly allows otherwise.
- Choice fields must define runtime-visible choices using the supported schema.
- Lookup fields must identify target list, display field, and additional fields when needed.
- User/person fields must use supported User field shapes.
- Date fields must use supported Date/DateTime types.
- Currency/number fields must use supported numeric field types.
- Multiline notes, descriptions, and justifications must use supported multiline text fields.
- Barcode, serial number, asset tag, and external code values should use text unless a supported barcode-specific field is required.
- Placeholder text should be defined for user-entered fields where supported by the target field/control.

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

| Field Order | Field Name | Field ID / Variable ID | Variable Type / Control Type | Binding | Read Only | Required | Default Value | Placeholder | Dynamic Display | Custom Validation | Lookup Target | Lookup Display Field | Additional Lookup Fields | Sublist/Summary Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Field> | <ID> | <Type> | <Binding> | Yes/No | Yes/No | <Default> | <Placeholder text> | <Rule> | <Rule> | <List> | <Field> | <Fields> | <Notes> | <Description> |

Submission form rules:

- Variable and control types must follow active plugin Approval Form standards.
- Lookup fields must identify target list, display field, and additional fields.
- Sublist fields must define row fields, summary fields, and any summary-to-form-field bindings.
- Default values, dynamic display rules, read-only state, and validations must be explicit.
- Placeholder text must be planned for editable fields where supported.

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

| Field Order | Field Name | Field ID / Variable ID | Variable Type / Control Type | Binding | Read Only | Required | Default Value | Placeholder | Dynamic Display | Custom Validation | Lookup Target | Lookup Display Field | Additional Lookup Fields | Sublist/Summary Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Field> | <ID> | <Type> | <Binding> | Yes/No | Yes/No | <Default> | <Placeholder text> | <Rule> | <Rule> | <List> | <Field> | <Fields> | <Notes> | <Description> |

#### Form Actions and Temp Variables

| Action Name | Host Form | Trigger Location | Trigger Type | Temp Variables | Steps | Data Read | Data Write | Bound Controls | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Action> | Submission / Task / Other | Page Load / Field Change / Submission / Button | <Type> | <Variables> | <Steps> | <Data> | <Data> | <Controls> | <Notes> |

Rules:

- State exactly which form hosts each form action.
- State where the action is triggered.
- Temp variables are frontend-only.
- Query data and Set data list actions must identify target application/list/fields.

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

Rules:

- Schedule configuration must use properties supported by the plugin's Schedule workflow documentation.
- Each node must include type, order, configuration, branch conditions, and data read/write behavior.

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

### 10.x <Data List or Document Library Name>

| Form Name | Form Type | Purpose | Used By | Layout Pattern | Actions Required | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| <Form> | New/Edit/View/Detail/Custom/Print | <Purpose> | <Users/pages> | <Layout> | Yes/No | <Notes> |

#### Form Fields

| Form Name | Field Order | Field Name | Field ID | Field Type / Control Type | Binding | Read Only | Required | Default Value | Placeholder | Dynamic Display | Custom Validation | Lookup Target | Lookup Display Field | Additional Lookup Fields | Sublist/Summary Notes | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Form> | 1 | <Field> | <ID> | <Type> | <Binding> | Yes/No | Yes/No | <Default> | <Placeholder text> | <Rule> | <Rule> | <List> | <Field> | <Fields> | <Notes> | <Description> |

#### Custom Form Actions and Temp Variables

| Action Name | Host Form | Trigger Location | Trigger Type | Temp Variables | Steps | Data Read | Data Write | Bound Controls | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Action> | <Form> | Page Load / Field Change / Submission / Button | <Type> | <Variables> | <Steps> | <Data> | <Data> | <Controls> | <Notes> |

Rules:

- Every list that users create or edit records in should have a runtime-safe Add/New form plan.
- Query data and Set data list actions must identify target application/list/fields.
- Data List custom form root padding must follow the active plugin standard.

## 11. Data List Workflows Plan

Return to the Data lists and Document libraries from Section 4 and plan list workflows.

| Workflow Name | Host List/Library | Trigger Condition | Nodes in Order | Branches | Branch Conditions | Data Read/Write | Notifications/AI/External Calls | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Workflow> | <List> | <Trigger> | <Nodes> | <Branches> | <Conditions> | <Data> | <Calls> | <Proof> | <Notes> |

Rules:

- Node types must come from active plugin workflow-node documentation or export-proven references.
- Runtime execution proof is separate from package validation.

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
- Description:
- Business purpose:
- Layout pattern:
- Navigation placement:
- Depends on:
- Temp variables required:
- Page/form actions required:
- Runtime proof required:

#### Sections and Controls

| Section Order | Section Name | Purpose | Yeeflow Controls | Data Source | Fields Displayed | Filters | Actions | Control Relationships | Style/Layout Notes | Proof Level |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Section> | <Purpose> | <Controls> | <List/form> | <Fields> | <Filters> | <Actions> | <Relationships> | <Notes> | <Proof> |

Rules:

- Controls must come from active plugin control knowledge, template library, or export-proven references.
- Summary/KPI cards must be data-bound where supported and must not be static text unless explicitly marked fallback.
- Collection, Kanban, Timeline, Data Filter, Data table, Summary, chart, action button, and dynamic controls must include source, field, and action bindings.
- Grid-table Collection pattern requires header `flex_grid` plus Collection wrapped together with zero gap.
- Dashboard root padding and header hiding must follow active plugin hard gates.
- Every visible control in a design-backed page must map to a Yeeflow control and style contract before generation.

## 15. Application Navigation Plan

| Navigation Order | Group | Item | Yeeflow Resource Type | Target Resource | Visible | Icon | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | <Group> | <Item> | Data list / Dashboard / Approval form / Report | <Resource> | Yes/No | <Icon> | <Notes> |

Runtime navigation rules:

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
- If a requirement depends on an unknown capability, mark it as export-learning-required, runtime-proof-required, or deferred.
- Do not plan invented control shapes, field types, variable types, workflow nodes, or action schemas.

## 18. Generation Contract and Hard Gates

### Output Package

- Default output: `.yapk`
- `.yap` only if explicitly requested
- Package generation expected in this task: Yes/No
- Planning-only task: Yes/No

### Required Gates

| Gate | Required | Pass Criteria | Blocks Generation/Signing/Install |
| --- | --- | --- | --- |
| Functional spec approved | Yes | Approved or defaults approved | Generation |
| App Plan approved | Yes | Approved by user | Generation |
| Plugin capability compliance | Yes | No unsupported invented resource/control/action shape | Generation |
| Schema validation | Yes | Package schema passes | Signing |
| API-issued ID provenance | For generated-final `.yapk` | All generated IDs API-issued and reported | Signing/install |
| Upgrade ID stability | For upgrades | Existing semantic IDs preserved | Upgrade |
| Approval form gate | If approval required | Forms, task pages, workflow, DefResource present | Signing/install |
| Navigation runtime gate | Yes | Runtime navigation metadata valid | Signing/install |
| Dashboard grid-table Collection gate | If planned | Header + Collection wrapper and detail links valid | Signing/install |
| Root padding gate | For dashboards/custom forms | Token-array root padding valid | Signing/install |
| Plan-to-package conformance | Yes | Planned resources implemented or explicitly deferred | Handoff |
| Advanced capability gate | If planned | AI Agents, Copilots, custom code, custom CSS, integrations, notifications, schedule workflows, and external execution are plugin-supported, export-proven, runtime-proof-required, or deferred | Generation/handoff |

### Advanced Capability Gate

- AI Agents, Copilots, custom code, custom CSS, integrations, notifications, schedule workflows, external calls, and advanced controls must cite plugin-known skills, standards, validators, template library entries, or export-proven references before generation.
- Unknown or partially proven advanced capabilities must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`.
- Do not invent unsupported control, resource, action, workflow-node, schedule, AI, Copilot, custom-code, notification, or integration shapes.
- Runtime execution proof for AI, notifications, schedule workflows, external integrations, custom code, and permission enforcement is separate from package generation, signing, install/import/upgrade acceptance, and browser render proof.

## 19. Validation Plan

| Validation Layer | Scope | Tool/Method | Expected Result | Proof Boundary |
| --- | --- | --- | --- | --- |
| App-plan conformance | Resources vs plan | <Validator/manual> | pass/fail | Local proof |
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

`Use @yeeflow-app-builder to generate <Application Name> from <app plan path>. Treat the approved Functional Specification and App Plan as the implementation contract. Generate the complete planned application unless an item is explicitly deferred. Use .yapk by default unless .yap is explicitly requested. Follow the resource generation order in the App Plan. Use only plugin-supported Yeeflow resource types, field types, variable types, controls, workflow nodes, form actions, and configuration shapes. Validate schema, ID provenance, navigation runtime metadata, approval forms, form reports, schedule workflows, AI/Copilot resources, custom data list forms, data-list workflows, notifications, views, dashboard controls, grid-table Collection patterns, root padding, graph, UI quality, app-plan conformance, package wrapper/signing readiness, and source/dist consistency. Do not run live Yeeflow API calls, write operations, install/import/upgrade, or runtime tests unless explicitly authorized. Report local validation, signing status, API acceptance, runtime proof, deferred items, and known risks separately.`
