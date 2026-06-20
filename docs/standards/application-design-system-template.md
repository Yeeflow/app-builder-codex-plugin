# Application Design System Template

Use this template after the Functional Specification, Yeeflow App Plan, Business Clarification Gate for generation, Generation Readiness final check, and traceability gates pass.

This document is the application-level UI contract. Generate it before Yeeflow UI Section Template selection, Page Implementation Blueprints, optional canonical design images, or optional HTML previews. Every selected UI pattern, Page Implementation Blueprint, optional Design Image Manifest row, and optional HTML preview must reference this document.

## 1. Design System Status

- Status: draft / reviewed / approved for pattern selection / approved for blueprint
- Application name:
- Plugin version:
- Source Functional Specification:
- Source Yeeflow App Plan:
- Generated before UI pattern selection: yes/no
- Ready for UI pattern selection: yes/no
- Ready for Page Implementation Blueprint: yes/no
- UI pattern library source: `docs/templates/yeeflow-ui-section-template-library.normalized.json`
- UI pattern library narrative source: `docs/templates/yeeflow-ui-section-template-library.md`
- UI pattern standard source: `docs/standards/yeeflow-ui-pattern-library-generation-standard.md`

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
- Text wrapping/truncation strategy:
- Container boundary and clipping rules:
- Element overlap and spacing review rules:
- Mobile layout pressure rules:
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
- long labels wrap, truncate with intentional ellipsis, or receive wider/responsive containers
- table cells, buttons, badges, chips, cards, timelines, Kanban/Collection cards, and form fields avoid visible text overflow and element overlap
- mobile designs stack multi-column layouts, reduce column counts, or use scroll/card-list alternatives rather than preserving cramped desktop columns

## 3A. HTML Preview Design Tokens And UI Pattern Templates

For complex business applications, the Application Design System must define reusable tokens and approved Yeeflow UI Section Templates first. HTML previews are optional high-fidelity review/prototype evidence when explicitly requested, and use `docs/standards/ui-surface-contract-template.md` and `docs/standards/html-preview-design-standard.md` only for that optional evidence flow.

The default implementation path is App Plan -> Application Design System -> selected Yeeflow UI Section Templates -> Page Implementation Blueprint -> Yeeflow resources. The Application Design System must define tokens, layout rules, component patterns, responsive rules, and visual quality standards that allow selected templates and blueprints to prove the same design-stage gates previously checked through images or HTML. It must not permit arbitrary SaaS shells, generic form scaffolds, placeholder lower-page regions, weak visual hierarchy, text overflow, element overlap, mobile layout pressure, or template reuse without purposeful surface differences.

- Yeeflow design token namespace:
- Typography token/class map:
- Spacing token/class map:
- Color token/class map:
- Border/radius/shadow token/class map:
- Card and section component patterns:
- Form section component patterns:
- Data table and Sub List component patterns:
- Collection/Kanban/Timeline component patterns:
- Button/action placement component patterns:
- Badge/chip/status component patterns:
- Dashboard KPI/analytics component patterns:
- Mobile responsive component patterns:
- Approved UI pattern templates by surface type:
  - Dashboard page:
  - Approval Submission form:
  - Approval Task form:
  - Approval Print page:
  - Data List New/Edit form:
  - Data List View/Detail form:
  - Document Library New/Edit form:
  - Document Library View form:

Optional HTML previews must use these tokens and approved pattern templates. HTML preview is not a low-fidelity scaffold; it must be a modern, polished, design-system-driven prototype equal to or better than static generated design images. Screenshots are evidence generated from validated HTML, not the primary implementation contract.

## 3B. Yeeflow UI Section Template Selection

Select surface-level templates from `docs/templates/yeeflow-ui-section-template-library.normalized.json`.

| Surface ID | Surface type | Source App Plan resource | Selected `templateId` values | Template category | Proof status | Required controls mapped | Required fields/bindings mapped | Required actions mapped or deferred | Ready for Blueprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | runtime-proven / export-proven / inferred / needs-golden-proof |  |  |  | yes/no |

Selection rules:

- Dashboard pages may use dashboard, item-template, and collection-control templates.
- Approval Submission and Task forms may use approval-form-workspace, data-list-form, item-template, and collection-control templates when the App Plan maps those regions.
- Approval Print pages use read-only data-list-form and item-template print patterns.
- Data List and Document Library New/Edit forms use form-body templates for primary editable fields; primary fields must not move into generic lower regions.
- View/Detail, related-record, Sub List, Collection, Kanban, and Timeline regions must select templates matching their source list, row/current-item context, and actions.
- Every selected template must preserve `patternProofStatus`.

Run `scripts/validate-ui-pattern-selection.mjs` before Page Implementation Blueprint work when a machine-readable pattern-selection artifact exists.

## 3C. Control And Property Proof Boundary

Declare which control/property shapes are safe for generation:

- Product-catalog-backed control/property paths:
- Extension-registry-backed patterns:
- Export-proven only patterns:
- Runtime-proven patterns:
- Inferred patterns:
- Needs golden proof before generated-final use:
- Deferred controls/properties/actions:
- Fallback behavior:
- Proof impact:

## 4. Form And Detail Semantic Quality Standard

Approval Submission forms, Approval Task forms, Approval Print pages, Data List Add/Edit forms, Data List View forms, Data List Detail forms, and other custom form/detail surfaces must show page-specific business meaning. Full-page height alone is not enough.

- Field/value semantic guardrails:
- Required form/detail business fields:
- Required lower-page business regions:
- Lower-page visual concreteness rules:
- Lower-page semantic consistency rules:
- Form/detail visual usability rules:
- Page-specific quality evidence rules:
- Template reuse risk rules:
- Surface responsibility rules:
- App Plan field/action coverage rules:
- Forbidden-region rules:
- Shared-style allowance:
- Form/detail anti-patterns to reject:

Minimum acceptance criteria:

- every form/detail artifact declares `primaryBusinessObject`
- every form/detail artifact includes `semanticFieldExamples` with realistic field/value pairs
- `fieldValueSemanticsStatus` must pass before `readyForBlueprint: true`
- every blueprint-ready artifact declares `appPlanResourceRef`, `sourceResourceType`, `sourceListOrFormName`, `surfaceResponsibility`, `plannedFieldCoverage`, `requiredFieldsShown`, `missingPlannedFields`, `fieldCoverageStatus`, `plannedActions`, `actionsShown`, `missingRequiredActions`, `actionCoverageStatus`, `forbiddenRegionsPresent`, `forbiddenRegionStatus`, `surfaceResponsibilityStatus`, and `appPlanTraceabilityStatus`
- full-page design images must be faithful to approved App Plan fields, controls, and actions; visual completeness alone is not enough
- Approval Submission forms focus on editable request input fields, planned Sub List controls, Save as draft, and Submit; route preview, audit activity, workflow history, duplicated hero/title cards, dashboard analytics, and validation-only checklists are forbidden unless explicitly planned as visible UI
- Approval Task forms focus on read-only request context, task fields, reviewer comments/decision areas, and Approve/Reject or Complete actions; Submit-only task forms fail unless explicitly planned
- Approval Print pages are read-only print-oriented surfaces and must not include editable inputs or workflow decision buttons
- Data List New/Edit forms prioritize all App Plan add/edit fields for the current list and Save/Cancel or Save/Submit actions; unrelated lower-page regions, Collection, filters, analytics, audit, and route preview are forbidden unless explicitly planned
- Data List View/Detail forms show current-record display fields and only App Plan-mapped related regions/actions
- Document Library New/Edit and View forms use document/file fields, metadata, linked record context, and open/download/preview or upload/save actions; generic approval/data-list patterns are not acceptable substitutes
- field labels and values must match business semantics; for example, contract title/name fields must not contain lifecycle status values, owner/person fields must not contain task/status labels, date fields must not contain document filenames, and document/evidence fields must not contain review comment text
- every form/detail artifact includes at least one meaningful `lowerPageBusinessRegions` entry with region name, purpose, source list/data source, displayed fields/items, action or read-only behavior, and proof impact
- lower-page regions must contain planned business data, records, history, evidence, or actions; blank space, `Page end`, generic notes, or design-stage explanation text do not satisfy full-page coverage
- every lower-page business region must show concrete visual UI representation in the canonical design artifact: rendered rows, cards, timeline entries, checklist rows, document evidence cards/table, activity feed rows, signature rows, or read-only field groups
- lower-page regions must declare `visualPattern`, `plannedYeeflowControl`, `renderedExampleCount`, `renderedExampleSummary`, `displayedBusinessFields`, `actionsShown`, `visualConcretenessStatus`, `antiPlaceholderStatus`, and `blueprintMappingHint`
- lower-page regions must keep `sourceListOrDataSource`, `regionPurpose`, `displayedBusinessFields`, `displayedFields`, `actionsShown`, `behavior`, `proofImpact`, and `blueprintMappingHint` semantically consistent; for example, Linked Contracts sourced from Contracts must not inherit Renewal Task fields/actions or mapping hints
- if `displayedBusinessFields` and `displayedFields` differ, the manifest must include `fieldAliasMap`, `semanticFieldMapping`, or an explicit proof/deferred explanation
- source-list notes such as `Source: Contract Documents`, field-name lists such as `Document name, type, status`, and `Show ...` explanatory text may appear only as supporting metadata; they must not be the actual visual implementation
- intentional empty-state lower regions must show an empty-state component with reason and next action; blank space or page-end markers are not valid empty states
- every form/detail artifact includes at least two `pageSpecificQualityEvidence` entries naming concrete business objects, fields, records, histories, actions, or planned resources
- generic visual quality phrases such as `strong visual hierarchy` or `professional spacing` are not enough for blueprint readiness unless paired with page-specific business evidence
- `templateReuseRiskStatus` must be `pass`, `warning`, `fail`, or `human_review_required`; `fail` and `human_review_required` block blueprint readiness unless explicitly deferred with reason, fallback, and proof impact
- similar Submission/Task/View forms may share visual style only when the manifest declares purposeful functional differences such as editable versus read-only fields, action row differences, decision panels, reviewer comments, workflow/history regions, print footer/signature blocks, or related-record sections
- every blueprint-ready artifact declares `visualUsabilityStatus`, `textOverflowStatus`, `overlapStatus`, `spacingStatus`, `mobileUsabilityStatus`, `responsiveLayoutEvidence`, `textWrappingStrategy`, `containerBoundaryEvidence`, and `visualUsabilityFindings`
- text overflow, element overlap, bad spacing, clipped content, or mobile layout pressure blocks `readyForBlueprint: true` unless explicitly deferred with reason, fallback, and proof impact

