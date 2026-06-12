# <Application Name> - Yeeflow Application Plan

Use this template for every full Yeeflow application creation plan unless the user explicitly requests a lightweight plan. A lightweight plan is allowed only when the user explicitly asks for a quick outline. It must still include a minimum contract: Data Model and Lists, Forms and Approval Forms, Application Navigation, UI/UX and Control Mapping, Generation Contract and Hard Gates, Proof Boundary, and Assumptions/Deferred Items.

Reference style: `northpeak-resource-operations-plan.md` is a good example because it uses numbered sections, concrete data models, UI/control mapping, validation boundaries, deferred items, and a ready next prompt. Do not copy its business-specific resource operations content into unrelated plans.

## 1. Plan Status

- Planning plugin:
- Source artifacts:
- Current phase:
- Package target:
- Generation status:
- Approval status:
- Known blockers:

## 2. Application Purpose

- Business goal:
- What the app manages:
- What successful runtime experience should feel like:
- What is out of scope:

## 3. Target Users and Roles

| Role | Purpose | Main Permissions | Implementation Notes |
| --- | --- | --- | --- |
| <Role> | <Why this role uses the app> | <View/create/edit/admin scope> | <Real users/groups, placeholders, or post-import mapping> |

Implementation notes:

- Do not embed real users, groups, emails, departments, positions, or tenant-specific IDs unless explicitly provided and approved.
- Use role fields, empty app groups, current-user expressions, or post-import configuration when real membership is not safely available.

## 4. Business Process Overview

1. <Start of process>
2. <Data entry or request step>
3. <Review, approval, routing, or operational action>
4. <Status/data update caused by the step>
5. <Reporting, audit, or closure step>

Status lifecycle:

- <Draft> -> <Submitted> -> <Under Review> -> <Approved/Rejected> -> <Completed/Cancelled>

Approval/decision points:

- <Decision point and owner>

Data updates caused by process steps:

- <Step> updates <list/fields/statuses>.

## 5. Capability Coverage Plan

| Capability | Required | Planned Implementation | Proof Level | Notes |
| --- | --- | --- | --- | --- |
| Data lists | Yes/No | <Lists and relationships> | proven/export-proven/partially proven/deferred | <Notes> |
| Approval forms | Yes/No | <Approval form or deferred status> | proven/export-proven/partially proven/deferred | <Notes> |
| Dashboards/pages | Yes/No | <Dashboard/page set> | proven/export-proven/partially proven/deferred | <Notes> |
| Custom forms | Yes/No | <New/Edit/View/custom forms> | proven/export-proven/partially proven/deferred | <Notes> |
| Data list views | Yes/No | <Default, filtered, grouped, calendar/kanban/gallery, or deferred views> | proven/export-proven/partially proven/deferred | <Notes> |
| Data-list workflows | Yes/No | <Create/update/manual triggers, task flows, row updates, or deferred> | proven/export-proven/partially proven/deferred | <Notes> |
| Scheduled workflows | Yes/No | <Schedule, query scope, actions, or deferred> | proven/export-proven/partially proven/deferred | <Notes> |
| Notifications | Yes/No | <List reminders, workflow email, assignment notices, or deferred> | proven/export-proven/partially proven/deferred | <Delivery requires runtime proof> |
| Print pages | Yes/No | <Print pages and reachability> | proven/export-proven/partially proven/deferred | <Notes> |
| Document libraries/attachments | Yes/No | <Libraries, attachment fields, image fields> | proven/export-proven/partially proven/deferred | <Notes> |
| Workflows/actions | Yes/No | <Status changes, form actions, workflow steps> | proven/export-proven/partially proven/deferred | <Notes> |
| AI agents/copilots | Yes/No | <Agents, copilots, tools, or deferred> | proven/export-proven/partially proven/deferred | <Notes> |
| Custom code/control | Yes/No | <Custom code control, custom CSS, native fallback, or deferred> | proven/export-proven/partially proven/deferred | <Use only when native controls are insufficient> |
| Golden functions/references | Yes/No | <Reference exports, function refs, template IDs> | proven/export-proven/partially proven/deferred | <Notes> |
| Integrations | Yes/No | <Connections/API records/post-import setup> | proven/export-proven/partially proven/deferred | <Notes> |
| Permissions | Yes/No | <Roles, app groups, permission matrix> | proven/export-proven/partially proven/deferred | <Notes> |
| Navigation | Yes/No | <Groups and entries> | proven/export-proven/partially proven/deferred | <Notes> |
| Reports | Yes/No | <Dashboards, Form Reports, list views, analytics> | proven/export-proven/partially proven/deferred | <Notes> |
| Sample data | Yes/No | <Seed rows and dependency order> | proven/export-proven/partially proven/deferred | <Notes> |

