# Full-Page Design Blueprint Generation Standard

Full-application Yeeflow generation is a staged evidence workflow. A visually polished canonical image is not enough: the generated Yeeflow controls, decoded resources, bindings, interactions, and runtime proof must trace back to a complete design and blueprint contract.

## Mandatory Stage Order

1. Functional Specification.
2. Yeeflow App Plan.
3. Business Clarification Gate approved for generation and Generation Readiness final check.
4. Full-page Canonical Design Artifacts stage.
5. Page Implementation Blueprint.
6. Yeeflow control/property contract validation.
7. Resource generation.
8. Decoded resource parity validation.
9. Local hard gates.
10. Package/sign/upgrade only after explicit write approval.
11. Runtime/browser proof only after Chrome/runtime evidence exists.

Do not start a later stage when the prior stage lacks completion evidence. Schema validation, signing, install, upgrade, decoded CSS, decoded controls, or ID stability do not prove UI fidelity or runtime behavior. Runtime proof cannot claim success until Chrome/runtime evidence exists.

## Full-Page Canonical Design Artifacts

The Full-page Canonical Design Artifacts stage creates the application-level visual contract from the approved Functional Specification and Yeeflow App Plan. It must not generate `.yap` or `.yapk` packages, sign packages, install/import/upgrade apps, or run live Yeeflow writes.

This stage must produce:

- an Application Design System document using `docs/standards/application-design-system-template.md`
- full-page canonical design images for all required UI surfaces
- a Design Image Manifest using `docs/standards/design-image-manifest-template.md`
- a validation/review report showing readiness for the Page Implementation Blueprint stage

Generate the Application Design System before any canonical design image. Every canonical design artifact and every Design Image Manifest row must reference the selected Application Design System. If the design system is missing, incomplete, generated after images, or not referenced by the manifest rows, the design artifact stage fails and must not proceed to Page Implementation Blueprints.

Structural design coverage is not enough. The design artifact stage must also pass layout fidelity and modern visual quality gates before Page Implementation Blueprints:

