# <Application Name> - Page Function Plan

Use this template as Stage 3 / Step 3 for every Yeeflow application build, after the Functional Specification and Yeeflow App Plan are reviewed and before Application Design System, page design, page/resource generation, implementation blueprints, package generation, signing, install/import/upgrade, or runtime proof.

The Page Function Plan is the page-level function contract. It defines what each UI-required page does, what content appears, which supported Yeeflow controls are intended, which App Plan resources and fields are used, and how desktop/mobile behavior should work. Form Reports are not required canonical UI design surfaces in this plan.

Dashboard layout/template selection is part of the Page Function Plan implementation contract. Dashboard page/resource generation must consume the selected `dashboardPagePattern` and `dashboardSectionTemplates[]`; prose-only template mentions are not enough.

## 1. Plan Status

- Application name:
- Functional Specification path:
- Yeeflow App Plan path:
- Page Function Plan path:
- Planning plugin:
- Plugin version:
- Current status: draft / pending review / approved
- Known blockers:

## 2. App Plan Traceability Summary

| Page Function ID | App Plan Resource Type | App Plan Resource Name | Surface / Form Name | Source List or Library | Required UI Surface | Page Function Plan Entry | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PFP-001 | Dashboard page / Approval form / Data list / Document library | <Stable resource name> | <Submission / Task / Print / New / Edit / View / Detail / Custom / Dashboard> | <List/library/form> | Yes/No | <Section reference> | <Notes> |

Rules:

- Reference App Plan resources by stable names only: dashboard page name, approval form name, submission/task/print form name, data list or document library name, form name, source list/library, field names, actions, workflow/form action references, and source bindings.
- Every Dashboard page in the App Plan requires an entry.
- Every Approval form Submission form requires an entry.
- Every planned Task form requires an entry.
- Every planned Print page requires an entry when required by the App Plan.
- Every planned custom Data list or Document library form requires an entry.
- Form Reports are not required as canonical UI design surfaces, but may be referenced as data/reporting resources when relevant.

## 3. Yeeflow Application Layout Guidance

- Selected Yeeflow Application Layout: application-layout-1-vertical-nav / application-layout-2-horizontal-nav / application-layout-3-header-nav / application-layout-4-no-nav
- Selection reason:
- Dashboard/application page header behavior:
- Dashboard/application navigation panel behavior:
- Active/selected navigation behavior:
- Approval form surface behavior:
- Data list and Document library form surface behavior:
- Unsupported or runtime-proof-required layout items:

Rules:

- Select one Yeeflow Application Layout for the application.
- Keep dashboard/application pages consistent with the selected layout, including header and navigation panel behavior.
- Approval forms and data list/document library forms are full form surfaces and should not include application header/navigation unless plugin standards explicitly require it.
- Describe layout intent; do not invent unsupported layout properties.

## 4. Dashboard Page Functions

Repeat this subsection for each Dashboard page planned in the App Plan.

### 4.x <Dashboard Page Name>

- Page Function ID:
- App Plan dashboard page name:
- Page purpose:
- Target users/roles:
- Business task solved by the page:
- Primary business workflow:
- dashboardPagePattern: `standard_dashboard_page_shell` / `three_column_workspace_shell` / documented dashboard shell equivalent
- Navigation placement:
- Empty/loading/error state intent:
- Desktop layout behavior:
- Mobile layout behavior:

#### Dashboard Template Selection

Use only Dashboard templates that exist in `docs/templates/yeeflow-ui-section-template-library.normalized.json` or documented Dashboard standards. Do not invent Dashboard template IDs.

Known Dashboard section templates include:

- `dashboard_header_action_bar`
- `kpi_card_row`
- `progress_summary_card`
- `business_alert_card`
- `data_table_section`
- `kanban_status_board`
- `collection_card_board`
- `quick_links_icon_list`
- `recent_activity_timeline`
- `three_column_workspace_shell`

`standard_dashboard_page_shell` is the documented standard Dashboard page shell equivalent and may be used as `dashboardPagePattern`. `multi_column_form_workspace_shell` is not a normal Dashboard default; use it only where the plugin standards explicitly call for a form workspace surface, not for ordinary dashboards.

