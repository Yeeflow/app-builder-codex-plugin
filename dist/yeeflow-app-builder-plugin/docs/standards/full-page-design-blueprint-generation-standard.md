# Full-Page Design Blueprint Generation Standard

Full-application Yeeflow generation is a staged evidence workflow. The default UI implementation source is the approved Yeeflow App Plan plus Yeeflow Root Token Reference plus Application Design System plus selected Yeeflow UI Section Templates from the plugin-contained pattern library. Optional PNG design images and HTML previews can support visual review, but generated Yeeflow controls, decoded resources, bindings, interactions, and runtime proof must trace back to a complete token-preserving, pattern-backed Page Implementation Blueprint.

## Mandatory Stage Order

1. Functional Specification.
2. Yeeflow App Plan.
3. Business Clarification Gate approved for generation and Generation Readiness final check.
4. Yeeflow Root Token Reference from `docs/standards/yeeflow-root-token-reference.normalized.json`.
5. Application Design System.
6. Yeeflow UI Section Template / Pattern Selection from `docs/templates/yeeflow-ui-section-template-library.normalized.json`.
7. Page Implementation Blueprint.
8. Blueprint Pattern Conformance Validation.
9. Yeeflow control/property contract validation.
10. Resource generation.
11. Decoded resource parity validation.
12. Local hard gates.
13. Package/sign/install/import/upgrade only after explicit write approval.
14. Runtime/browser proof only after Chrome/runtime evidence exists.

Do not start a later stage when the prior stage lacks completion evidence. Schema validation, signing, install, upgrade, decoded CSS, decoded controls, or ID stability do not prove UI fidelity or runtime behavior. Runtime proof cannot claim success until Chrome/runtime evidence exists.

## Default Pattern-Library UI Generation

The Yeeflow Root Token Reference, Application Design System, and Yeeflow UI Section Template Library create the default UI implementation contract from the approved Functional Specification and Yeeflow App Plan. This stage must not generate `.yap` or `.yapk` packages, sign packages, install/import/upgrade apps, or run live Yeeflow writes.

This stage must produce:

- an Application Design System document using `docs/standards/application-design-system-template.md` and `docs/standards/yeeflow-root-token-reference.normalized.json`
- a pattern-selection artifact for all required UI surfaces using `docs/templates/yeeflow-ui-section-template-library.normalized.json`
- a validation/review report showing readiness for the Page Implementation Blueprint stage

Generate the Application Design System from the Yeeflow Root Token Reference before template selection. Every selected surface-level template and Page Implementation Blueprint must reference the selected Application Design System and preserve token names. If the design system is missing, incomplete, generated after template selection, lacks root-token decisions, or is not referenced by selected surfaces, the pattern-selection stage fails and must not proceed to Page Implementation Blueprints.

Every surface must select one or more `templateId` values from the normalized registry. Template categories must match the surface type: dashboard pages use dashboard patterns; Approval Submission/Task surfaces use approval-form-workspace or form/detail templates; Approval Print pages use print/read-only form patterns; Data List and Document Library New/Edit forms use form-body templates for primary editable fields; related-record, Sub List, Collection, Kanban, and Timeline sections use item-template or collection-control patterns. Templates without a `category` are allowed only when their ID is recognized as a collection-control template such as `collection_control_*`.

Every selected template must preserve `patternProofStatus`: `runtime-proven`, `export-proven`, `inferred`, or `needs-golden-proof`. Required controls, child controls, fields, data bindings, and actions must map to blueprint controls or be explicitly deferred/inactive with reason, fallback, proof impact, and required follow-up.

Every selected pattern must also declare token intent inherited from the Application Design System. Pattern selection and Blueprints must preserve token names for page background, section/card background, border/divider, typography, action buttons, status badges/chips, table/list/card spacing, grid/flex gaps, form field gaps, and mobile/responsive spacing. Raw CSS values, arbitrary hex colors, raw font sizes, raw line heights, raw font weights, and raw spacing values cannot replace Yeeflow root token names when matching tokens exist.

Every selected pattern that uses icons must declare FontAwesome icon intent inherited from the Application Design System. Icon intent includes whether the selected pattern requires icons, semantic icon purpose, recommended FontAwesome class when known, tokenized icon color/size, and fallback proof label when uncertain. Emoji icons, inline SVG icons, image icons, and arbitrary custom icon names are forbidden as normal generated UI icons.

