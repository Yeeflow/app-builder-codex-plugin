# <Application Name> - Application Design System

Use this template as Stage 4 / Step 4 for every Yeeflow application build, after the Functional Specification, Yeeflow App Plan, and Page Function Plan are reviewed and before page/resource generation.

The Application Design System defines the visual and interaction rules that guide later page design, page implementation blueprints, Yeeflow resource generation, decoded resource-vs-blueprint parity, package generation, signing, install/import/upgrade, and runtime proof. It should guide supported Yeeflow page design without inventing unsupported properties.

## 1. Design System Status

- Application name:
- Functional Specification path:
- Yeeflow App Plan path:
- Page Function Plan path:
- Selected Yeeflow Application Layout:
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

| Area | Decision | Guidance | App Plan / Page Function Plan Trace |
| --- | --- | --- | --- |
| Application layout | application-layout-1-vertical-nav / application-layout-2-horizontal-nav / application-layout-3-header-nav / application-layout-4-no-nav | <Reason and use> | <Trace> |
| Header | <Behavior> | <Consistency rule> | <Trace> |
| Navigation panel | <Behavior> | <Consistency rule> | <Trace> |
| Form surfaces | <Behavior> | Approval/data-list forms are full form surfaces unless plugin standards require app chrome | <Trace> |

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
- Do not introduce later rollback-excluded systems unless already present in the active baseline.
- Do not invent unsupported Yeeflow properties. Unknown style or layout behavior must be marked `runtime-proof-required`, `export-learning-required`, or `deferred`.