## 6. Application Navigation

| Navigation Group | Entry | Yeeflow Resource Type | Target Resource | Visible/Hidden/Deferred | Notes |
| --- | --- | --- | --- | --- | --- |
| <Group> | <Page/List/Form> | Dashboard/Data List/Approval Form/Form Report | <Target> | Visible | <Notes> |

Runtime navigation contract:

- Group node: `Type: "classes"` with `list`
- Dashboard/page: `Type: 103`
- Approval form: `Type: 105`, `ListID = Forms[].Key`
- Data list: `Type: 1`, `ListID = child list ID`
- Never use `children` for runtime grouped navigation

Reachability rule:

- Every intended page/list/form must be visible in navigation or explicitly marked hidden/deferred with a reason.

## 7. Data Model and Lists

Repeat this subsection for each list.

### 7.x <List Name>

Purpose:

- <Why the list exists>

| Field Name | Display Name | Type | Required | IsUnique | Placeholder | Example/Values | Description | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Title | Title | Text | Yes | No | <Primary label> | <Primary label> | Native primary label for the record. | Retain native `Title`; do not replace with generated `Text0`. |
| <FieldName> | <Display Name> | <Yeeflow/user-facing type> | Yes/No | Yes/No | <Placeholder/help text> | <Choices/examples> | <Business purpose and usage> | <Rules, lookup display fields, validation, or storage notes> |

Field planning rules:

- Use stable internal `Field Name` values and human-readable `Display Name` values.
- Include placeholder/help text for fields users will edit.
- Include business descriptions so generator choices are not based only on labels.
- For choice fields, list the available options in `Example/Values` or `Notes`.
- For user, department, location, lookup, attachment, image, currency, date/date-time, and calculated/status fields, state the runtime proof level or deferred fallback where relevant.

Default display columns:

- <Title/name>
- <Status>
- <Owner/date/amount/progress>

Required views:

- <Default view>
- <Operational or filtered view>

| View | View Type | Default | Columns/Fields | Filters/Sort/Grouping | Runtime Proof |
| --- | --- | --- | --- | --- | --- |
| <View> | Grid/Kanban/Calendar/Gallery/Timeline/Deferred | Yes/No | <Columns or card fields> | <Filter, sort, group rules> | proven/export-proven/partially proven/deferred |

Custom list forms and public forms:

| Form | Purpose | Sections | Actions | Validation | Proof Level |
| --- | --- | --- | --- | --- | --- |
| <New/Edit/View/Public/Print form> | <Goal> | <Sections/controls> | <Buttons/actions> | <Required/read-only/rules> | proven/export-proven/partially proven/deferred |

Custom list form field design:

| Form | Section | Field ID | Display Name | Type | Binding | Required | Read Only | Default Value | Auto Fill / Source | Custom Validation | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <New/Edit/View/Public/Print form> | <Section> | <field_id> | <Display Name> | <control type> | <list field/temp var> | Yes/No | Yes/No/Conditional | <Static/expression/current user/none> | <Lookup addition/current user/department/workflow/list value/none> | <Range/cross-field/duplicate/status/none> | <User-facing purpose> |

Custom list form field rules:

- Each editable custom data-list form must state read-only behavior, default value behavior, and autofill/source behavior for every planned control.
- View and print forms should mark display-only controls as read-only and hide or defer edit/add/delete actions unless intentionally interactive.
- Defaults and autofill rules must name their source: static value, expression, current user, requester/applicant context, lookup addition, department/location/user metadata, workflow/list value, or deferred runtime configuration.
- Special custom validation must state the rule, trigger, error message, proof level, and implementation approach: native required rule, field rule, expression, form action, workflow action, lookup filter, duplicate check, or Custom code control.
- Common custom validation examples include date range order, amount/range limits, required-if rules, status-transition guards, duplicate asset/tag/serial checks, lookup eligibility filters, attachment-required-by-category rules, and workflow-routing prerequisites.