Forbidden misuse blocks blueprint/resource readiness:

- dashboard KPI/card templates as New/Edit form body
- generic lower-region templates for primary editable fields
- lower regions named `Primary form fields`, `Main form fields`, `Editable fields`, `Document metadata fields`, or similar
- HTML-only concepts such as DOM nodes, CSS classes, screenshots, or preview-only sections represented as Yeeflow controls
- generated PNG or HTML evidence overriding the App Plan, Application Design System, selected templates, or Page Implementation Blueprint

Run:

```bash
node scripts/validate-ui-pattern-selection.mjs --selection <pattern-selection.json>
node scripts/validate-yeeflow-root-token-usage.mjs --design-system <application-design-system.md>
node scripts/validate-yeeflow-root-token-usage.mjs --pattern-selection <pattern-selection.json>
```

This validator proves pattern-selection readiness only. It does not prove resource serialization, decoded parity, package validity, signing/API acceptance, install/upgrade success, or runtime behavior.

## Optional Full-Page Canonical Design Artifacts

The Full-page Canonical Design Artifacts stage is optional visual review evidence unless the user explicitly requests generated PNG design artifacts. It must not generate `.yap` or `.yapk` packages, sign packages, install/import/upgrade apps, or run live Yeeflow writes.

This stage must produce:

- an Application Design System document using `docs/standards/application-design-system-template.md`
- full-page canonical design images for requested UI surfaces
- a Design Image Manifest using `docs/standards/design-image-manifest-template.md`
- a validation/review report showing readiness for the Page Implementation Blueprint stage

Generate the Application Design System before any optional canonical design image. Every canonical design artifact and every Design Image Manifest row must reference the selected Application Design System and selected UI templates. If the design system or pattern selection is missing, incomplete, generated after images, or not referenced by the manifest rows, the design artifact stage fails and must not proceed to Page Implementation Blueprints.

Structural design coverage is not enough. The design artifact stage must also pass layout fidelity and modern visual quality gates before Page Implementation Blueprints:

- The Application Design System must choose exactly one official Yeeflow `applicationLayoutType`: `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, or `application-layout-4-no-nav`.
- The Application Design System must include `applicationLayoutName`, `applicationChromeStyleId`, `headerMode`, `navMode`, `navBackgroundMode`, `contentSafeArea`, and `layoutRuleSource: docs/standards/yeeflow-application-layout-design-rules.md`.
- Generated design images that use arbitrary custom SaaS shells, custom sidebars, detached left rails, extra top navigation, or free-form layout names such as `left navigation with compact header and content shell` must fail.
- Dashboard manifest rows must include `applicationLayoutType`, `applicationChromeStyleId`, `includeHeaderNavigation: true`, `layoutFidelityStatus`, and a selected layout/chrome compliance declaration.
- Approval form and Data List form surfaces are complete form pages and do not require application header/navigation; they may use `form-surface-no-app-chrome` as a non-dashboard surface marker.
- Every artifact must include `visualQualityStatus`, a modern visual quality checklist, and an anti-pattern check.
- `readyForBlueprint: true` is forbidden unless pattern selection passes, layout fidelity passes, modern visual quality passes, visual usability/text overflow/overlap/spacing/mobile usability pass or have reviewed risk evidence, and anti-pattern checks pass.

## Optional HTML-First UI Surface Contract Workflow

HTML previews remain supported as optional high-fidelity review/prototype evidence when explicitly requested. They are not required for normal application generation and must not override the approved App Plan, Application Design System, selected Yeeflow UI patterns, or Page Implementation Blueprint. When the user requests HTML evidence, the hard-gated path is:

```text
App Plan
-> Application Design System
-> Yeeflow UI Section Template / Pattern Selection
-> UI Surface Contract
-> High-fidelity HTML Preview
-> DOM/Layout/Visual Quality Validation
-> Screenshot Evidence
-> Page Implementation Blueprint
-> Blueprint-to-Contract comparison
```

The UI Surface Contract is a review/prototype contract for fields, actions, surface responsibility, allowed/forbidden regions, related regions, responsive behavior, and intended Yeeflow control mapping. It supports but does not replace the selected template and Page Implementation Blueprint. Use `docs/standards/ui-surface-contract-template.md` and validate with:

```bash
node scripts/validate-ui-surface-contracts.mjs --contracts <dir-or-json> --app-plan <app-plan.md> --design-system <application-design-system.md>
```

The high-fidelity HTML preview is an optional visual preview source. It must be generated from the UI Surface Contract, reference the Application Design System, use design-system tokens/classes, use approved UI pattern templates, render desktop and mobile variants, include required DOM sections/fields/actions, exclude forbidden regions, and meet modern visual quality expectations. HTML preview is not a low-fidelity scaffold, plain field dump, generic admin table, or arbitrary unstyled form. Use `docs/standards/html-preview-design-standard.md` and validate with:

```bash
node scripts/validate-html-preview-layout.mjs --contracts <dir-or-json> --html <dir> --screenshots <dir> --design-system <application-design-system.md>
```

Screenshots are evidence generated from validated HTML previews, not the source of truth. SVG is allowed only for icons, small visual assets, charts, or optional supplemental visuals, not as the primary app UI source for complex form/dashboard surfaces.

Generate Page Implementation Blueprints from the approved App Plan, Application Design System, selected Yeeflow UI patterns, and, when explicitly requested, the approved UI Surface Contract plus validated HTML mapping metadata. Then compare every blueprint back to the contract and design-system style intent:

```bash
node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts <dir-or-json> --blueprints <dir-or-json> --design-system <application-design-system.md>
```

`readyForBlueprint: true` requires UI pattern selection and blueprint pattern conformance by default. When using the optional HTML-first workflow, it also requires UI Surface Contract validation, HTML/DOM layout validation, HTML visual quality validation, screenshot evidence, and blueprint-to-contract comparison. Do not proceed to Yeeflow resource/package generation if blueprint-to-contract parity fails. Pattern validation, contract validation, HTML/DOM validation, screenshot evidence, blueprint parity, package schema validation, signing/API acceptance, install/upgrade success, and runtime proof are separate proof layers.

The HTML-first workflow inherits every pattern-library and optional visual-evidence gate. It does not replace the existing requirements for official application layout, dashboard chrome, no-app-chrome form surfaces, full-page/page-end completeness, modern visual quality, surface responsibility, App Plan field/action coverage, forbidden-region checks, semantic consistency, lower-page visual concreteness, visual usability, text overflow/overlap/spacing/mobile-pressure checks, clipping checks, and template reuse risk. Page Implementation Blueprints may start only when the selected template contract passes and the optional UI Surface Contract/HTML preview prove their additional review gates.

## Optional Canonical Page Design Images

PNG canonical page design images remain supported when the user explicitly requests visual review artifacts. They are optional visual review evidence, not a default implementation source. When requested, each page should have one canonical PNG at `assets/generated-ui/<app-slug>/NN-<page-slug>.design.png`. The canonical page image must be a full-page review artifact, not a first-viewport mockup. It must show all planned sections, major controls, tables, forms, cards, filters, actions, lower-page regions, and page end. A viewport-only screenshot or cropped top-page mockup fails unless the page truly has no below-fold content.

SVG files and combined design boards may support review, but they cannot replace the canonical per-page PNG. The design manifest must map page order, page title, page slug, canonical PNG path, optional source file, selected Yeeflow layout/chrome, and expected viewport.

When the optional visual evidence flow is requested, design coverage includes Dashboard pages, Approval Submission forms, planned Approval Task forms, planned Approval Print pages, and planned Data List Add/Edit, View, Detail, or other custom forms. Dashboard pages must include the selected application layout shell with header/navigation/content behavior where applicable. Approval forms and Data List custom forms are complete form pages and do not need the application header/navigation shell.

Form Reports are not part of the Full-page Canonical Design Images coverage requirement. Form Reports remain standalone Yeeflow resources and should be planned, generated, and validated in their own Form Report flow. Do not mix Form Report design coverage into Dashboard page design coverage.

Optional canonical design artifacts must show realistic business structure from the approved App Plan and selected UI templates, including meaningful rows, cards, status badges, field labels, dates, owners, documents, tasks, action regions, and relevant empty/error/loading states. They must include either mobile canonical images for key pages or responsive behavior documented in the Application Design System and Design Image Manifest.

Modern visual quality is part of blueprint readiness. Canonical images must show strong visual hierarchy, professional spacing and density, polished cards/sections, purposeful dashboard composition, meaningful KPI/Summary card design, intentional Data Analytics regions with labels/context, Collection/Kanban/Data table regions with realistic hierarchy and item detail, distinct but consistent page-specific layouts, clear action placement, and readable responsive/mobile behavior. Reject generic scaffold pages, title-only or helper-text-heavy lower sections, placeholder chart graphics without labels/context, and design-stage explanation text inside the UI unless it is actual product content.

Form/detail semantic quality is also part of blueprint readiness. Approval Submission forms, Approval Task forms, Approval Print pages, Data List Add/Edit forms, Data List View forms, Data List Detail forms, and other custom form/detail surfaces must show page-specific business content rather than a generic reusable scaffold. The Design Image Manifest must declare `primaryBusinessObject`, `semanticFieldExamples`, `fieldValueSemanticsStatus`, `businessRegionEvidence`, `lowerPageBusinessRegions`, `formPurposeDifferentiators`, `templateReuseRiskStatus`, and `pageSpecificQualityEvidence` for these surfaces.

Surface responsibility and App Plan field/action coverage are also required before Page Implementation Blueprints. A full-page design image must be faithful to the approved App Plan, not merely visually complete. The manifest must declare `appPlanResourceRef`, `sourceResourceType`, `sourceListOrFormName`, `surfaceResponsibility`, `plannedFieldCoverage`, `requiredFieldsShown`, `missingPlannedFields`, `fieldCoverageStatus`, `plannedActions`, `actionsShown`, `missingRequiredActions`, `actionCoverageStatus`, `forbiddenRegionsPresent`, `forbiddenRegionStatus`, `surfaceResponsibilityStatus`, and `appPlanTraceabilityStatus`. Approval Submission, Approval Task, Approval Print Page, Data List New/Edit, Data List View/Detail, Document Library New/Edit, and Document Library View surfaces have different responsibilities, required fields, required actions, and forbidden regions. `readyForBlueprint: true` is forbidden when App Plan fields are missing without deferral, required actions are missing, forbidden regions are present, surface responsibility fails, or App Plan traceability is unresolved.

Approval Submission forms must prioritize request input fields, planned Sub List controls, Save as draft, and Submit. Approval Task forms must prioritize task context, read-only request context, reviewer/task fields, and Approve/Reject or Complete actions. Approval Print pages must be read-only and print-oriented. Data List New/Edit forms must prioritize current-list add/edit fields plus Save/Cancel or Save/Submit actions, not decorative regions. Data List View/Detail forms must show current-record display fields and only App Plan-mapped related regions. Document Library forms must show document/file upload, metadata, linked record context, file preview/open/download behavior, and document-specific actions. Logic-only items such as validation checklists, route preview, audit activity, workflow history, and routing rules must not become visible UI unless the App Plan explicitly maps them to that surface.

Data List and Document Library New/Edit form primary fields are the form body. Do not promote those fields into lower-page regions named `Primary form fields`, `Main form fields`, `Editable fields`, `Document metadata fields`, or similar. Do not generate fake lower-region cards from field names or action names, and do not duplicate the primary Save/Cancel, Save/Submit, Upload/Save, or equivalent action bar. Blueprint parity must not preserve an invalid UI Surface Contract: contract validity, HTML validity, HTML-to-Yeeflow mapping parity, and Blueprint parity are separate proof layers, and each layer must reject generic primary field-body regions or duplicated primary actions before resource generation.

Editable field design and Blueprint mappings must distinguish placeholder, sample value, default value, empty value, and read-only current value. A label such as `Start date` cannot also be the rendered field value unless it is explicitly placeholder guidance with placeholder semantics and styling.

Field labels and sample values must match business semantics. Contract title/name fields must not contain lifecycle statuses such as `Active`; owner/person fields must not contain task/status values such as `Task overdue`; date fields must not contain document filenames; status fields must not contain person/vendor names; document/evidence fields must not contain review comment text; related-record fields must not contain validation/status labels. These automated checks are conservative guardrails and do not prove full business correctness.

Full-page form/detail artifacts must include meaningful lower-page business regions such as workflow history, approval decision history, reviewer comments, document checklists, related renewal tasks, related contracts, related vendors, related reminders, activity/audit trails, validation messages, linked records, document evidence, or print footer/signature blocks. `Page end`, blank space, generic notes, and design-stage explanation text do not satisfy lower-page coverage. Similar forms may share visual style, but the manifest must declare purposeful functional differences when the business purpose differs. `readyForBlueprint: true` is forbidden when semantic quality fails, lower-page business regions are missing or generic, page-specific quality evidence is missing or generic-only, or template reuse risk is `fail`/`human_review_required` without explicit deferral reason, fallback, and proof impact.

Lower-page business regions must also be visually concrete in the canonical PNG/design contract before Page Implementation Blueprints. The design image must show the intended runtime-like representation, such as a Data table, Collection cards, Kanban board, Vertical or Horizontal Timeline, Dynamic Sub List, checklist rows, related-record cards, document table/cards, activity feed, workflow/approval timeline, signature block, or read-only field group. Manifest declarations, source-list notes, and field-name lists are not enough by themselves: text such as `Source: Contract Documents`, `Document name, type, status`, or `Show signed contract evidence` may support the design contract but cannot replace rendered rows/cards/items. Each lower-page region must declare `visualPattern`, `plannedYeeflowControl`, `renderedExampleCount`, `renderedExampleSummary`, `displayedBusinessFields`, `actionsShown`, `visualConcretenessStatus`, `antiPlaceholderStatus`, and `blueprintMappingHint`. `renderedExampleCount` must be greater than zero unless an intentional empty-state component is shown with reason and next action. `readyForBlueprint: true` is forbidden when lower-page visual concreteness fails or requires human review without explicit deferral reason, fallback, and proof impact.

Lower-page visual concreteness is not enough if the region inherits the wrong business semantics. The manifest must keep `sourceListOrDataSource`, `regionPurpose`, `displayedBusinessFields`, `displayedFields`, `actionsShown`, `behavior`, `proofImpact`, and `blueprintMappingHint` aligned to the same business object or to an explicitly documented related-record relationship. Contract/Linked Contracts regions sourced from Contracts must not use Renewal Task fields/actions such as `Task`, `Due date`, `Priority`, `Open task detail`, or `Mark complete`, and their blueprint mapping must not point to Renewal Tasks unless the region is explicitly a renewal-task related region. Document regions must use document/evidence fields and actions; Approval History/Route regions must use reviewer, decision, timestamp/status/step semantics; Audit Activity regions must use activity/actor/timestamp/record semantics; Print Signature Block regions must use signer/reviewer/role/decision/signature/date semantics; Checklist regions must use checklist item/status/owner/evidence or required-document semantics. If `displayedBusinessFields` and `displayedFields` differ, the manifest must include `fieldAliasMap`, `semanticFieldMapping`, or explicit runtime-proof/deferred details.

Canonical design artifacts must also pass visual usability before Page Implementation Blueprints. Blueprint-ready rows must declare `visualUsabilityStatus`, `textOverflowStatus`, `overlapStatus`, `spacingStatus`, `mobileUsabilityStatus`, `responsiveLayoutEvidence`, `textWrappingStrategy`, `containerBoundaryEvidence`, and `visualUsabilityFindings`. Reject canonical images or SVG/source artifacts with obvious text overflow, button/badge/table label overflow, card title/subtitle collision, timeline/event label overlap, cramped Kanban/Collection cards, form field label/value overflow, section heading/action collision, clipped page-edge content, inconsistent spacing, or mobile layouts that preserve desktop multi-column pressure without stacking/scroll/card-list fallback. Long text must wrap, truncate with an intentional ellipsis strategy, or receive a wider/responsive layout. These visual usability gates prove design artifact readiness only; they do not prove Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.

## Page Implementation Blueprint

Before generating Yeeflow resources, every page requires a blueprint with:

- page purpose and selected Yeeflow layout/chrome
- selected Yeeflow UI Section Template IDs and proof status
- Yeeflow Root Token Reference and Application Design System token mapping
- full section list
- pattern-to-control mapping for every required control and visible element
- control hierarchy, control type, `id`, `nv_label`, and parent/child relationships
- exact Yeeflow property paths for width, height, gap, margin, padding, border, background, shadow, and typography
- page background token
- section/card background token
- border/divider token
- typography token mapping for title, body, label, helper, button, badge, table/list, and mobile variants
- action button normal/hover/active token mapping
- status badge/chip success/warning/danger token mapping
- table/list/card spacing token mapping
- grid/flex gap token mapping
- form field gap token mapping
- mobile/responsive spacing token mapping
- icon control mapping:
  - Yeeflow control type: `icon`
  - FontAwesome class, for example `fa-regular fa-file` or `fa-solid fa-check`
  - semantic purpose
  - color token
  - size token or supported size property
  - action binding if clickable
  - accessible/semantic label or tooltip intent for icon-only actions
- data source/list/field bindings
- Summary/KPI aggregation bindings
- Data Filter variables and target consumption
- Collection/table columns and row detail links
- Dynamic user/person, progress/status/badge, and action metadata
- runtime proof plan

Every property path must be validated against `docs/reference/yeeflow-control-configurations.normalized.json` or `docs/reference/yeeflow-control-property-extensions.json`. Container `attrs.style` rules and non-Container `attrs.common` rules remain separate.

Run:

```bash
node scripts/validate-blueprint-ui-pattern-conformance.mjs --blueprint page-implementation-blueprint.json --pattern-selection pattern-selection.json
node scripts/validate-yeeflow-root-token-usage.mjs --blueprint page-implementation-blueprint.json
```

`readyForResourceGeneration: true` is blocked when required controls, child controls, fields, bindings, actions, template category, template existence, forbidden misuse, proof status, token mapping, token-name preservation, or custom-value proof labels fail.

## Resource Parity

After generation, inspect decoded JSON and compare it to the blueprint. All sections and mapped controls must exist, hierarchy and types must match, `nv_label` values must remain semantic, required properties and bindings must exist, action metadata must be present, visible text must not show raw variables, and collection/detail/form links must resolve.

Run:

```bash
node scripts/validate-full-page-design-artifacts.mjs --manifest design-image-manifest.json
node scripts/validate-ui-pattern-selection.mjs --selection pattern-selection.json
node scripts/validate-yeeflow-root-token-usage.mjs --design-system application-design-system.md
node scripts/validate-yeeflow-root-token-usage.mjs --pattern-selection pattern-selection.json
node scripts/validate-ui-surface-contracts.mjs --contracts ui-surface-contracts --app-plan app-plan.md --design-system application-design-system.md
node scripts/validate-html-preview-layout.mjs --contracts ui-surface-contracts --html html-previews --screenshots screenshots --design-system application-design-system.md
node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts ui-surface-contracts --blueprints page-implementation-blueprints --design-system application-design-system.md
node scripts/inspect-full-page-design-artifacts.mjs --manifest design-image-manifest.json
node scripts/inspect-page-implementation-blueprint.mjs --blueprint page-implementation-blueprint.json
node scripts/validate-blueprint-ui-pattern-conformance.mjs --blueprint page-implementation-blueprint.json --pattern-selection pattern-selection.json
node scripts/validate-yeeflow-root-token-usage.mjs --blueprint page-implementation-blueprint.json
node scripts/compare-blueprint-to-decoded-resource.mjs --blueprint page-implementation-blueprint.json --resource decoded-resource.json
```

These checks are local and synthetic/redacted-safe. They do not claim pixel-perfect comparison, runtime UI success, signing success, or live Yeeflow runtime proof.

## HTML Mapping Parity Before Resource Generation

For HTML-first workflows, Page Implementation Blueprints must be generated from:

1. the approved UI Surface Contract,
2. `docs/standards/html-to-yeeflow-control-mapping-registry.md`,
3. the control-mapped HTML preview, and
4. the Application Design System tokens.

Blueprint generation must not infer Yeeflow controls from HTML appearance. Every field, action, list region, current item context, source list, binding, and style/layout/responsive intent must come from contract and HTML mapping metadata.

Blueprint readiness is blocked when a mapped HTML element lacks `data-blueprint-id`, `data-yeeflow-control` is unknown or unsupported, HTML field/action/list metadata differs from the UI Surface Contract, style intent exists only as arbitrary CSS, the Blueprint changes control type/source list/binding/action contract/row context/style token intent, or the Blueprint adds implementation-relevant controls not declared by the UI Surface Contract or HTML mapping. Hidden/helper/runtime controls are allowed only when the UI Surface Contract declares them explicitly and the Blueprint preserves that helper boundary.

Run:

```bash
node scripts/validate-html-to-yeeflow-control-mapping.mjs --contracts ui-surface-contracts --html html-previews --registry docs/standards/html-to-yeeflow-control-mapping-registry.md
node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts ui-surface-contracts --html html-previews --blueprints page-implementation-blueprints --registry docs/standards/html-to-yeeflow-control-mapping-registry.md
```