## 5. Application Visual Language

- Visual style:
- Density:
- Information hierarchy:
- Primary user workflow:
- Page-to-page consistency rules:

All generated design artifacts must share one coherent application-level style while allowing function-specific layouts.

## 6. Color Palette

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

## 7. Typography Scale

| Token | Size/Weight | Usage |
| --- | --- | --- |
| Page title |  |  |
| Section title |  |  |
| Body |  |  |
| Helper text |  |  |
| Table text |  |  |
| Form label |  |  |
| Badge text |  |  |

## 8. Spacing Scale

| Token | Value | Usage |
| --- | --- | --- |
| Page padding |  |  |
| Section gap |  |  |
| Card padding |  |  |
| Field gap |  |  |
| Table row height |  |  |
| Action gap |  |  |

## 9. Card And Container Style

- Card radius:
- Border/shadow:
- Background treatment:
- Section container pattern:
- Empty/error/loading state treatment:

## 10. Table Style

- Header style:
- Row style:
- Status/priority cells:
- Owner/person cells:
- Action cells:
- Empty/loading/error states:
- Mobile fallback:

## 11. Form Field Style

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
- Field/value semantic treatment:
- Lower-page business region treatment:
- Template reuse differentiation treatment:

## 12. Action Button Style

- Primary action:
- Secondary action:
- Destructive action:
- Icon/action treatment:
- Sticky/mobile action behavior:

## 13. Status Badge Style

- Status badge shape:
- Approval status colors:
- Renewal/urgency colors:
- Priority/condition colors:
- Accessibility notes:

## 14. KPI/Summary And Data Analytics Style

- KPI card structure:
- Summary value treatment:
- Trend/helper text:
- Data Analytics chart treatment:
- Empty/loading/error states:
- Mobile stacking:

## 15. Collection, Kanban, And Timeline Item Card Style

- Collection card layout:
- Kanban card layout:
- Vertical Timeline item layout:
- Horizontal Timeline item layout:
- Dynamic control placement:
- Item action placement:
- Empty/loading/error states:
- Mobile behavior:

## 16. Dashboard Surface Rules

- Required header/navigation shell:
- Page title/action area:
- Filter behavior:
- Detail/workbench panel behavior:
- Lower-page/page-end treatment:

## 17. Approval Form Surface Rules

- Submission form layout:
- Task form layout:
- Shared style rules:
- Expected submission/task differences:
- Print page layout:

## 18. Data List Custom Form Surface Rules

- Add/Edit layout:
- View/detail layout:
- Related-record sections:
- Action areas:
- Sub List/table treatment:

## 19. Mobile And Responsive Rules

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

## 20. Accessibility And Readability Notes

- Contrast:
- Touch targets:
- Keyboard/focus expectations:
- Readability:
- Error/validation clarity:

## 21. Design Proof Boundary

This document proves application-level design intent and visual consistency for later canonical image and Page Implementation Blueprint work. It does not prove Yeeflow package validity, control/property serialization, signing/API acceptance, install/upgrade success, or runtime behavior.

## 22. Deferred Or Unsupported Design Decisions

| Decision | Reason | Fallback | Proof Impact | Required Follow-up |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## 23. Implementation Token Mapping

HTML-first workflows must translate visual style intent through design-system tokens. Do not treat arbitrary CSS declarations as Yeeflow property support.

Define token families that HTML previews and Page Implementation Blueprints must preserve:

- `data-style-token` for typography, color, badge, table, form, card, action, and status treatments.
- `data-layout-token` for page shell, form sections, row/column patterns, lower-page regions, and action placement.
- `data-responsive-token` for mobile stacking, table/card fallbacks, action wrapping, and content priority.

Unsupported style tokens must be marked `export-learning-required`, `runtime-proof-required`, or `deferred` with reason, fallback, and proof impact before generation continues.
