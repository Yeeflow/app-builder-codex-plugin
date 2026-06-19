# Application Design System Template

Use this template during the Full-page Canonical Design Artifacts stage after the Functional Specification, Yeeflow App Plan, Business Clarification Gate for generation, Generation Readiness final check, and traceability gates pass.

This document is the application-level visual contract. Generate it before any canonical design image. Every canonical design artifact and every Design Image Manifest row must reference this document.

## 1. Design System Status

- Status: draft / reviewed / approved for canonical design images
- Application name:
- Plugin version:
- Source Functional Specification:
- Source Yeeflow App Plan:
- Generated before canonical images: yes/no
- Ready for canonical image generation: yes/no

## 2. Selected Yeeflow Application Layout

- `applicationLayoutType`:
- `applicationLayoutName`:
- `applicationChromeStyleId`:
- `headerMode`:
- `navMode`:
- `navBackgroundMode`:
- `contentSafeArea`:
- `layoutRuleSource`: `docs/standards/yeeflow-application-layout-design-rules.md`
- Dashboard shell behavior:
- Header behavior:
- Navigation behavior:
- Content shell behavior:
- Reason this layout fits the application:

Allowed `applicationLayoutType` values are exactly:

- `application-layout-1-vertical-nav`
- `application-layout-2-horizontal-nav`
- `application-layout-3-header-nav`
- `application-layout-4-no-nav`

Do not use free-form layout names such as `left navigation with compact header and content shell`, `custom sidebar`, `SaaS shell`, `compact header`, or arbitrary custom layout descriptions in required layout fields.

Dashboard pages must reflect the selected official layout, including header/navigation/content shell where applicable. Approval forms and Data List forms are designed as complete form pages and do not need the application header or navigation panel; use `form-surface-no-app-chrome` as the manifest marker when a form row needs an explicit non-dashboard surface layout value.

For `application-layout-1-vertical-nav`, canonical chrome must follow `docs/standards/yeeflow-application-layout-design-rules.md`: full-width dark top app header, persistent dark left vertical navigation connected to/below the header, content safe area to the right of the left navigation and below the header, page title/actions inside the content safe area, no header hamburger, no bottom Collapse control, no arbitrary product sidebar, no detached left rail, no custom SaaS shell, no extra top navigation, and no mixed dark/light nav panels across pages.

For the other official layouts, reject obvious wrong chrome: Layout 2 must not use a persistent left sidebar; Layout 3 must keep navigation on the header and must not add a second nav bar or left nav; Layout 4 must not invent sidebars, nav tabs, replacement app shell navigation, or other visible app navigation.

## 3. Modern Visual Quality Standard

Structural design coverage is not enough. Every canonical design artifact must meet a modern business application visual-quality bar before it can be marked ready for Page Implementation Blueprint.

- Quality principles:
- Composition rules:
- Dashboard quality expectations:
- Form quality expectations:
- Workbench/queue quality expectations:
- Analytics/chart quality expectations:
- Collection/Kanban/Data table quality expectations:
- Responsive/mobile readability expectations:
- Anti-patterns to reject:
- Minimum acceptance criteria:

Minimum acceptance criteria:

- strong visual hierarchy
- professional spacing and density
- polished cards, sections, tables, and forms
- purposeful dashboard composition instead of generic card stacks
- meaningful KPI/Summary card design
- intentional Data Analytics regions with labels/context, not placeholder bars
- Collection/Kanban/Data table regions with realistic hierarchy and item detail
- page-specific layouts that are distinct but visually consistent
- no generic scaffold look
- no title-only or helper-text-heavy lower sections
- no design-stage explanation text inside the UI unless it is actual product content
- no placeholder chart graphics without labels/context
- clear action placement and priority
- realistic business data examples
- readable responsive/mobile layout planning

## 4. Application Visual Language

- Visual style:
- Density:
- Information hierarchy:
- Primary user workflow:
- Page-to-page consistency rules:

All generated design artifacts must share one coherent application-level style while allowing function-specific layouts.

## 5. Color Palette

| Token | Color | Usage | Accessibility Notes |
| --- | --- | --- | --- |
| Primary |  |  |  |
| Secondary |  |  |  |
| Background |  |  |  |
| Surface |  |  |  |
| Border |  |  |  |
| Success |  |  |  |
| Warning |  |  |  |
| Error |  |  |  |
| Info |  |  |  |

## 6. Typography Scale

| Token | Size/Weight | Usage |
| --- | --- | --- |
| Page title |  |  |
| Section title |  |  |
| Body |  |  |
| Helper text |  |  |
| Table text |  |  |
| Form label |  |  |
| Badge text |  |  |

## 7. Spacing Scale

| Token | Value | Usage |
| --- | --- | --- |
| Page padding |  |  |
| Section gap |  |  |
| Card padding |  |  |
| Field gap |  |  |
| Table row height |  |  |
| Action gap |  |  |

## 8. Card And Container Style

- Card radius:
- Border/shadow:
- Background treatment:
- Section container pattern:
- Empty/error/loading state treatment:

## 9. Table Style

- Header style:
- Row style:
- Status/priority cells:
- Owner/person cells:
- Action cells:
- Empty/loading/error states:
- Mobile fallback:

## 10. Form Field Style

- Label placement:
- Required marker:
- Input/control treatment:
- Read-only treatment:
- Validation hint/error treatment:
- Section grouping:
- Submission form action area:
- Task form decision/action area:
- Workflow/history panel:
- Print page treatment:

## 11. Action Button Style

- Primary action:
- Secondary action:
- Destructive action:
- Icon/action treatment:
- Sticky/mobile action behavior:

## 12. Status Badge Style

- Status badge shape:
- Approval status colors:
- Renewal/urgency colors:
- Priority/condition colors:
- Accessibility notes:

## 13. KPI/Summary And Data Analytics Style

- KPI card structure:
- Summary value treatment:
- Trend/helper text:
- Data Analytics chart treatment:
- Empty/loading/error states:
- Mobile stacking:

## 14. Collection, Kanban, And Timeline Item Card Style

- Collection card layout:
- Kanban card layout:
- Vertical Timeline item layout:
- Horizontal Timeline item layout:
- Dynamic control placement:
- Item action placement:
- Empty/loading/error states:
- Mobile behavior:

## 15. Dashboard Surface Rules

- Required header/navigation shell:
- Page title/action area:
- Filter behavior:
- Detail/workbench panel behavior:
- Lower-page/page-end treatment:

## 16. Approval Form Surface Rules

- Submission form layout:
- Task form layout:
- Shared style rules:
- Expected submission/task differences:
- Print page layout:

## 17. Data List Custom Form Surface Rules

- Add/Edit layout:
- View/detail layout:
- Related-record sections:
- Action areas:
- Sub List/table treatment:

## 18. Mobile And Responsive Rules

Document either separate mobile canonical images for key pages or a responsive plan referenced by the Design Image Manifest.

- Desktop-to-mobile layout behavior:
- Horizontal containers become:
- Grid column count changes:
- KPI/card stacking behavior:
- Table mobile behavior:
- Collection/Kanban/Timeline mobile behavior:
- Form fields become:
- Action buttons:
- Navigation/header behavior:
- Hidden/shown secondary fields:
- Content consistency rules:

## 19. Accessibility And Readability Notes

- Contrast:
- Touch targets:
- Keyboard/focus expectations:
- Readability:
- Error/validation clarity:

## 20. Design Proof Boundary

This document proves application-level design intent and visual consistency for later canonical image and Page Implementation Blueprint work. It does not prove Yeeflow package validity, control/property serialization, signing/API acceptance, install/upgrade success, or runtime behavior.

## 21. Deferred Or Unsupported Design Decisions

| Decision | Reason | Fallback | Proof Impact | Required Follow-up |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
