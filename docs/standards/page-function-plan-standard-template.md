# <Application Name> - Page Function Plan

Use this template as Stage 3 / Step 3 for every Yeeflow application build, after the Functional Specification and Yeeflow App Plan are reviewed and before Dashboard Pattern Library / Golden Reference selection, Application Design System, page design, implementation blueprints, page/resource generation, package generation, signing, install/import/upgrade, or runtime proof.

The Page Function Plan is a business/page-function contract. It explains what each page must accomplish, what data it uses, which fields must be displayed or summarized, which filters/sorts/grouping are required, which actions users need, and what mobile behavior is expected.

It is not a Yeeflow resource JSON blueprint. It must not directly prescribe low-level Yeeflow control nesting, exact Container/Grid/Text/Button property shapes, exact visual layout implementation, unsupported Yeeflow properties, arbitrary custom controls, CSS implementation, or how the generator should build resource JSON.

Responsibility split:

- Functional Specification: high-level business and user page needs.
- Yeeflow App Plan: resource contract, data lists, fields, workflows, forms, actions, dashboards, permissions, and stable Page Function Plan references.
- Page Function Plan: page-level business requirements, data-region requirements, field usage, filters, actions, sorting/grouping, mobile behavior, and App Plan traceability.
- Application Design System: selected application layout, visual system, tokens, header/navigation style, density, typography, and cross-page consistency.
- Dashboard Pattern Library / Golden Reference: dashboard layout and section pattern selection, including the default Event Portfolio dashboard structure where appropriate.
- Resource generator: actual Yeeflow controls, verified plugin-supported properties, resource JSON, implementation blueprints, and existing UI/YAPK hard gates.

Form Reports are not required canonical UI design surfaces and should not require Page Function Plan entries unless explicitly planned as a navigable/custom UI surface.

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
- Every Dashboard page in the App Plan requires one Page Function Plan entry.
- Every Approval form Submission form requires one Page Function Plan entry.
- Every planned Task form requires one Page Function Plan entry.
- Every planned Print page requires one Page Function Plan entry when required by the App Plan.
- Every planned custom Data list or Document library New/Edit/View/Detail/custom form requires one Page Function Plan entry.
- Every Page Function Plan entry must map back to one App Plan resource or surface.
- Page Function Plan entries must not reference resources, fields, or business actions outside the App Plan unless explicitly marked `runtime-proof-required`, `export-learning-required`, or `deferred` with reason and fallback.

## 3. Page Function Entries

Repeat this section for every UI-required page or form surface.

### 3.x Page Overview

- pageFunctionPlanId:
- appPlanResourceRef:
- page name:
- page type: Dashboard / Approval Submission form / Approval Task form / Approval Print page / Data list New form / Data list Edit form / Data list View form / Document library form / Custom detail page
- business purpose:
- what business question the page helps answer:
- primary workflow supported:
- out of scope for this page:

### 3.x.1 Primary Users

| User Role | What This Role Needs From The Page | Primary Decisions Or Tasks | Access / Visibility Notes |
| --- | --- | --- | --- |
| <Role> | <Need> | <Decision/task> | <Visibility/access> |

### 3.x.2 Business Questions

List concrete questions the page must answer.

| Question | Why It Matters | Source Data Needed | Page Region That Answers It |
| --- | --- | --- | --- |
| <Example: Which facility requests are overdue?> | <Business reason> | <List/fields> | <Region> |

### 3.x.3 Data Sources And Field Usage

For each data source used by the page, state exactly how its fields support the page function.

| Source Data List Name | Where It Is Used | Required Fields | Metric Usage | Display Usage | Filter Usage | Sort / Group Usage | Action Usage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <List/library name from App Plan> | <Region/filter/action/metric> | <Field names from App Plan> | <Metric/calculation use or N/A> | <Visible display use or N/A> | <Filter use or N/A> | <Sort/group use or N/A> | <Action context or N/A> |

Rules:

- A source data list/library must map to an App Plan resource.
- Required fields must map to App Plan fields unless explicitly proof/deferred.
- Do not use generic phrases such as "show dashboard data", "display list", or "show summary cards" without source list, field names, and business purpose.

### 3.x.4 Page Filters

| Filter Name | Business Purpose | Source Data List | Field Name | Field Type From App Plan | Applies To Regions | Default Value | Selection Behavior | Filter Logic | Mobile Behavior |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Filter> | <Why users need it> | <List/library> | <Field> | <Type if known> | <Regions> | <Default> | <Single/multi/select/search/date range/etc.> | <Exact business logic> | <How it adapts conceptually on mobile> |

Rules:

- Each filter must identify source list/library and field.
- Filter logic must describe the business filtering rule, not a low-level Data Filter control property.
- If a filter affects multiple regions, list each region.

### 3.x.5 Summary Metrics

| Metric Name | Business Meaning | Source Data List | Source Fields | Calculation Logic | Default Filter Scope | Formatting Expectation |
| --- | --- | --- | --- | --- | --- | --- |
| <Metric> | <Meaning> | <List/library> | <Fields> | <Count/sum/average/ratio/status calculation> | <Default scope> | <Currency/percent/count/date/compact number expectation> |

Rules:

- Metrics must state source fields and calculation logic.
- Formatting expectation should be business-level, such as currency, percent, whole number, compact number, date, or status label. Do not prescribe exact Yeeflow Text/Summary control properties.

### 3.x.6 Main Data Region

For the primary list/table/queue/portfolio/workbench region on the page:

| Region Name | Business Purpose | Source Data List | Display Fields | Default Sorting | Grouping If Needed | Required Actions | Role / Permission Behavior | Mobile Behavior |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| <Region> | <Purpose> | <List/library> | <Fields> | <Sort rule> | <Grouping> | <Action intent> | <Role behavior> | <Mobile behavior> |

Rules:

- The main data region must declare source list/library, display fields, default sorting, action intent, and mobile behavior.
- Required actions must describe business intent and target, such as "open request detail", "create maintenance request", or "start approval". Exact Container/Button action metadata and Yeeflow action-type codes are verified by later action/property hard gates when generation occurs.

### 3.x.7 Secondary Data Regions

For supporting regions such as related records, documents, recent activity, alerts, status summaries, analytics, or linked records:

| Region Name | Purpose | Source Data List | Display Fields | Metric / Grouping Logic | Actions If Applicable | Mobile Priority |
| --- | --- | --- | --- | --- | --- | --- |
| <Region> | <Purpose> | <List/library> | <Fields> | <Metric/grouping logic or N/A> | <Action intent or N/A> | <Visible/collapsed/lower priority> |

Rules:

- View/detail forms may include related regions only when source list/library, current item binding, displayed fields, filters, and actions are explicit.
- New/Edit forms should normally include only fields from the current list/library plus Save/Cancel or equivalent actions, unless an App Plan-supported exception is explicitly declared.
- Document library forms must include upload/edit/view metadata and document-specific behavior where applicable.

### 3.x.8 Mobile Support

- Content that remains visible first:
- Filters adaptation:
- Actions that must remain accessible:
- Indicators or metrics that must remain visible:
- Lower-priority content that can move below primary content:
- Mobile exclusions or deferred behavior:

### 3.x.9 Design Intent

- Business-level visual intent: operations command center / portfolio monitoring / triage workbench / approval workspace / document review / reference list / other
- Desired user impression:
- Density expectation: compact / balanced / spacious
- Emphasis priorities:

Rules:

- Design intent must stay business-level.
- Do not specify exact Container nesting, CSS, pixel sizes, raw Yeeflow property paths, resource JSON, unsupported control properties, or exact visual layout implementation.
- Dashboard Pattern Library / Golden Reference selection happens after this business contract and must use plugin-contained dashboard standards and existing hard gates. The required Dashboard Golden Reference Selection artifact maps this business contract to selected page/section reference IDs before blueprint generation. The default dashboard construction style is `event_portfolio_dashboard_golden_reference` with reference details in `docs/reference/dashboard-golden-reference-registry.normalized.json`, but the Page Function Plan should still describe only business/page-function needs: metrics, data regions, filters, fields, actions, sorting/grouping, and mobile behavior.