| templateId | Region / Section Name | Business Purpose | Source List / Report / Resource | Displayed Fields | Filters | Grouping | Sorting | Actions | Required Controls | Proof Status / Fallback | Why This Template Fits | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kpi_card_row` | <KPI section> | <Metric purpose> | <Source> | <Fields> | <Filters> | <Grouping> | <Sorting> | <Actions or none> | <Controls> | export-proven/runtime-proven/runtime-proof-required/deferred + fallback | <Fit reason> | <Resource/field/action names> |

Template-selection rules:

- Every Dashboard page must declare a structured `dashboardPagePattern`.
- Every Dashboard page must declare structured `dashboardSectionTemplates[]`.
- Each `dashboardSectionTemplates[]` entry must include `templateId`, region/section name, business purpose, source list/report/resource, displayed fields, filters, grouping, sorting, actions, required controls, proof status or fallback, why the selected template fits, and App Plan traceability.
- Template selection is not only visual guidance. It is part of the Page Function Plan implementation contract and must be consumed by downstream page/resource generation.
- KPI/summary metrics should use `kpi_card_row` or another existing KPI/Summary template.
- Work queues can use `collection_card_board`, `data_table_section`, `kanban_status_board`, or `three_column_workspace_shell` when appropriate.
- Quick actions can use `quick_links_icon_list`.
- Alerts can use `business_alert_card`.
- Activity/history can use `recent_activity_timeline`.
- `three_column_workspace_shell` requires meaningful left/main/right panel content and must not be selected for a simple dashboard.
- If a selected template is not fully runtime-proven for the generated use, include proof status, fallback, and required follow-up.

#### Required Regions and Controls

| Region / Section | Selected Template ID | Business Purpose | Data Source | Supported Yeeflow Control Type | Fields Displayed | Filters | Grouping | Sorting / Priority | Actions Available | Empty / Loading / Error Intent | Desktop Layout Intent | Mobile Layout Intent | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Region> | <dashboardSectionTemplates[].templateId> | <Purpose> | <Source list/library/form/view> | Summary / Data Filter / Data table / Collection / Kanban / Vertical timeline / Horizontal timeline / chart / Container / Heading / Text / Button / supported control | <Fields> | <Filters> | <Grouping> | <Sorting/priority> | <Actions> | <State intent> | <Layout> | <Mobile behavior> | <Resource/field/action names> |

Rules:

- Control type per region must use only plugin-supported Yeeflow controls or be marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
- Data source, displayed fields, filters, grouping, sorting, actions, and App Plan trace must be explicit.
- Dashboard region definitions must map to selected `dashboardSectionTemplates[]` entries.
- Dashboard pages focus on page layout, analytics, data views, actions, and business workflows.

## 5. Approval Form Page Functions

Repeat this subsection for each Approval form planned in the App Plan.

### 5.x <Approval Form Name>

- Page Function ID:
- App Plan approval form name:
- Business purpose:
- Submitter role:
- Workflow/action references:
- Submission form required: Yes
- Task forms planned: zero to many
- Print pages planned: zero to many

#### Submission Form

| Section | Field / Control | Supported Yeeflow Control Type | Binding / Source | Editable / Read-only | Required | Default Value | Dynamic Behavior | Validation Behavior | Sub List / Summary Behavior | Actions / Buttons | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Section> | <Field/control> | <Supported control> | <Field/variable/list> | Editable/Read-only | Yes/No | <Default> | <Rule> | <Validation> | <Sub list/summary> | Save as draft / Submit / other approved action | <Resource/field/action names> |

Submission form rules:

- Buttons must include Save as draft and Submit.
- Fields, controls, editable/read-only state, required/default/dynamic/validation behavior, sub lists, and action buttons must be explicit.
- Do not include unrelated dashboard, audit, route-preview, or logic-only regions unless explicitly required by the App Plan.

#### Task Forms

| Task Form Name | Workflow Task Type / Node | Same As Submission Layout | Differences From Submission Form | Editable Fields | Read-only Fields | Required Buttons | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <Task form> | Approve/Reject / Complete / other supported task type | Yes/No | <Explicit differences> | <Fields> | <Fields> | Approve/Reject / Complete / supported buttons | <Workflow/form action names> |

Task form rules:

- Task forms are usually consistent with Submission form style/layout.
- Differences must be explicitly explained.
- Buttons must match task type, such as Approve/Reject or Complete.
- Editable and read-only fields must be explicit.

#### Print Pages

| Print Page Name | Print Purpose | Content Included | Layout Intent | Signature / Evidence Sections | Interactive Controls | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- |
| <Print page> | <Purpose> | <Fields/sub lists/evidence> | <Print layout> | <Signature/evidence> | None / explicitly supported | <Form/report/resource names> |

Print page rules:

- Define print-specific content and layout.
- Include signature/evidence sections when required.
- Do not include interactive controls unless explicitly supported.

## 6. Data List and Document Library Form Page Functions

Repeat this subsection for every Data list or Document library that has planned custom forms.

### 6.x <Data List or Document Library Name>

- Page Function ID:
- App Plan list/library name:
- Resource type: Data list / Document library
- Forms planned:
- Document metadata/upload/view behavior when applicable:

#### Forms

| Form Name | Form Type | Business Purpose | Used By / Opened From | Fields / Metadata | Supported Yeeflow Controls | Actions | Related Regions | Opening Behavior | Desktop Layout Intent | Mobile Layout Intent | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Form> | New/Edit/View/Detail/Custom/Print | <Purpose> | <Page/control/workflow> | <Fields> | <Controls> | Save/Cancel/View/Open/approved action | None / <Related region names> | page / popup / slide / full-screen / supported behavior | <Layout> | <Mobile behavior> | <Resource/field/action names> |

New/Edit rules:

- New/Edit forms should normally include only editable fields from the current list/library plus Save/Cancel or equivalent actions.
- Add/Edit may share the same form when appropriate.
- New/Edit forms must not include unrelated Collection, Data analytics, audit, dashboard, timeline, or linked-record regions unless explicitly planned and justified.

View/detail rules:

- View forms may differ and may include related Collections, Data tables, filters, analytics, timelines, or linked records when planned.
- Forms used as popup/detail pages from Collection, Data table, Kanban, or other controls must be explicitly listed.
- Document library forms follow the same rules and include document metadata, upload, preview, or view behavior where applicable.

#### Related Regions

| Host Form | Region Name | Region Type | Source List / Library | Parent / Current-Item Binding | Display Fields | Filters | Actions | Opening Behavior | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <View/detail/custom form> | <Region> | Collection / Data table / filter / analytics / timeline / linked records | <Source> | <Binding> | <Fields> | <Filters> | <Actions> | <Open behavior> | <Resource/field/action names> |

Related-region rules:

- Related regions must specify source list/library, parent/current-item binding, display fields, filters, actions, and opening behavior.
- New/Edit forms cannot contain related analytics/dashboard regions unless the App Plan explicitly plans and justifies them.

## 7. Full-Page and Responsive Requirements

| Page Function ID | Page / Form | Full-Page Purpose | Priority Content | Desktop Behavior | Tablet Behavior | Mobile Behavior | Hidden / Shown Mobile Elements | Business Content Consistency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <ID> | <Page/form> | <Purpose> | <Priority content> | <Desktop layout> | <Tablet layout> | <Mobile stacking/grid-to-column behavior> | <Hidden/shown elements> | <How content stays consistent> |

Rules:

- Each UI page must be treated as a full-page function specification.
- Dashboard pages focus on page layout, analytics, data views, actions, and business workflows.
- Form pages focus on fields, controls, layout, validation, read-only/editable state, sub lists, and action buttons.
- Mobile behavior must specify container stacking, grid-to-column changes, hidden/shown elements, and priority content while keeping business content consistent.
- Avoid pages becoming identical templates; each page must have a distinct business purpose and content structure.

## 8. Unsupported, Deferred, or Runtime-Proof Items

| Item | Page Function ID | Reason | Fallback | Required Proof / Follow-up | Generation Impact |
| --- | --- | --- | --- | --- | --- |
| <Item> | <ID> | <Reason> | <Fallback> | <Proof/follow-up> | <Impact> |

## 9. Validation Checklist

| Check | Status | Notes |
| --- | --- | --- |
| Every App Plan dashboard has a Page Function Plan entry | pass/fail | |
| Every Dashboard page has structured dashboardPagePattern | pass/fail | |
| Every Dashboard page has structured dashboardSectionTemplates[] | pass/fail | |
| Every Dashboard section templateId exists in plugin-contained Dashboard templates or documented Dashboard standards | pass/fail | |
| Dashboard section templates match the region purpose and include source, displayed fields, actions where required, required controls, proof status/fallback, and fit reason | pass/fail | |
| three_column_workspace_shell is used only for meaningful left/main/right workspace pages | pass/fail | |
| Every Approval submission form has a Page Function Plan entry | pass/fail | |
| Every planned task form has a Page Function Plan entry | pass/fail | |
| Every required print page has a Page Function Plan entry | pass/fail | |
| Every custom Data list / Document library form has a Page Function Plan entry | pass/fail | |
| Form Reports are not required as UI design surfaces | pass/fail | |
| Page Function Plan references only App Plan resources, fields, controls, and actions | pass/fail | |
| New/Edit forms avoid unrelated dashboard-style regions unless planned and justified | pass/fail | |
| View forms with related regions specify source, binding, fields, filters, actions, and opening behavior | pass/fail | |
| Desktop/mobile behavior is defined for every UI page | pass/fail | |

Executable gates:

```bash
node scripts/validate-page-function-plan.mjs <page-function-plan.md|json> --json
node scripts/validate-app-plan-page-function-traceability.mjs --app-plan <app-plan.json> --page-function-plan <page-function-plan.json>
```