- The Application Design System must choose exactly one official Yeeflow `applicationLayoutType`: `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, or `application-layout-4-no-nav`.
- The Application Design System must include `applicationLayoutName`, `applicationChromeStyleId`, `headerMode`, `navMode`, `navBackgroundMode`, `contentSafeArea`, and `layoutRuleSource: docs/standards/yeeflow-application-layout-design-rules.md`.
- Generated design images that use arbitrary custom SaaS shells, custom sidebars, detached left rails, extra top navigation, or free-form layout names such as `left navigation with compact header and content shell` must fail.
- Dashboard manifest rows must include `applicationLayoutType`, `applicationChromeStyleId`, `includeHeaderNavigation: true`, `layoutFidelityStatus`, and a selected layout/chrome compliance declaration.
- Approval form and Data List form surfaces are complete form pages and do not require application header/navigation; they may use `form-surface-no-app-chrome` as a non-dashboard surface marker.
- Every artifact must include `visualQualityStatus`, a modern visual quality checklist, and an anti-pattern check.
- `readyForBlueprint: true` is forbidden unless layout fidelity passes, modern visual quality passes, visual usability/text overflow/overlap/spacing/mobile usability pass or have reviewed risk evidence, and anti-pattern checks pass.

## Canonical Page Design Images

Each page must have one canonical PNG at `assets/generated-ui/<app-slug>/NN-<page-slug>.design.png`. The canonical page image must be a full-page implementation artifact, not a first-viewport mockup. It must show all planned sections, major controls, tables, forms, cards, filters, actions, lower-page regions, and page end. A viewport-only screenshot or cropped top-page mockup fails unless the page truly has no below-fold content.

SVG files and combined design boards may support review, but they cannot replace the canonical per-page PNG. The design manifest must map page order, page title, page slug, canonical PNG path, optional source file, selected Yeeflow layout/chrome, and expected viewport.

Required design coverage includes Dashboard pages, Approval Submission forms, planned Approval Task forms, planned Approval Print pages, and planned Data List Add/Edit, View, Detail, or other custom forms. Dashboard pages must include the selected application layout shell with header/navigation/content behavior where applicable. Approval forms and Data List custom forms are complete form pages and do not need the application header/navigation shell.

Form Reports are not part of the Full-page Canonical Design Images coverage requirement. Form Reports remain standalone Yeeflow resources and should be planned, generated, and validated in their own Form Report flow. Do not mix Form Report design coverage into Dashboard page design coverage.

Canonical design artifacts must show realistic business structure from the approved App Plan, including meaningful rows, cards, status badges, field labels, dates, owners, documents, tasks, action regions, and relevant empty/error/loading states. They must include either mobile canonical images for key pages or responsive behavior documented in the Application Design System and Design Image Manifest.

Modern visual quality is part of blueprint readiness. Canonical images must show strong visual hierarchy, professional spacing and density, polished cards/sections, purposeful dashboard composition, meaningful KPI/Summary card design, intentional Data Analytics regions with labels/context, Collection/Kanban/Data table regions with realistic hierarchy and item detail, distinct but consistent page-specific layouts, clear action placement, and readable responsive/mobile behavior. Reject generic scaffold pages, title-only or helper-text-heavy lower sections, placeholder chart graphics without labels/context, and design-stage explanation text inside the UI unless it is actual product content.

Form/detail semantic quality is also part of blueprint readiness. Approval Submission forms, Approval Task forms, Approval Print pages, Data List Add/Edit forms, Data List View forms, Data List Detail forms, and other custom form/detail surfaces must show page-specific business content rather than a generic reusable scaffold. The Design Image Manifest must declare `primaryBusinessObject`, `semanticFieldExamples`, `fieldValueSemanticsStatus`, `businessRegionEvidence`, `lowerPageBusinessRegions`, `formPurposeDifferentiators`, `templateReuseRiskStatus`, and `pageSpecificQualityEvidence` for these surfaces.

Surface responsibility and App Plan field/action coverage are also required before Page Implementation Blueprints. A full-page design image must be faithful to the approved App Plan, not merely visually complete. The manifest must declare `appPlanResourceRef`, `sourceResourceType`, `sourceListOrFormName`, `surfaceResponsibility`, `plannedFieldCoverage`, `requiredFieldsShown`, `missingPlannedFields`, `fieldCoverageStatus`, `plannedActions`, `actionsShown`, `missingRequiredActions`, `actionCoverageStatus`, `forbiddenRegionsPresent`, `forbiddenRegionStatus`, `surfaceResponsibilityStatus`, and `appPlanTraceabilityStatus`. Approval Submission, Approval Task, Approval Print Page, Data List New/Edit, Data List View/Detail, Document Library New/Edit, and Document Library View surfaces have different responsibilities, required fields, required actions, and forbidden regions. `readyForBlueprint: true` is forbidden when App Plan fields are missing without deferral, required actions are missing, forbidden regions are present, surface responsibility fails, or App Plan traceability is unresolved.

Approval Submission forms must prioritize request input fields, planned Sub List controls, Save as draft, and Submit. Approval Task forms must prioritize task context, read-only request context, reviewer/task fields, and Approve/Reject or Complete actions. Approval Print pages must be read-only and print-oriented. Data List New/Edit forms must prioritize current-list add/edit fields plus Save/Cancel or Save/Submit actions, not decorative regions. Data List View/Detail forms must show current-record display fields and only App Plan-mapped related regions. Document Library forms must show document/file upload, metadata, linked record context, file preview/open/download behavior, and document-specific actions. Logic-only items such as validation checklists, route preview, audit activity, workflow history, and routing rules must not become visible UI unless the App Plan explicitly maps them to that surface.

Field labels and sample values must match business semantics. Contract title/name fields must not contain lifecycle statuses such as `Active`; owner/person fields must not contain task/status values such as `Task overdue`; date fields must not contain document filenames; status fields must not contain person/vendor names; document/evidence fields must not contain review comment text; related-record fields must not contain validation/status labels. These automated checks are conservative guardrails and do not prove full business correctness.

Full-page form/detail artifacts must include meaningful lower-page business regions such as workflow history, approval decision history, reviewer comments, document checklists, related renewal tasks, related contracts, related vendors, related reminders, activity/audit trails, validation messages, linked records, document evidence, or print footer/signature blocks. `Page end`, blank space, generic notes, and design-stage explanation text do not satisfy lower-page coverage. Similar forms may share visual style, but the manifest must declare purposeful functional differences when the business purpose differs. `readyForBlueprint: true` is forbidden when semantic quality fails, lower-page business regions are missing or generic, page-specific quality evidence is missing or generic-only, or template reuse risk is `fail`/`human_review_required` without explicit deferral reason, fallback, and proof impact.

Lower-page business regions must also be visually concrete in the canonical PNG/design contract before Page Implementation Blueprints. The design image must show the intended runtime-like representation, such as a Data table, Collection cards, Kanban board, Vertical or Horizontal Timeline, Dynamic Sub List, checklist rows, related-record cards, document table/cards, activity feed, workflow/approval timeline, signature block, or read-only field group. Manifest declarations, source-list notes, and field-name lists are not enough by themselves: text such as `Source: Contract Documents`, `Document name, type, status`, or `Show signed contract evidence` may support the design contract but cannot replace rendered rows/cards/items. Each lower-page region must declare `visualPattern`, `plannedYeeflowControl`, `renderedExampleCount`, `renderedExampleSummary`, `displayedBusinessFields`, `actionsShown`, `visualConcretenessStatus`, `antiPlaceholderStatus`, and `blueprintMappingHint`. `renderedExampleCount` must be greater than zero unless an intentional empty-state component is shown with reason and next action. `readyForBlueprint: true` is forbidden when lower-page visual concreteness fails or requires human review without explicit deferral reason, fallback, and proof impact.

Lower-page visual concreteness is not enough if the region inherits the wrong business semantics. The manifest must keep `sourceListOrDataSource`, `regionPurpose`, `displayedBusinessFields`, `displayedFields`, `actionsShown`, `behavior`, `proofImpact`, and `blueprintMappingHint` aligned to the same business object or to an explicitly documented related-record relationship. Contract/Linked Contracts regions sourced from Contracts must not use Renewal Task fields/actions such as `Task`, `Due date`, `Priority`, `Open task detail`, or `Mark complete`, and their blueprint mapping must not point to Renewal Tasks unless the region is explicitly a renewal-task related region. Document regions must use document/evidence fields and actions; Approval History/Route regions must use reviewer, decision, timestamp/status/step semantics; Audit Activity regions must use activity/actor/timestamp/record semantics; Print Signature Block regions must use signer/reviewer/role/decision/signature/date semantics; Checklist regions must use checklist item/status/owner/evidence or required-document semantics. If `displayedBusinessFields` and `displayedFields` differ, the manifest must include `fieldAliasMap`, `semanticFieldMapping`, or explicit runtime-proof/deferred details.

Canonical design artifacts must also pass visual usability before Page Implementation Blueprints. Blueprint-ready rows must declare `visualUsabilityStatus`, `textOverflowStatus`, `overlapStatus`, `spacingStatus`, `mobileUsabilityStatus`, `responsiveLayoutEvidence`, `textWrappingStrategy`, `containerBoundaryEvidence`, and `visualUsabilityFindings`. Reject canonical images or SVG/source artifacts with obvious text overflow, button/badge/table label overflow, card title/subtitle collision, timeline/event label overlap, cramped Kanban/Collection cards, form field label/value overflow, section heading/action collision, clipped page-edge content, inconsistent spacing, or mobile layouts that preserve desktop multi-column pressure without stacking/scroll/card-list fallback. Long text must wrap, truncate with an intentional ellipsis strategy, or receive a wider/responsive layout. These visual usability gates prove design artifact readiness only; they do not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.

## Page Implementation Blueprint

Before generating Yeeflow resources, every page requires a blueprint with:

- page purpose and selected Yeeflow layout/chrome
- full section list
- design-to-control mapping for every visible element
- control hierarchy, control type, `id`, `nv_label`, and parent/child relationships
- exact Yeeflow property paths for width, height, gap, margin, padding, border, background, shadow, and typography
- data source/list/field bindings
- Summary/KPI aggregation bindings
- Data Filter variables and target consumption
- Collection/table columns and row detail links
- Dynamic user/person, progress/status/badge, and action metadata
- runtime proof plan

Every property path must be validated against `docs/reference/yeeflow-control-configurations.normalized.json` or `docs/reference/yeeflow-control-property-extensions.json`. Container `attrs.style` rules and non-Container `attrs.common` rules remain separate.

## Resource Parity

After generation, inspect decoded JSON and compare it to the blueprint. All sections and mapped controls must exist, hierarchy and types must match, `nv_label` values must remain semantic, required properties and bindings must exist, action metadata must be present, visible text must not show raw variables, and collection/detail/form links must resolve.

Run:

```bash
node scripts/validate-full-page-design-artifacts.mjs --manifest design-image-manifest.json
node scripts/inspect-full-page-design-artifacts.mjs --manifest design-image-manifest.json
node scripts/inspect-page-implementation-blueprint.mjs --blueprint page-implementation-blueprint.json
node scripts/compare-blueprint-to-decoded-resource.mjs --blueprint page-implementation-blueprint.json --resource decoded-resource.json
```

These checks are local and synthetic/redacted-safe. They do not claim pixel-perfect comparison, runtime UI success, signing success, or live Yeeflow runtime proof.
