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

- Selected layout:
- Layout source:
- Dashboard shell behavior:
- Header behavior:
- Navigation behavior:
- Content shell behavior:
- Reason this layout fits the application:

Dashboard pages must reflect the selected layout, including header/navigation/content shell where applicable. Approval forms and Data List forms are designed as complete form pages and do not need the application header or navigation panel.

## 3. Application Visual Language

- Visual style:
- Density:
- Information hierarchy:
- Primary user workflow:
- Page-to-page consistency rules:

All generated design artifacts must share one coherent application-level style while allowing function-specific layouts.

## 4. Color Palette

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

## 5. Typography Scale

| Token | Size/Weight | Usage |
| --- | --- | --- |
| Page title |  |  |
| Section title |  |  |
| Body |  |  |
| Helper text |  |  |
| Table text |  |  |
| Form label |  |  |
| Badge text |  |  |

## 6. Spacing Scale

| Token | Value | Usage |
| --- | --- | --- |
| Page padding |  |  |
| Section gap |  |  |
| Card padding |  |  |
| Field gap |  |  |
| Table row height |  |  |
| Action gap |  |  |

## 7. Card And Container Style

- Card radius:
- Border/shadow:
- Background treatment:
- Section container pattern:
- Empty/error/loading state treatment:

## 8. Table Style

- Header style:
- Row style:
- Status/priority cells:
- Owner/person cells:
- Action cells:
- Empty/loading/error states:
- Mobile fallback:

## 9. Form Field Style

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

## 10. Action Button Style

- Primary action:
- Secondary action:
- Destructive action:
- Icon/action treatment:
- Sticky/mobile action behavior:

## 11. Status Badge Style

- Status badge shape:
- Approval status colors:
- Renewal/urgency colors:
- Priority/condition colors:
- Accessibility notes:

## 12. KPI/Summary And Data Analytics Style

- KPI card structure:
- Summary value treatment:
- Trend/helper text:
- Data Analytics chart treatment:
- Empty/loading/error states:
- Mobile stacking:

## 13. Collection, Kanban, And Timeline Item Card Style

- Collection card layout:
- Kanban card layout:
- Vertical Timeline item layout:
- Horizontal Timeline item layout:
- Dynamic control placement:
- Item action placement:
- Empty/loading/error states:
- Mobile behavior:

## 14. Dashboard Surface Rules

- Required header/navigation shell:
- Page title/action area:
- Filter behavior:
- Detail/workbench panel behavior:
- Lower-page/page-end treatment:

## 15. Approval Form Surface Rules

- Submission form layout:
- Task form layout:
- Shared style rules:
- Expected submission/task differences:
- Print page layout:

## 16. Data List Custom Form Surface Rules

- Add/Edit layout:
- View/detail layout:
- Related-record sections:
- Action areas:
- Sub List/table treatment:

## 17. Mobile And Responsive Rules

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

## 18. Accessibility And Readability Notes

- Contrast:
- Touch targets:
- Keyboard/focus expectations:
- Readability:
- Error/validation clarity:

## 19. Design Proof Boundary

This document proves application-level design intent and visual consistency for later canonical image and Page Implementation Blueprint work. It does not prove Yeeflow package validity, control/property serialization, signing/API acceptance, install/upgrade success, or runtime behavior.

## 20. Deferred Or Unsupported Design Decisions

| Decision | Reason | Fallback | Proof Impact | Required Follow-up |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
