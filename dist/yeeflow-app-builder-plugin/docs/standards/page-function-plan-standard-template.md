# <Application Name> - Page Function Plan

Use this template as Stage 3 / Step 3 for every Yeeflow application build, after the Functional Specification and Yeeflow App Plan are reviewed and before Application Design System, page design, page/resource generation, implementation blueprints, package generation, signing, install/import/upgrade, or runtime proof.

The Page Function Plan is the canonical page-level implementation contract after the Yeeflow App Plan. It defines what each UI-required page does, what content appears, which supported Yeeflow controls are intended, which App Plan resources and fields are used, and how desktop/mobile behavior should work. Form Reports are not required canonical UI design surfaces in this plan.

Dashboard layout/template selection is part of the Page Function Plan implementation contract. Dashboard page/resource generation must consume the selected `pageFunctionPlanId`, `appPlanDashboardRef`, `dashboardPagePattern`, `dashboardGoldenReference`, and `dashboardSectionTemplates[]`; prose-only template mentions are not enough.

Dashboard golden-reference usage belongs in this Page Function Plan only. The Functional Specification should describe the business page need, and the Yeeflow App Plan should declare the Dashboard resource and reference this Page Function Plan entry without embedding the Dashboard implementation detail.

Dashboard sections that declare high-quality, Marketing Event, Event Portfolio, portfolio/status, operational-table, rich table, or runtime-fidelity intent must also declare the fidelity requirements that page/resource generation must preserve. Use only plugin-contained standards, studies, template libraries, and redacted/synthetic references; do not depend on private Marketing Event artifacts.

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
- Every Approval form Submission form requires an entry with a stable Submission form pageFunctionPlanId and App Plan approval reference.
- Every planned Task form requires an entry with a stable Task form pageFunctionPlanId and App Plan task/form action reference.
- Every planned Print page requires an entry with a stable Print page pageFunctionPlanId when required by the App Plan.
- Every planned custom Data list or Document library form requires an entry with a stable Form pageFunctionPlanId and App Plan list/library/form reference.
- Every Page Function Plan entry must map back to one App Plan resource or surface. Page Function Plan entries must not reference resources, fields, controls, actions, templates, or golden references outside the App Plan and plugin-supported capabilities.
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

- pageFunctionPlanId:
- appPlanDashboardRef:
- Page purpose:
- Target users/roles:
- Business task solved by the page:
- Primary business workflow:
- dashboardPagePattern: `standard_dashboard_page_shell` / `three_column_workspace_shell` / documented dashboard shell equivalent
- dashboardGoldenReference: none / `event_portfolio_dashboard_golden_reference`
- Navigation placement:
- Empty/loading/error state intent:
- Desktop layout behavior:
- Mobile layout behavior:

#### Dashboard Template Selection

Use only Dashboard templates that exist in `docs/templates/yeeflow-ui-section-template-library.normalized.json` or documented Dashboard standards. Do not invent Dashboard template IDs.

Known Dashboard section templates include:

- `dashboard_header_action_bar`
- `event_portfolio_dashboard_golden_reference` as a full Dashboard golden-reference family, selected through `dashboardGoldenReference`
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

Use `dashboardGoldenReference: event_portfolio_dashboard_golden_reference` when the Dashboard needs a high-quality portfolio, operations, status, pipeline, event, project, vendor, contract, service, or request management page. This golden reference is based only on plugin-contained, redacted, synthetic, or already committed Marketing Event / Event Portfolio training materials. Do not reference private raw Marketing Event artifacts, raw package payloads, tenant/app/list IDs, screenshots, raw API responses, or private runtime evidence.