Lookup dependencies:

- <Source list> depends on <target list/display field>.

List workflows and notifications:

| Trigger/Event | Workflow or Notification | Actions/Recipients | Runtime-Sensitive Parts | Proof Level |
| --- | --- | --- | --- | --- |
| <New item/update/manual/date/schedule> | <Workflow/reminder/email> | <Row updates, tasks, QueryData, AI, MailTask, recipients> | <Delivery, row mutation, external call, AI call> | proven/export-proven/partially proven/deferred |

Seed/sample rows:

- <Dependency-ordered sample row notes>

Validation rules:

- Retain native `Title`.
- Do not replace the primary field with generated `Text0`.
- Choice fields use runtime-visible `Rules.choices`.
- Lookup fields include selected display fields.
- Sample data loads in dependency order.
- Views, custom list forms, list workflows, and notifications are planned or explicitly deferred.
- Notification configuration proof is separate from delivery proof.

## 8. Forms and Approval Forms

Normal forms:

### 8.x <Normal Form Name>

- Purpose:
- Sections:
- Fields:
- Actions:
- Validation:

Normal form section template:

#### SECTION: <Section Name>

- Purpose:
- Layout: default/1-column/2-column/3-column/custom

| Field ID | Display Name | Type | Binding | Required | Read Only | Default Value | Auto Fill / Source | Custom Validation | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <field_id> | <Display Name> | <control type> | <list field/variable/temp var> | Yes/No | Yes/No/Conditional | <Static/expression/current user/none> | <Lookup addition/current user/department/workflow/list value/none> | <Range/cross-field/duplicate/status/none> | <User-facing purpose> |

Approval forms:

### 8.y <Approval Form Name>

- Approval form name:
- Request page:
- Task pages:
- Approval statuses:
- Workflow steps:
- Workflow control panel required: Yes/No
- Workflow history required: Yes/No
- DefResource required: Yes/No
- If deferred, mark app as staged/incomplete and require user approval: Yes/No

Approval form section template:

#### SECTION: <Section Name>

- Purpose:
- Layout: default/1-column/2-column/3-column/custom

| Field ID | Display Name | Type | Binding | Required | Read Only | Default Value | Auto Fill / Source | Custom Validation | Description |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <field_id> | <Display Name> | <radio/daterange/switch/textarea/file-upload/identity-picker/dynamic-field/etc.> | <workflow variable/list field/output target> | Yes/No | Yes/No/Conditional | <Static/expression/current user/none> | <Requester profile/lookup addition/user attribute/workflow value/none> | <Range/cross-field/required-if/routing/none> | <User-facing purpose> |

Workflow node table:

| Step Name | Type | Description | Email Enabled | Task/Decision Settings | Transition Rules |
| --- | --- | --- | --- | --- | --- |
| Start Event | StartNoneEvent | <How the workflow starts> | true/false | <Submit settings> | <Next step on submission> |
| <Approval Task> | MultiAssignmentTask | <Who reviews and what they decide> | true/false | <Task type, assignment, quick completion, due date/reminders> | <Approved/Rejected/other transitions> |
| End Event | EndNoneEvent | <Successful completion> | true/false | <End behavior> | N/A |
| End with Rejection | EndRejectEvent | <Rejected completion> | true/false | <End behavior> | N/A |

Approval planning rules:

- Each section must list layout and controls, not just form names.
- Each control must state Field ID, Display Name, Type, Binding, Required, Read Only, Default Value, Auto Fill / Source, Custom Validation, and Description.
- Read-only, default value, and autofill rules must be explicit for applicant/profile fields, requester context, manager/department/location fields, lookup additions, calculated summaries, and task-only review fields.
- Special custom validation must state rule, trigger, user-facing error message, implementation approach, and proof level.
- Approval validation examples include leave period start before end, total days greater than zero, attachment required for specific leave types, delegate different from requester, manager/department autofill required before submit, balance/quota checks, and routing variables required before task assignment.
- Workflow nodes must list Step Name, Yeeflow node Type, email behavior, task/decision settings, and transition rules.
- Applicant/profile sections can use a compact Field ID + Display Name table only when controls are read-only profile context.

Hard rule:

- If the plan requires approval, the generated package must not silently ship with `Forms: []`.

## 9. Dashboards, Pages, and Reports

Repeat this subsection for each page or dashboard.

### 9.x <Page or Dashboard Name>

- User goal:
- Layout pattern:
- Golden/template reference:
- Sections:
- Yeeflow controls:
- Data bindings:
- Actions:
- Responsive behavior:
- Quality checks:

Layout rules:

- Dashboard summary layout for KPI-first pages.
- 2-column layout for list/detail or main/support pages.
- 3-column workspace layout for inbox, triage, queue, CRM, renewal, resource, or service-desk workspaces.
- 4-column layout only when justified by distinct navigation/filter, queue/list, detail, and action/attribute regions.
- Mobile/tablet fallback must be stated for every dense or multi-column page.

## 10. UI/UX and Control Mapping

| Page/Form | User Goal | Layout Pattern | Golden/Template Reference | Yeeflow Controls | Data Bindings | Actions | Styling / Quality Checks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Page/Form> | <Goal> | <Pattern> | <templateId/export/function ref> | <Controls> | <Lists/fields> | <Actions> | <Spacing, columns, item templates, bindings, responsive checks> |

Hard rule:

- Plans must map modern web-app UI patterns to Yeeflow controls. Do not plan only raw lists unless the app is intentionally simple and the user approved that scope.
- If a requirement needs custom CSS or Custom code control, document why native controls are insufficient, the inputs/outputs, configuration parameters, maintenance owner, runtime test plan, and native fallback/deferred behavior.

## 11. Golden Template and Reference Strategy

- Reference templates/golden exports to use:
- Export-proven controls:
- Advanced controls that are partially proven:
- Controls or patterns to defer if no safe reference exists:
- Rule: do not invent unproven runtime shapes.

| Area | Required Function/Page/Layout | Golden Reference or Template ID | Proof Level | Validator/Check | Fallback or Deferred Rule |
| --- | --- | --- | --- | --- | --- |
| <Dashboard/list form/workflow/custom code/AI/report> | <Required pattern> | <Export, templateId, normalized reference, or docs path> | proven/export-proven/partially proven/deferred | <Script/manual check> | <Native fallback, staged build, or defer reason> |

Reference rules:

- Page and section layouts should reference the UI section template library when available.
- Workflow, expression, AI Agent, Copilot, notification, data-view, and custom code features should cite their relevant export-proven or documented reference before generation.
- Advanced controls without an export-proven or product-documented shape must be deferred or explicitly marked runtime-proof-required.

## 12. Actions and Workflow Logic

- Safe generated actions:
- Status transitions:
- Approval decisions:
- Automation rules:
- Data-list workflows:
- Scheduled workflows:
- Workflow triggers:
- Notification rules:
- AI Agent/Copilot workflow actions:
- External/API/email actions:
- Deferred actions:
- Runtime-proof requirements for advanced/bulk actions:

Workflow planning rules:

- Separate approval workflows, data-list workflows, scheduled workflows, and page/form actions.
- For each workflow, state trigger, host resource, steps, variables, data reads/writes, notifications, AI calls, external calls, and stop/defer conditions.
- QueryData, AI Assistant, MailTask/send email, HTTP/API, row update, bulk action, and scheduled execution require explicit proof level and runtime boundary.
- Notification configuration can be export-proven, but delivery proof must be reported separately.

## 13. Permissions

| Role | Resource/Page/Form | View | Create | Edit | Delete/Archive | Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Role> | <Resource> | Yes/No | Yes/No | Yes/No | Yes/No | Yes/No | <Notes> |

Real user/group assignment policy:

- <Use placeholders, empty groups, requester/current-user expressions, or post-import setup unless real IDs are approved.>

Post-import configuration notes:

- <Manual permission assignments or tenant-specific settings.>

## 14. Integrations and External Services

| Integration | Purpose | Live Integration Status | Package Behavior | Credential Handling |
| --- | --- | --- | --- | --- |
| <Integration> | <Purpose> | Planned/Deferred/Configured post-import | <Record/config only, no execution, etc.> | Never embed tenant URLs, API keys, webhook secrets, or private endpoints. |

Credential rule:

- Never embed tenant URLs, API keys, webhook secrets, or private endpoints.
- External connections, OAuth records, webhook destinations, API base URLs, and tenant-specific private endpoints must be configured post-import unless explicitly approved for a safe test tenant.

### 14.x AI Agents, Copilots, and Knowledge Resources

| Resource | Type | Purpose | Inputs/Outputs | Tools/Knowledge | App Resource Access | Human Review | Proof Level |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Agent/Copilot/Knowledge> | AI Agent/Copilot/Knowledge | <Goal> | <Variables/files/images> | <Local resources, connected Agent, connection, knowledge> | <Read/create/update scope> | Required/Not required | proven/export-proven/partially proven/deferred |

AI planning rules:

- Decide whether AI Agent, Copilot, knowledge, connected-Agent tools, local application resource access, file/image input, or workflow AI Assistant actions are required.
- Document prompt/instruction purpose, allowed data access, create/update/read behavior, human-review boundaries, and runtime proof requirements.
- Do not embed connection secrets or claim live AI/tool execution without focused runtime proof.

### 14.y Custom Code, Custom CSS, and Advanced Components

| Component | Host Page/Form | Requirement | Native Alternative Considered | Inputs/Outputs | Configuration | Runtime Test | Fallback |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Custom code/control/CSS> | <Surface> | <Why needed> | <Standard control/custom CSS/expression/action fallback> | <Params/events/results> | <Admin-editable settings> | <Browser/runtime check> | <Native/deferred fallback> |

Custom code rules:

- Prefer standard Yeeflow controls, expressions, workflow actions, and custom CSS before Custom code control.
- Custom code must be planned with configuration, parameter wiring, expected outputs, security/privacy notes, maintainability notes, and runtime validation.
- If custom code is deferred, identify the native fallback and user-visible limitation.

## 15. Document Libraries and Attachments

- Required document libraries:
- Attachment/image fields:
- Document views and custom forms:
- Dashboard/form document controls:
- Folder rules and upload behavior:
- Deferred document management items:

## 16. Reports and Analytics

| KPI/Report | Data Source | Output Type | Required | Proof Level | Notes |
| --- | --- | --- | --- | --- | --- |
| <KPI/report> | <List/report/form> | Dashboard/List view/Grouped table/Chart/Form Report/Deferred | Yes/No | proven/export-proven/partially proven/deferred | <Notes> |

## 17. Data Validation Checklist

- Fields are defined with storage type and UI/control type where relevant.
- Choices use runtime-visible `Rules.choices`.
- Lookups resolve and include selected display fields.
- Default views include meaningful display columns.
- Sample data exists where useful and loads in dependency order.
- Required fields are marked and appear on relevant forms.
- Required views, custom forms, public forms, and print pages are documented.
- List workflows, scheduled workflows, notifications, and form actions have trigger/action/proof notes.
- AI Agent/Copilot access scopes and knowledge/tool dependencies are documented or deferred.
- Custom code/custom CSS dependencies have native fallback and runtime proof notes.
- Formulas/statuses are modeled only where supported or explicitly deferred.
- Dependency order is documented for lookup/sample rows.

## 18. Generation Contract and Hard Gates

### Output Package

- Default output: `.yapk`
- `.yap` only if explicitly requested
- Package generation expected in this task: Yes/No
- Planning-only task: Yes/No
- Package handoff requires API signing when credentials are available

### YAPK Signing Gate

- Required endpoints:
  - `POST /utils/apppackage/setsign`
  - `POST /utils/apppackage/verifysign`
- Placeholder `Sign` is not upload-ready
- Signature verification must pass before handoff
- Local schema validation is not upload readiness
- Signing/install acceptance does not prove ID provenance or navigation runtime metadata completeness

### API-Issued Content ID Provenance Gate

- Generated-final `.yapk` packages must allocate numeric generated app content IDs through `GET /utils/generate/ids?count=<n>`
- Local sequential counters, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds are forbidden
- Required artifact: `dist/<app-name>-id-provenance-report.json`
- Required source marker: `api-generated`
- Required report contents: total requested IDs, total received IDs, allocation count, unused count, duplicate check, path-to-purpose mapping, source marker, and empty non-API ID list
- Missing or failed ID provenance validation stops generation before signing, install, upgrade-check, or handoff

### Approval Form Gate