### 3.x.10 Responsibility Boundary

State this boundary in every Page Function Plan:

```text
This Page Function Plan is a business/page-function contract only. It does not prescribe low-level Yeeflow controls, Container/Grid/Text/Button property shapes, unsupported properties, CSS, or resource JSON. Implementation must use App Plan resources, the Application Design System, Dashboard Pattern Library / Golden Reference, verified Yeeflow generation standards, implementation blueprints, and existing UI/YAPK hard gates.
```

## 4. Approval Form Page Requirements

For Approval forms, create separate Page Function entries for:

- Submission form.
- Every planned Task form.
- Every planned Print page.

Submission form requirements:

- Submission form pageFunctionPlanId:
- Fields and business purpose for each field.
- Editable/read-only state.
- Required/default/dynamic/validation behavior from a business perspective.
- Sub lists if needed.
- Save as draft and Submit actions.
- No unrelated dashboard, audit, route-preview, or logic-only regions unless explicitly required by App Plan.

Task form requirements:

- Task form pageFunctionPlanId:
- Usually consistent with Submission form style/layout.
- Differences from Submission form must be explicitly explained.
- Task-specific actions such as Approve/Reject or Complete.
- Editable/read-only field differences.

Print page requirements:

- Print page pageFunctionPlanId:
- Print-specific content and layout intent.
- Signature/evidence sections if required.
- No unsupported interactive controls.

## 5. Data List And Document Library Form Requirements

For every Data list or Document library form planned in the App Plan:

- Include New/Edit/View/Detail/custom forms.
- Add/Edit may share the same form when appropriate.
- New/Edit forms should normally include only editable fields from the current list/library plus Save/Cancel or equivalent actions.
- View forms may include related Collections, Data tables, filters, analytics, timelines, documents, linked records, or activity only when source list/library, parent/current-item binding, display fields, filters, actions, and opening behavior are explicit.
- Forms used as popup/detail pages from Collection, Data table, Kanban, or other controls must be explicitly listed.
- Document library forms must include document metadata, upload/edit behavior, preview/open behavior, and view behavior where applicable.

## 6. Full-Page And Responsive Requirements

- Each UI page must be treated as a full-page business/function specification.
- Dashboard pages focus on business questions, metrics, filters, data views, actions, and workflows.
- Form pages focus on fields, state, validation, sub lists, action intent, and business workflow completion.
- Mobile behavior must specify content priority, filter adaptation, action accessibility, and visible indicators while keeping business content consistent.
- Avoid pages becoming identical templates; each page must have a distinct business purpose and content structure.

## 7. Validation Checklist

Before page/resource generation:

- Functional Specification describes high-level business/user page needs only.
- App Plan declares resources, lists, fields, workflows, forms, actions, dashboards, permissions, and Page Function Plan references.
- Page Function Plan entries map back to App Plan resources.
- Page Function Plan source lists and fields exist in the App Plan or are explicitly proof/deferred.
- Page Function Plan filters include source list, field, filter logic, default value, affected regions, and mobile behavior.
- Page Function Plan metrics include source fields, calculation logic, scope, and formatting expectation.
- Page Function Plan main data regions include source list, display fields, sorting/grouping, actions, role behavior, and mobile behavior.
- Page Function Plan contains no low-level Yeeflow property paths, exact Container/Grid/Text/Button nesting, CSS implementation, arbitrary custom controls, or resource JSON instructions.
- Application Design System, Dashboard Pattern Library / Golden Reference, implementation blueprints, and UI/YAPK hard gates remain responsible for implementation choices after this business contract is approved. Dashboard generation maps approved business/page-function requirements into the default Event Portfolio golden reference structure when appropriate; it must not clone Marketing Event-specific fields or sample data into unrelated apps.