| templateId | Region / Section Name | Business Purpose | Source List / Report / Resource | Displayed Fields | Filters | Grouping | Sorting | Actions | Required Controls | Proof Status / Fallback | Why This Template Fits | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kpi_card_row` | <KPI section> | <Metric purpose> | <Source> | <Fields> | <Filters> | <Grouping> | <Sorting> | <Actions or none> | <Controls> | export-proven/runtime-proven/runtime-proof-required/deferred + fallback | <Fit reason> | <Resource/field/action names> |

#### Event Portfolio Dashboard Golden Reference

Complete this subsection when `dashboardGoldenReference` is `event_portfolio_dashboard_golden_reference`.

| Required Piece | Page Function Plan Requirement | App Plan Trace |
| --- | --- | --- |
| Page purpose | <Portfolio/operations/status/pipeline/event/project/vendor/contract/service/request management purpose> | <Dashboard page name> |
| Source data lists | <Primary and supporting lists/resources> | <List/resource names> |
| Data Filter controls | <Filter controls, filter variables, default values, and target consumers> | <Fields/resources consumed> |
| KPI cards | <KPI card definitions, metric fields, labels, state copy, and visual hierarchy> | <Source list/fields> |
| Summary/KPI binding | <Summary control source, pivot/report/list binding, hidden source/temp variable/visible card binding or explicit fallback boundary> | <Resource/field/action names> |
| Grid-table Collection | <Collection section with source list, displayed fields, item context, row layout, detail/open behavior> | <Source list/form/action names> |
| Dynamic item controls | <Dynamic field/Dynamic user/Progress controls inside Collection item templates> | <Field names> |
| Status/progress/person treatment | <Status badges, progress controls, owner/person/avatar treatment where fields require them> | <Field names> |
| Table polish | <Header hierarchy, row density, spacing, and responsive stacking> | <Section trace> |
| Actions | <Detail/open/add/update actions with real Yeeflow action metadata and row context> | <Action/form/page names> |
| Designer traceability | <Semantic `nv_label` requirements for page sections, filters, KPI cards, rows, and actions> | <Section/control trace> |
| Runtime proof boundary | <Runtime/browser/screenshot proof required; signing/install/API success alone is not UI proof> | <Proof artifact expectations> |

#### Dashboard Fidelity Requirements

Complete this subsection for each Dashboard section that declares high-quality, Marketing Event, Event Portfolio, portfolio/status, operational-table, rich table, Collection grid-table, or runtime-fidelity intent.

| Region / Section Name | templateId | Marketing Event / Event Portfolio Fidelity Reference | KPI / Summary Binding Requirements | Data Filter Requirements | Collection Grid-Table Requirements | Badge / Progress / Avatar / Person Treatment | Action Metadata Requirements | KPI Formatting Requirements | `nv_label` / Designer Traceability | Runtime Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Region> | <Existing Dashboard template ID> | <Plugin-contained standard/study/reference path or none> | <Summary control source, pivot/report/list binding, hidden source/temp variable/visible KPI binding> | <Real Data Filter controls, filter variables, target consumers> | <Source list, displayed fields, row context, detail/open action, opening behavior> | <Status badges, progress controls, Dynamic user/person/avatar treatment, table header hierarchy, row density> | <Real Yeeflow action metadata, action type, target list/resource, row context, open/add/detail behavior> | <formatNumber/compact K/M/B/fixed decimals/currency/percent rules> | <Semantic `nv_label` and designer traceability expectations> | <What runtime/browser/screenshot proof is required; note that signing/install/API success alone is not UI proof> |

Template-selection rules:

- Every Dashboard page must declare a structured `dashboardPagePattern`.
- Every Dashboard page must declare a structured `dashboardGoldenReference`; use `none` when no golden reference is selected.
- Every Dashboard page must declare structured `dashboardSectionTemplates[]`.
- Every Dashboard page must declare `pageFunctionPlanId` and `appPlanDashboardRef` so App Plan to Page Function Plan traceability is bidirectional.
- Each `dashboardSectionTemplates[]` entry must include `templateId`, region/section name, business purpose, source list/report/resource, displayed fields, filters, grouping, sorting, actions, required controls, proof status or fallback, why the selected template fits, and App Plan traceability.
- Template selection is not only visual guidance. It is part of the Page Function Plan implementation contract and must be consumed by downstream page/resource generation.
- Dashboard template/fidelity selection is also a downstream implementation contract: page/resource generation must preserve the selected template IDs, data bindings, filter/action metadata, rich table treatment, KPI formatting, semantic `nv_label`, and runtime proof boundary.
- If `event_portfolio_dashboard_golden_reference` is selected, downstream generation must preserve the whole golden-reference contract: Data Filters, KPI cards, Summary/KPI binding or fallback boundary, Collection grid-table structure, Dynamic controls in item templates, badge/progress/person treatments, real action metadata, table hierarchy/density/spacing, semantic `nv_label`, and runtime proof boundary.
- Do not allow dashboard/resource generation to infer sections only from the App Plan resource list when a Page Function Plan exists.
- KPI/summary metrics should use `kpi_card_row` or another existing KPI/Summary template.
- Work queues can use `collection_card_board`, `data_table_section`, `kanban_status_board`, or `three_column_workspace_shell` when appropriate.
- Quick actions can use `quick_links_icon_list`.
- Alerts can use `business_alert_card`.
- Activity/history can use `recent_activity_timeline`.
- `three_column_workspace_shell` requires meaningful left/main/right panel content and must not be selected for a simple dashboard.
- If a selected template is not fully runtime-proven for the generated use, include proof status, fallback, and required follow-up.
- High-quality/Event Portfolio-style Dashboard sections must cite applicable plugin-contained fidelity lessons such as `docs/studies/marketing-event-v045-design-runtime-fidelity-study.md`, `docs/standards/yeeflow-ui-control-property-fidelity.md`, `docs/standards/dashboard-summary-card-generation-standard.md`, `docs/standards/dashboard-runtime-binding-standard.md`, `docs/generated-dashboard-ui-quality-gates.md`, or `docs/reference/yeeflow-control-property-extensions.json`.
- KPI/Summary Dashboard sections must define source list/report/resource, Summary binding, metric fields, filters, temp-variable or visible-card binding intent, and formatting rules.
- Filtered Dashboard sections must define real Data Filter controls, filter variables, and downstream consumers such as Summary, Collection, Data table, chart, or list regions.
- Event Portfolio-style portfolio/status/operational tables must require rich table/card treatment instead of plain scaffold tables: status badges where appropriate, progress controls for progress fields, Dynamic user/person or avatar/person treatment for owner fields where supported, table header hierarchy, row density, and real action metadata for action-looking controls.
- Collection grid-table style is allowed only when the source list, displayed fields, row context, detail/open actions, and opening behavior are specified.
- Event Portfolio golden-reference fidelity cannot be satisfied by generic cards, static KPI values, plain Data tables, scaffold sections, placeholder controls, or action-looking visuals without real Yeeflow action metadata.

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
- Submission form pageFunctionPlanId:
- Task form pageFunctionPlanId values:
- Print page pageFunctionPlanId values:
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
- Every field row must declare editable/read-only state and required, default, dynamic, and validation behavior; use `N/A` when a behavior is intentionally not applicable.
- Sub lists, form actions, summaries, and dynamic behavior must reference App Plan-supported fields/actions/resources.
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
- Print page content must be print-specific and must not contain unsupported Button, Data Filter, Collection, Data table, Kanban, Sub List, Tabs, chart, or other interactive controls.

## 6. Data List and Document Library Form Page Functions

Repeat this subsection for every Data list or Document library that has planned custom forms.

### 6.x <Data List or Document Library Name>

- Page Function ID:
- App Plan list/library name:
- Resource type: Data list / Document library
- Forms planned:
- Document metadata/upload/view behavior when applicable:
- Form pageFunctionPlanId values:
- App Plan resource reference:

#### Forms

| Form pageFunctionPlanId | Form Name | Form Type | Business Purpose | Used By / Opened From | Fields / Metadata | Supported Yeeflow Controls | Actions | Related Regions | Opening Behavior | Desktop Layout Intent | Mobile Layout Intent | App Plan Trace |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PFP-<ID> | <Form> | New/Edit/View/Detail/Custom/Print | <Purpose> | <Page/control/workflow> | <Fields> | <Controls> | Save/Cancel/View/Open/approved action | None / <Related region names> | page / popup / slide / full-screen / supported behavior | <Layout> | <Mobile behavior> | <Resource/field/action names> |

New/Edit rules:

- New/Edit forms should normally include only editable fields from the current list/library plus Save/Cancel or equivalent actions.
- New/Edit forms must include only fields from the current list/library unless an App Plan-supported exception is explicitly declared and justified.
- New/Edit forms must include Save/Cancel or equivalent actions.
- Add/Edit may share the same form when appropriate.
- New/Edit forms must not include unrelated Collection, Data analytics, audit, dashboard, timeline, or linked-record regions unless explicitly planned and justified.

View/detail rules:

- View forms may differ and may include related Collections, Data tables, filters, analytics, timelines, or linked records when planned.
- Forms used as popup/detail pages from Collection, Data table, Kanban, or other controls must be explicitly listed.
- Document library forms follow the same rules and must include Document metadata, upload, preview, and view behavior where applicable.

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
| Every Dashboard page has structured pageFunctionPlanId and appPlanDashboardRef | pass/fail | |
| Every Dashboard page has structured dashboardPagePattern | pass/fail | |
| Every Dashboard page has structured dashboardGoldenReference | pass/fail | |
| Every Dashboard page has structured dashboardSectionTemplates[] | pass/fail | |
| Every Dashboard section templateId exists in plugin-contained Dashboard templates or documented Dashboard standards | pass/fail | |
| Dashboard section templates match the region purpose and include source, displayed fields, actions where required, required controls, proof status/fallback, and fit reason | pass/fail | |
| three_column_workspace_shell is used only for meaningful left/main/right workspace pages | pass/fail | |
| Every Approval submission form has a Page Function Plan entry | pass/fail | |
| Every planned task form has a Page Function Plan entry | pass/fail | |
| Every required print page has a Page Function Plan entry | pass/fail | |
| Every custom Data list / Document library form has a Page Function Plan entry | pass/fail | |
| Every Approval/Data list/Document library surface has a stable Page Function Plan ID and App Plan reference | pass/fail | |
| Form Reports are not required as UI design surfaces | pass/fail | |
| Page Function Plan references only App Plan resources, fields, controls, and actions | pass/fail | |
| New/Edit forms include only current list/library fields and Save/Cancel actions unless App Plan-supported exception is declared | pass/fail | |
| Approval submission/task/print surfaces include state/action/print-specific behavior | pass/fail | |
| Document library forms include metadata/upload/view behavior where applicable | pass/fail | |
| New/Edit forms avoid unrelated dashboard-style regions unless planned and justified | pass/fail | |
| View forms with related regions specify source, binding, fields, filters, actions, and opening behavior | pass/fail | |
| Desktop/mobile behavior is defined for every UI page | pass/fail | |

Executable gates:

```bash
node scripts/validate-page-function-plan.mjs <page-function-plan.md|json> --json
node scripts/validate-app-plan-page-function-traceability.mjs --app-plan <app-plan.json> --page-function-plan <page-function-plan.json>
```