- Approval required: Yes/No
- Approval form generated: Yes/No/Deferred
- `Forms: []` allowed only if approval is not required or user-approved staged build
- Missing required approval form is a generation failure

### Navigation Runtime Gate

- Group shape: `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list`
- Group `ID` must be API-issued and present in the ID provenance manifest
- Group `AppID` must equal the package/root AppID
- Group `ListSetID` must equal the current root `ListSet.ListID`
- No `children` or `Childs` runtime groups
- Every child item includes `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`
- Resource type mapping:
  - page/dashboard `Type: 103`, `LayoutID`, and `ListID = LayoutID`
  - approval form `Type: 105`, `ListID = Forms[].Key`
  - data list `Type: 1`, `ListID = Childs[].List.ListID`
- Unreachable intended resources are failures unless documented hidden/deferred
- Missing or failed navigation runtime metadata validation stops generation before signing, install, upgrade-check, or handoff

### Plan-to-Package Conformance Gate

Generator must prove:

- planned lists exist
- planned fields exist
- planned forms exist
- planned approval forms/task pages exist if required
- planned dashboards/pages exist
- planned reports exist
- planned navigation exists
- planned actions/workflows implemented or deferred
- planned data-list views, custom list forms, public forms, and notifications implemented or deferred
- planned scheduled workflows implemented or deferred
- planned AI Agents, Copilots, knowledge resources, custom code, and custom CSS implemented or deferred
- planned permissions/integrations implemented or deferred

### Advanced Capability Gate

- Custom code/control usage must match the plan, include native fallback/deferred notes, and require runtime proof before claiming behavior works.
- Scheduled workflows, list workflows, notifications, AI Agent/Copilot actions, external/API/email actions, and row mutations must not be promoted from package-valid to runtime-proven without focused proof.
- Golden/template references used by the plan must be cited in the generation report, and omitted planned references must be reported as deferred.

## 19. Generation Validation Plan

- Schema validation:
- ID provenance validation:
- Navigation runtime metadata validation:
- Graph validation:
- UI quality validation:
- App-plan conformance validation:
- Navigation validation:
- Data-list views/forms/workflows/notifications validation:
- Approval-form validation:
- Scheduled workflow validation:
- AI Agent/Copilot validation:
- Custom code/custom CSS validation:
- Golden/template conformance validation:
- Signing validation:
- Signature verification:
- API install/import acceptance:
- Runtime UI proof:
- Package wrapper validation:
- Source/dist consistency validation:
- Deferred items:
- Known risks:

## 20. Proof Boundary

Separate these proof levels:

- Plan approval:
- Local generation validation:
- Package schema validation:
- ID provenance proof: pending / passed / failed
- Navigation runtime metadata proof: pending / passed / failed
- Evidence: ID allocation manifest and validator results
- Signing proof:
- API install/import acceptance:
- Runtime materialization/render proof:
- Workflow execution proof:
- Scheduled workflow execution proof:
- Notification delivery proof:
- AI Agent/Copilot execution proof:
- Custom code execution proof:
- External integration execution proof:
- Permission enforcement proof:
- Boundary: signing/install acceptance do not prove ID provenance or navigation runtime metadata completeness

## 21. Assumptions

- Business assumptions:
- Data assumptions:
- Role/user assumptions:
- UI/control assumptions:
- Package/output assumptions:

## 22. Deferred or Runtime-Proof Items

- Anything not generated:
- Anything generated but not runtime-proven:
- Anything requiring browser/manual verification:
- Anything requiring custom code, custom CSS, scheduled execution, notification delivery, AI execution, or external integration proof:
- Anything requiring exact tenant IDs/users/configuration:

## 23. Recommended Next Prompt

Use this prompt after the plan is approved:

`Use @yeeflow-app-builder to generate <Application Name> from <plan path>. Treat the approved plan as the implementation contract. Generate the complete planned application unless an item is explicitly deferred. Use .yapk by default unless .yap is explicitly requested. Validate schema, ID provenance, navigation runtime metadata, graph, UI quality, approval forms, app-plan conformance, package wrapper/signing readiness, and source/dist consistency. Do not run live Yeeflow API calls, write operations, install/import/upgrade, or runtime tests unless explicitly authorized. Report local validation, ID provenance, navigation runtime metadata, signing status, API acceptance, runtime proof, deferred items, and known risks separately.`
