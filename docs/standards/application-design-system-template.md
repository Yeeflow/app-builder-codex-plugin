# <Application Name> - Application Design System

Use this template as Stage 4 / Step 4 for every Yeeflow application build, after the Functional Specification, Yeeflow App Plan, and Page Function Plan are reviewed and before page/resource generation.

The Application Design System defines the visual and interaction rules that guide later page design, page implementation blueprints, Yeeflow resource generation, decoded resource-vs-blueprint parity, package generation, signing, install/import/upgrade, and runtime proof. It should guide supported Yeeflow page design without inventing unsupported properties. It does not replace the Page Function Plan: the Page Function Plan remains the page/function/control contract for Dashboard pages, Approval submission/task/print forms, Data list forms, and Document library forms.

## 1. Design System Status

- Application name:
- Functional Specification path:
- Yeeflow App Plan path:
- Page Function Plan path:
- Selected Yeeflow Application Layout:
- selectedApplicationLayout:
- applicationLayoutType:
- applicationChromeStyleId:
- Planning plugin:
- Plugin version:
- Current status: draft / pending review / approved
- Known blockers:

## 2. Overall Application Visual Style

- Visual style:
- Brand/color intent:
- Tone:
- Accessibility/readability requirements:
- Density intent:
- Unsupported or runtime-proof-required style items:

## 3. Selected Yeeflow Application Layout

Every Application Design System must select exactly one Yeeflow Application Layout for the current app.

Supported layout values:

- `application-layout-1-vertical-nav`
- `application-layout-2-horizontal-nav`
- `application-layout-3-header-nav`
- `application-layout-4-no-nav`

Structured fields:

| Field | Required Value / Intent |
| --- | --- |
| selectedApplicationLayout | <One selected supported layout ID or object containing the selected layout ID> |
| applicationLayoutType | `application-layout-1-vertical-nav` / `application-layout-2-horizontal-nav` / `application-layout-3-header-nav` / `application-layout-4-no-nav` |
| applicationChromeStyleId | <One app-level chrome style ID for the selected layout> |
| headerMode | <Selected layout header behavior> |
| navigationMode | vertical-nav / horizontal-nav / header-nav / no-nav |
| navigationPanelMode | left-panel / horizontal-menu / header-menu / none |
| contentSafeArea | <Where Dashboard/application page content must sit relative to header/navigation chrome> |
| dashboardChromeRules | <Header/navigation/content-safe-area expectations for Dashboard and application pages> |
| formSurfaceChromeRules | <Approval forms and Data list / Document library forms are full form surfaces and do not include application header/navigation unless explicitly supported> |

| Area | Decision | Guidance | App Plan / Page Function Plan Trace |
| --- | --- | --- | --- |
| Application layout | <applicationLayoutType> | <Reason and use> | <Trace> |
| Header | <headerMode> | <Consistency rule> | <Trace> |
| Navigation mode | <navigationMode> | <Consistency rule> | <Trace> |
| Navigation panel | <navigationPanelMode> | <Consistency rule> | <Trace> |
| Content safe area | <contentSafeArea> | <Content region rule> | <Trace> |
| Dashboard chrome | <dashboardChromeRules> | Dashboard/application pages follow selected app header/navigation expectations | <Dashboard Page Function Plan IDs> |
| Form surfaces | <formSurfaceChromeRules> | Approval/data-list/document-library forms are full form surfaces unless plugin standards explicitly support app chrome | <Form Page Function Plan IDs> |

Rules:

- Select exactly one `applicationLayoutType`.
- The selected value must be one of the four supported Yeeflow layouts above.
- Do not invent arbitrary sidebars, custom nav bars, floating nav, custom top bars, unsupported app shells, or page-specific application chrome outside the selected Yeeflow layout.
- Dashboard/application pages must follow the selected layout and include header/navigation/content-safe-area expectations.
- Approval forms and Data list / Document library forms are form surfaces and should not include app header/navigation unless explicitly supported by plugin standards.
- Page Function Plan Dashboard entries must reference or inherit the selected Application Design System layout. They must not select a different application layout per Dashboard page unless the exception is explicitly marked unsupported/deferred with proof boundary.

## 4. Page Density and Spacing Principles

- Dashboard page density:
- Form page density:
- Card/section spacing:
- Table/list row density:
- Mobile spacing:
- Root padding and inner spacing rules:

## 5. Typography Hierarchy

| Use | Intent | Size / Hierarchy Guidance | Notes |
| --- | --- | --- | --- |
| Page title | <Intent> | <Hierarchy> | <Notes> |
| Section title | <Intent> | <Hierarchy> | <Notes> |
| Field label | <Intent> | <Hierarchy> | <Notes> |
| Table/list content | <Intent> | <Hierarchy> | <Notes> |
| Helper/error text | <Intent> | <Hierarchy> | <Notes> |

## 6. Button and Action Styling Intent

| Action Type | Visual Priority | Placement | State / Feedback | Notes |
| --- | --- | --- | --- | --- |
| Primary submit/action | high | <Placement> | <State> | <Notes> |
| Secondary action | medium | <Placement> | <State> | <Notes> |
| Destructive/reject action | high/caution | <Placement> | <State> | <Notes> |
| Row/item action | contextual | <Placement> | <State> | <Notes> |

## 7. Form Layout Conventions

- Submission form layout:
- Task form layout:
- New/Edit form layout:
- View/detail form layout:
- Print page layout:
- Required/read-only/default/validation display conventions:
- Sub list conventions:
- Document upload/metadata conventions:

## 8. Dashboard, Card, Table, and List Conventions

- KPI/Summary card conventions:
- Filter/action row conventions:
- Data table conventions:
- Collection/Kanban/timeline conventions:
- Related-region conventions:
- Empty/loading/error state conventions:

## 9. Mobile Layout Principles

- Container stacking:
- Grid-to-column behavior:
- Priority content:
- Hidden/shown mobile elements:
- Mobile action placement:
- Table/list mobile handling:
- Print/mobile boundary:

## 10. Cross-Page Consistency Rules

| Rule | Applies To | Rationale | Exceptions |
| --- | --- | --- | --- |
| <Rule> | <Pages/forms> | <Rationale> | <Allowed exceptions> |

## 11. Design-to-Generation Guidance

- How this design system guides page design:
- How this design system guides Page Function Plan implementation:
- How this design system guides page/resource generation:
- How unsupported style requirements are labeled:
- Validation/proof boundary:

Rules:

- Use this design system to keep all generated pages consistent while preserving each page's distinct business purpose.
- Consume the Page Function Plan as the canonical source for page surfaces, Dashboard template/golden-reference selections, form fields, related regions, actions, bindings, desktop/mobile behavior, and App Plan traceability.
- Do not infer Dashboard sections, form fields, related regions, or page actions from the App Plan alone when a Page Function Plan exists.
- Do not introduce later rollback-excluded systems unless already present in the active baseline.
- Do not invent unsupported Yeeflow properties. Unknown style or layout behavior must be marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
