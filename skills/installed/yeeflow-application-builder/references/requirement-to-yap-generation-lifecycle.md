# Yeeflow Requirement-to-Application Package Lifecycle

Use this lifecycle whenever the user provides Yeeflow application requirements, screenshots, sample forms, SOPs, process documents, sample exports, or app ideas and asks Codex to build, implement, create, generate, test, or output an application package, `.yap`, or `.yapk`.

The builder is the top-level application-building controller. Coordinate the application, data-list, approval-form, form-report, schedule-workflow, dashboard, AI Agent, Copilot, custom-code, package-validator, and expression generator skills as needed. Use proven plugin knowledge first; send genuinely unknown platform behavior to `yeeflow-feature-learning-orchestrator`.

## Trigger Behavior

Run this lifecycle for requests such as:

- "Build this Yeeflow app from the uploaded requirement."
- "Implement this application."
- "Generate the .yapk for this process."
- "Generate an upgrade .yapk for this existing application."
- "Create the Yeeflow application based on this document."
- "Use the current skills to build this app."
- "Here is the requirement. Please generate the final app package."
- "Create the app and test it in Yeeflow."

Do not generate an app when the user explicitly asks only for study, review, planning, or learning.

## Package Target Gate

Before generation, confirm package target and scope:

- New application defaults to `.yapk`.
- `.yap` is used only when explicitly requested or when a documented fallback/debug scope requires YAP.
- Existing application upgrade requires an official baseline `.yapk` from Yeeflow Version management, identity preservation, and ID stability.
- Existing application upgrades must not use fresh-ID clone generation rules unless the user explicitly asks for a cloned app.

## 1. Requirement Intake

Read all uploaded requirement files, screenshots, sample forms, sample exports, Markdown files, Word documents, PDFs, JSON files, and user notes.

Extract:

- business purpose
- source materials
- user roles
- app modules
- business objects
- data concepts
- data lists and document libraries
- approval/review needs
- form report needs
- data list custom forms
- dashboards/pages
- data list views
- workflows and automations
- notifications
- AI Agent or Copilot needs
- documents/files
- lookups/reference data
- sublists/line items
- calculations/expressions
- form actions
- query data needs
- integrations, if any
- risky, unsupported, or deferred features

Classify the input detail level as brief, moderate, detailed, document-backed, screenshot-backed, export-backed, or mixed. Preserve source files as references; do not copy them directly into the final requirements.

## 2. Functional Specification

Create a Functional Specification using:

`docs/standards/functional-specification-standard-template.md`

The Functional Specification is the business requirement document. It must describe what the business needs before selecting exact Yeeflow resources or package shapes.

For brief requirements:

- infer and supplement a complete business requirement document with explicit assumptions
- keep business-critical gaps as clarification questions
- avoid blocking on minor gaps that can be safely assumed

For detailed requirements:

- analyze and reorganize the material into the standard Functional Specification template
- preserve important details without copying whole source sections verbatim

For uploaded documents, screenshots, reference materials, or existing samples:

- treat them as supporting references
- produce a new standardized Functional Specification based on the understood requirements
- list original materials in Source Input Summary

Business-critical uncertainty must be recorded in Business Decision Gates and Risks, Constraints, and Unknowns.

## 3. Functional Specification Review Gate

Review the Functional Specification before creating the App Plan. The review must confirm:

- required 23 sections are present
- requirement interpretation method is explicit
- business purpose is clear
- target roles are identified
- business objects and data concepts are present or explicitly not applicable
- relationships and dependency rules are present or explicitly not applicable
- process, status lifecycle, approval/review, forms, workflow/action, reporting/dashboard, document/attachment, AI, integration, permissions, UI, assumptions, and risks are covered
- business decision gates are answered, `user-default-approved-for-generation`, not applicable, deferred with reason/fallback/proof impact, or listed as blockers
- Readiness for App Plan is marked Yes only when the specification is consistent and complete enough

If inconsistent, incomplete, or incorrect content is found, revise and validate again. A failed Functional Specification review gate blocks the Yeeflow App Plan stage.

## 4. Yeeflow App Plan

Create the Yeeflow App Plan only from the reviewed Functional Specification, using:

`docs/standards/app-plan-standard-template.md`

The App Plan is not a free-form plan, generic project plan, or ad hoc script plan. It is the Yeeflow resource generation contract and must convert business requirements into Yeeflow-supported resources in this standard order:

1. Data lists and Document libraries
2. Approval forms
3. Form reports
4. Schedule workflows
5. AI Agents
6. Copilots
7. Custom Data List forms
8. Data List workflows
9. Notifications
10. Data List views
11. Dashboard pages
12. Application navigation
13. Target users, roles, groups, and permissions

Form Report is an independent Yeeflow resource based on a specific Approval Form. It is not a Dashboard page, not a Data List view, and must not be mixed into Dashboard planning. Normally, one Approval Form should have one corresponding Form Report unless the plan states why not.

All fields, controls, Dynamic controls, variables, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, schedule workflow properties, page controls, property paths, bindings, and configuration shapes must come from active plugin-known skills, standards, validators, template library entries, control/property knowledge base entries, extension registry entries, or export-proven references. Unknown capabilities must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`. Temporary scripts and ad hoc generation logic must not bypass plugin knowledge.

## 5. App Plan Review Gate

Review the App Plan before the Full-page Canonical Design Artifacts stage, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, package/sign/upgrade, or runtime proof.

The review must confirm:

- required 23 sections are present
- Resource Generation Order uses the standard Yeeflow order
- Data Lists and Document Libraries include field names, field types, dependencies, validation, relationships, sample rows, and Placeholder planning
- Approval Forms include submission fields with Placeholder, task form fields with Placeholder, workflow nodes, assignments, form actions, temp variables, Query data, and Set data list targets
- Form Reports are standalone and based on Approval Forms
- Schedule workflows, AI Agents, Copilots, Custom Data List forms, Data List workflows, Notifications, Views, Dashboards, Navigation, and Permissions are planned or explicitly not applicable
- Dashboard planning is separate from Form Report planning
- Dashboard controls come from plugin-known controls, template library, validators, or export-proven references
- Dashboard/Page sections that display Data List records state selected display control and reason: Data table, Collection, Kanban, Vertical Timeline, or Horizontal Timeline
- Collection, Kanban, Vertical Timeline, and Horizontal Timeline controls include item-template Dynamic control planning with bound fields
- Collection and Kanban controls include item actions or explicitly state `No Collection/Kanban item actions required`
- Approval Forms and Custom Data List forms with Sub List controls include Sub List list actions or explicitly state `No custom Sub List actions required`
- field/control/Dynamic control/workflow/action/schedule/resource/property types are plugin-supported or marked for learning/proof/deferment
- Generation Contract and Hard Gates, Validation Plan, Proof Boundary, Assumptions, Deferred or Runtime-Proof Items, and Recommended Next Prompt are present

If the App Plan review fails, revise and validate again. A failed App Plan review gate blocks business clarification closure, generation-readiness review, full-page canonical design artifacts, page blueprinting, resource/package generation, signing, install/import/upgrade, and runtime proof.

## 6. Business Clarification Gate

After the Functional Specification and App Plan are drafted, identify business-critical decisions that are still unanswered.

Business-critical questions include anything that changes:

- workflow route
- approval responsibility
- quota/policy calculation
- status lifecycle
- data ownership
- pricing or amount calculation
- required attachments/documents
- persistence timing
- compliance/audit handling
- dashboard inclusion if it affects app scope
- integration responsibility
- role permissions
- what happens on approval/rejection/resubmission

When unanswered business decisions exist, output a clear question block in the Codex chat:

```text
Business clarification required before generation:

Artifacts:
- Functional Specification: <path>
- Yeeflow App Plan: <path>
- Validation report: <path or not generated>

Validation summary:
- Functional Specification structure: pass/fail
- App Plan resource order: pass/fail
- Functional Spec to App Plan traceability: pass/fail
- Generation Readiness structural check: pass/fail
- Business Clarification Gate for planning: pass/fail
- Business Clarification Gate for generation: blocked until user approves defaults or answers gates
- Overall generation readiness: blocked by Business Clarification Gate
- No package generation was performed

Unresolved business decision gates:

1. <gateKey>: <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

Approve all recommended defaults for: <gate1>, <gate2>, ...

No package generation will proceed until the business gates are answered or explicitly user-default-approved-for-generation.
```

The final planning response must enumerate every unresolved business decision gate by key and question. If it offers "approve all recommended defaults", it must explicitly name each gate covered by that approval option.

Stop after outputting the clarification block. Do not continue to Yeeflow resource/package generation in the same turn.

Generation may continue only after the user answers the questions or explicitly approves default assumptions.

When Functional Specification and/or App Plan Markdown artifacts exist, run:

```bash
node scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> --plan <app-plan.md>
```

The gate fails on unanswered, pending, TBD, open, requires-clarification, or generation-paused decision gates, and on decision tables that omit status/answer/default approval evidence. This validator proves clarification-gate document readiness only; it does not prove the business answer is correct.

## 7. Generation Readiness Review

Before generation, confirm:

- Functional Specification review gate passed
- App Plan review gate passed
- all required business decision gates are answered or defaults are explicitly approved
- mandatory business capabilities are not misclassified as future enhancements
- package target is `.yapk` by default for new applications, `.yap` only when explicitly requested/fallback scoped, or versioned `.yapk` for a safe existing-app upgrade
- technical assumptions have validation/fallback plans
- approval form design-quality gates are represented
- Form Report requirements are represented as standalone resources
- generated resource inventory matches required scope
- runtime-unproven features are marked as focused proof items or documented limitations
- plugin capability and standards compliance has no invented unsupported shapes

Stop if any required business decision gate remains unanswered or either review gate is failed.

When an App Plan Markdown artifact exists, run:

```bash
node scripts/validate-generation-readiness-review.mjs --plan <app-plan.md>
```

The review fails when any of the 13 Yeeflow resource areas is missing, empty, placeholder-only, or lacks concrete planned resources or explicit not-applicable/deferred/runtime-proof status. It also checks that Functional Specification review, App Plan review, business decision closure, and unsupported-shape gates are documented as passed. This validator proves planning readiness only; it does not prove package generation, schema validity, signing/API acceptance, install/upgrade success, or runtime behavior.

Validation reports must distinguish structural planning checks from overall generation readiness:

- Functional Specification structure: pass/fail
- App Plan resource order: pass/fail
- Functional Spec to App Plan traceability: pass/fail
- Generation Readiness structural check: pass/fail
- Business Clarification Gate for planning: pass/fail
- Business Clarification Gate for generation: pass/fail
- Overall generation readiness: pass only if all required planning gates pass for generation

If Generation Readiness structural check passes but generation-mode Business Clarification Gate fails, write `Overall generation readiness: blocked by Business Clarification Gate`. Do not write only `Validation passed` or `all passed` when business clarification is intentionally unresolved or only `default-applied-for-planning`.

When the same unresolved business decision gate appears in both the Functional Specification and App Plan, use the Business Clarification validator's deduplicated summary for user-facing reporting. Show raw finding count, unique unresolved gate count, unique gate keys, and occurrence locations when helpful. Do not make users infer five decisions from ten duplicated raw findings.

Before the Full-page Canonical Design Artifacts stage, page implementation blueprints, resource/package generation, decoded resource-vs-blueprint parity, signing, install/import/upgrade, or runtime proof, also run:

```bash
node scripts/validate-functional-spec-to-app-plan-traceability.mjs --spec <functional-spec.md> --plan <app-plan.md>
```

Traceability fails when business objects, relationships, approvals, forms, workflows, reporting, documents, AI/Copilot, integrations, permissions, or UI/experience requirements in the Functional Specification are not mapped to Yeeflow resources, planning sections, or explicit deferred/not-applicable coverage in the App Plan. Deferred items must include a reason, fallback, proof impact, or follow-up. This validator proves planning traceability only; it does not prove generated package conformance or runtime behavior.

## 8. Pattern-Library UI Generation

After the Functional Specification review, App Plan review, Business Clarification Gate for generation, Generation Readiness Review, and traceability gate pass, create the Application Design System and select Yeeflow UI Section Templates before Page Implementation Blueprints or resource/package generation.

This stage must produce:

- an Application Design System document using `docs/standards/application-design-system-template.md`
- a pattern-selection artifact using `docs/templates/yeeflow-ui-section-template-library.normalized.json`
- a validation/review report showing readiness for Page Implementation Blueprints

Generate the Application Design System before template selection. Every selected template, optional visual artifact, and Page Implementation Blueprint must reference the selected Application Design System. If the design system is missing, incomplete, generated after template selection, or not referenced by selected surfaces, stop before Page Implementation Blueprints.

The Application Design System must use exact official Yeeflow layout fields before any template selection, optional design image, or Page Implementation Blueprint is accepted:

- `applicationLayoutType`
- `applicationLayoutName`
- `applicationChromeStyleId`
- `headerMode`
- `navMode`
- `navBackgroundMode`
- `contentSafeArea`
- `layoutRuleSource: docs/standards/yeeflow-application-layout-design-rules.md`

Allowed `applicationLayoutType` values are exactly `application-layout-1-vertical-nav`, `application-layout-2-horizontal-nav`, `application-layout-3-header-nav`, and `application-layout-4-no-nav`. Free-form layout names such as `left navigation with compact header and content shell`, `custom sidebar`, `SaaS shell`, `compact header`, or arbitrary custom layout descriptions are not generation-ready and must fail the design-stage gate.

Required pattern-selection coverage:

- Dashboard pages, including operational home pages, workbench/queue pages, detail/workspace pages, reporting pages, KPI/Summary, Data Analytics, Data table, Collection, Kanban, Timeline, filters, action areas, and detail panels when planned
- Approval forms decomposed into one Submission form, planned Task forms, and planned Print pages
- Data List Add/Edit, View, Detail, and other custom forms when planned

Form Reports are excluded from required UI pattern surface coverage unless the App Plan explicitly requests a Form Report UI review. They remain standalone Yeeflow resources and must not be mixed into Dashboard design coverage.

Dashboard pages must reflect the selected Yeeflow Application Layout, including header/navigation/content shell where applicable. Dashboard manifest rows must include `applicationLayoutType`, `applicationChromeStyleId`, `includeHeaderNavigation: true`, `layoutFidelityStatus`, and a selected layout/chrome compliance declaration. Approval forms and Data List forms are complete form pages and do not need application header/navigation; use `form-surface-no-app-chrome` where a form row needs an explicit non-dashboard surface marker. All design artifacts must share the Application Design System's visual language, typography, spacing, color, card/container treatment, table style, form style, action style, badges, KPI/Summary style, Data Analytics style, and Collection/Kanban/Timeline item-card style.

Layout 1 vertical navigation must follow `docs/standards/yeeflow-application-layout-design-rules.md`: full-width dark top app header, persistent dark left vertical navigation connected to/below the header, content safe area to the right of the left nav and below the header, page title/action area inside the content safe area, no header hamburger, no bottom Collapse control, no arbitrary product sidebar, no detached left rail, no custom SaaS shell, no extra top navigation, and no mixed dark/light nav panels across pages. Layout 2 must not use a persistent left sidebar. Layout 3 must keep navigation on the header and must not add a second nav bar or left nav. Layout 4 must not invent sidebars, nav tabs, or replacement app shell navigation.

Every selected UI surface must map to one or more approved `templateId` values from the normalized registry. The selected templates must account for realistic business rows, cards, field labels, dates, statuses, owners, documents, tasks, action regions, relevant states, lower-page regions, and page end in the Page Implementation Blueprint.

Structural pattern coverage is not enough. The pattern-selection artifact must include `patternProofStatus`, selected template categories, required control mapping status, required field/binding/action mapping status, an anti-pattern check, and `readyForBlueprint` for each surface. `readyForBlueprint: true` is allowed only when template selection, category fit, required mappings, layout rules, and modern visual quality intent all pass. Reject generic scaffold pages, title-only or helper-text-heavy lower sections, placeholder chart regions without labels/context, arbitrary custom SaaS shells, weak KPI/Summary cards, unintentional Data Analytics regions, and pages without realistic business data examples or clear action priority.

Form/detail semantic quality is required for Approval Submission forms, Approval Task forms, Approval Print pages, Data List Add/Edit forms, Data List View forms, Data List Detail forms, and other custom form/detail surfaces. Manifest rows for these surfaces must declare `primaryBusinessObject`, `semanticFieldExamples`, `fieldValueSemanticsStatus`, `businessRegionEvidence`, `lowerPageBusinessRegions`, `formPurposeDifferentiators`, `templateReuseRiskStatus`, and `pageSpecificQualityEvidence`. Field labels and values must match business meaning; status values in title/name fields, task/status labels in owner/person fields, document filenames in date fields, person/vendor names in status fields, review comments in document/evidence fields, and status labels in related-record fields block blueprint readiness. Lower-page form/detail regions must contain planned business records, workflow or approval history, document evidence, related tasks/contracts/vendors/reminders, reviewer comments, audit/activity trails, validation messages, linked records, or print footer/signature blocks. Blank lower-page space, `Page end`, generic notes, and design-stage explanation text do not satisfy full-page coverage.

Lower-page form/detail regions must also be pattern-concrete before Page Implementation Blueprints. The selected template and blueprint contract must map rendered rows, Collection cards, timeline events, checklist rows, document table/cards, activity feed rows, signature rows, read-only field groups, or another Yeeflow-control-shaped UI representation for each lower-page business region. Manifest-only source notes and field lists are not enough: `Source: Contract Documents`, `Document name, type, status`, or `Show signed contract evidence` can support a region but cannot be the region's only implementation content. Each region must declare `visualPattern`, `selectedTemplateId`, `plannedYeeflowControl`, `renderedExampleCount` or empty-state fallback, `renderedExampleSummary`, `displayedBusinessFields`, `actionsShown`, `visualConcretenessStatus`, `antiPlaceholderStatus`, and `blueprintMappingHint`. Intentional empty states must map to an empty-state component with reason and next action. `readyForBlueprint: true` is blocked when lower-page pattern concreteness fails or needs human review without explicit reason, fallback, and proof impact.

Lower-page form/detail regions must also be semantically consistent. A region's source list/data source, purpose, displayed business fields, displayed implementation fields, actions, behavior, proof impact, and blueprint mapping hint must describe the same business object or a documented related-record relationship. Linked Contracts sourced from Contracts must not use Renewal Task fields/actions or point the blueprint mapping to Renewal Tasks; Renewal Task, Document, Approval History/Route, Audit Activity, Print Signature Block, and Checklist regions must use their corresponding field/action semantics. If `displayedBusinessFields` and `displayedFields` differ, the manifest must include `fieldAliasMap`, `semanticFieldMapping`, or explicit proof/deferred details.

Every blueprint-ready canonical design artifact must also satisfy surface responsibility and App Plan field/action coverage. Manifest rows must declare `appPlanResourceRef`, `sourceResourceType`, `sourceListOrFormName`, `surfaceResponsibility`, `plannedFieldCoverage`, `requiredFieldsShown`, `missingPlannedFields`, `fieldCoverageStatus`, `plannedActions`, `actionsShown`, `missingRequiredActions`, `actionCoverageStatus`, `forbiddenRegionsPresent`, `forbiddenRegionStatus`, `surfaceResponsibilityStatus`, and `appPlanTraceabilityStatus`. Surface type determines allowed controls, required fields, and required actions: Approval Submission forms capture planned request fields, Sub Lists, Save as draft, and Submit; Approval Task forms expose task decision/completion actions; Approval Print pages are read-only print-oriented surfaces; Data List New/Edit forms cover current-list add/edit fields and Save/Cancel or Save/Submit actions; Data List View/Detail forms show current-record display fields and explicitly planned related regions; Document Library forms cover file upload/preview/open/download and document metadata. Do not invent generic lower-page regions to fill page height. Logic-only validation checklists, route previews, audit activity, workflow history, and routing rules must not become visible UI unless the App Plan explicitly maps them to that surface.

For Data List and Document Library New/Edit surfaces, primary editable fields are the form body. They must be modeled as field groups and control mappings from selected form-body templates, not as `allowedRegions`, `relatedRegions`, or lower-page grids/cards/tables named `Primary form fields`, `Main form fields`, `Editable fields`, `Document metadata fields`, or similar. Do not duplicate primary Save/Cancel, Save/Submit, Upload/Save, Submit, Approve/Reject, or Complete action bars unless the App Plan explicitly requires a row/item/Sub List action with row/current-item context. Do not generate fake cards from field names or action names. Editable controls must distinguish label, placeholder, sample value, default value, empty value, and read-only current value; a field label must not be rendered as the field value. A parity pass against an invalid UI Surface Contract or HTML preview is not readiness: pattern selection, contract validation, HTML validation, HTML-to-Yeeflow control mapping validation, Blueprint pattern conformance, Blueprint parity, resource-vs-blueprint parity, package schema, signing/API acceptance, and runtime proof remain separate layers.

Every blueprint-ready canonical design artifact must pass visual usability gates as well as structural coverage. Manifest rows must declare `visualUsabilityStatus`, `textOverflowStatus`, `overlapStatus`, `spacingStatus`, `mobileUsabilityStatus`, `responsiveLayoutEvidence`, `textWrappingStrategy`, `containerBoundaryEvidence`, and `visualUsabilityFindings`. Text overflow, long labels outside containers, badge/button/table cell overflow, card/timeline/form field collisions, element overlap, bad spacing, clipped page-edge content, and mobile layout pressure block Page Implementation Blueprints unless explicitly deferred with reason, fallback, and proof impact. These checks prove design artifact readiness only, not Yeeflow package validity, signing/API acceptance, install/upgrade success, or runtime rendering.

Similar forms may share style, but they must not all be identical generic scaffolds when the business purpose differs. The manifest must declare purposeful functional differences such as editable versus read-only fields, decision controls, reviewer comments, workflow/history panels, related-record sections, print footer/signature blocks, or action row differences. `readyForBlueprint: true` is blocked when field/value semantic quality fails, lower-page business regions are missing or generic, page-specific quality evidence is missing or generic-only, or `templateReuseRiskStatus` is `fail`/`human_review_required` without reason, fallback, and proof impact.

The design stage must include mobile/responsive planning through either separate mobile canonical images for key pages or responsive rules documented in the Application Design System and Design Image Manifest. Responsive planning must cover stacking, grid column changes, table scroll or card-list fallback, Collection/Kanban/Timeline behavior, form fields becoming single-column, action behavior, navigation/header behavior, hidden/shown secondary fields, and desktop/mobile content consistency.

Run:

```bash
node scripts/validate-ui-pattern-selection.mjs --selection <pattern-selection.json>
```

This validator proves pattern-selection readiness for Page Implementation Blueprints only. It does not prove package validity, control/property serialization, signing/API acceptance, install/upgrade success, or runtime behavior.

## 9. Optional HTML-first UI Surface Contract Workflow

Use the HTML-first high-fidelity UI Surface Contract workflow only when the user explicitly asks for HTML previews, screenshots, or prototype evidence. It runs after pattern selection is structurally ready and before Page Implementation Blueprints.

This workflow inherits and enforces all pattern-library gates. It must not replace or bypass official Yeeflow dashboard layout/chrome, no-app-chrome form surfaces, full-page/page-end completeness, modern visual quality, surface responsibility, App Plan field/action coverage, forbidden-region checks, semantic consistency, lower-page visual concreteness, visual usability, text overflow/overlap/spacing/mobile-pressure checks, clipping checks, or template reuse risk. All optional HTML evidence must preserve the selected Application Design System and selected Yeeflow UI templates before screenshots and Page Implementation Blueprints.

Required order:

1. Application Design System.
2. Yeeflow UI Section Template / Pattern Selection.
3. UI Surface Contracts using `docs/standards/ui-surface-contract-template.md`.
4. High-fidelity HTML previews generated from the UI Surface Contracts, Application Design System, and selected templates.
5. DOM/layout/visual-quality validation.
6. HTML-to-Yeeflow control mapping validation using `docs/standards/html-to-yeeflow-control-mapping-registry.md`.
7. Desktop/mobile screenshot evidence captured from HTML previews.
8. Page Implementation Blueprints generated from the App Plan, selected templates, UI Surface Contract, Control Mapping Registry, and validated HTML mapping metadata.
9. Blueprint-to-UI Surface Contract and HTML mapping parity comparison.

PNG screenshots are evidence generated from validated HTML previews, not the primary implementation contract. HTML preview is not a low-fidelity scaffold; it must be a modern, polished, design-system-driven prototype equal to or better than generated static design images. It must use Application Design System tokens/classes, approved UI pattern templates, required DOM fields/actions, forbidden-region exclusion, responsive/mobile stack behavior, and text wrapping/truncation/container evidence.

HTML previews for complex business applications must also be control-mapped. Every implementation-relevant HTML element must declare stable Yeeflow mapping metadata such as `data-blueprint-id`, `data-yeeflow-control`, field/action/source-list bindings, row/current-item context, parent binding, and style/layout/responsive tokens. Page Implementation Blueprints must be generated from the UI Surface Contract plus the Control Mapping Registry plus HTML mapping metadata, not by visually guessing from HTML. Unsupported mappings block generation unless explicitly marked `export-learning-required`, `runtime-proof-required`, or `deferred` with reason, fallback, and proof impact. Style conversion must use design-system style tokens and supported Yeeflow property mappings, not arbitrary CSS copying.

Run:

```sh
node scripts/validate-ui-surface-contracts.mjs --contracts <dir-or-json> --app-plan <app-plan.md> --design-system <application-design-system.md>
node scripts/validate-html-preview-layout.mjs --contracts <dir-or-json> --html <dir> --screenshots <dir> --design-system <application-design-system.md>
node scripts/validate-html-to-yeeflow-control-mapping.mjs --contracts <dir-or-json> --html <dir> --registry docs/standards/html-to-yeeflow-control-mapping-registry.md
node scripts/compare-blueprint-to-ui-surface-contract.mjs --contracts <dir-or-json> --html <dir> --blueprints <dir-or-json> --registry docs/standards/html-to-yeeflow-control-mapping-registry.md --design-system <application-design-system.md>
```

Do not proceed to Page Implementation Blueprints if pattern selection, UI Surface Contract, HTML preview, visual quality, screenshot evidence, layout validation, or HTML-to-Yeeflow control mapping validation fails. Do not proceed to Yeeflow resource/package generation if blueprint pattern conformance or optional blueprint-to-contract/HTML mapping parity fails. Pattern validation, contract validation, HTML/DOM validation, HTML control mapping validation, screenshot evidence, blueprint parity, resource-vs-blueprint parity, package schema, signing/API acceptance, install/upgrade success, and runtime proof are separate proof layers.

The overlap heuristic for HTML preview validation must check meaningful sibling collisions and must not count parent-child containment as overlap.

## 10. Page Implementation Blueprints

Create Page Implementation Blueprints only after the Application Design System and UI pattern selection pass. When optional PNG/HTML evidence is explicitly requested, Blueprints must also consume the approved UI Surface Contract, Control Mapping Registry, validated HTML mapping metadata, screenshot evidence, canonical design images where used, and Design Image Manifest as review evidence. By default, Blueprints consume the approved App Plan, Application Design System, and selected Yeeflow UI templates as the implementation contract. Blueprints must preserve template IDs, proof status, control type, field binding, action contract, source list, row/current item context, parent binding, and style/layout/responsive token intent. Run `scripts/validate-blueprint-ui-pattern-conformance.mjs` before resource generation.

## 10. Decide Safe Build Scope

Choose the safest build scope that satisfies the reviewed Functional Specification and App Plan.

Default scope is the complete functional application described by the approved App Plan, not a simple MVP, unless the user requests staged generation or approves deferral. Staged generation is allowed when:

- the app is too large for one safe package
- critical information is missing and the user approves assumptions
- a focused runtime proof package is explicitly requested
- an advanced capability must be learned or runtime-proven before full generation

Do not defer core business capabilities silently.

## 11. Resource/Package Generation

Generate resources in the App Plan order:

1. Data lists and Document libraries
2. Approval forms
3. Form reports
4. Schedule workflows
5. AI Agents
6. Copilots
7. Custom Data List forms
8. Data List workflows
9. Notifications
10. Data List views
11. Dashboard pages
12. Application navigation
13. Target users, roles, groups, and permissions

Use only current proven generation rules:

- field types from plugin Data List / Document Library standards
- Approval Form field and variable types from plugin Approval Form standards
- workflow nodes and form actions from plugin workflow/action knowledge
- schedule workflow configs from plugin Schedule Workflow knowledge
- dashboard/page controls from plugin-known controls, template library, validators, or export-proven references
- runtime navigation metadata from current navigation hard gates
- API-issued IDs for generated-final `.yapk` output
- ID stability for upgrades from official baseline `.yapk`

Do not generate with temporary custom scripts that invent resource/control/action shapes outside the plugin standards. If a generator helper is needed, it must consume the reviewed Functional Specification, reviewed App Plan, plugin templates, validators, and export-proven references.

## 12. Local Validation

Run the relevant safe local checks for the generated artifact and proof boundaries. At minimum, validate schema, graph/resource structure, Functional Specification/App Plan conformance, ID provenance for generated-final `.yapk`, navigation runtime metadata, approval forms, Form Reports, schedule workflows, AI/Copilot resources, custom data list forms, data-list workflows, notifications, views, dashboard controls, grid-table Collection patterns, root padding, plan-to-package conformance, and source/dist consistency as applicable.

Do not sign, install, import, upgrade, or run live Yeeflow writes unless explicitly authorized.

## 13. Runtime Import/Testing Only When Requested Or Authorized

Runtime proof is a separate layer from local validation, package schema validation, signing, API acceptance, and browser/design proof. Run runtime import/testing only when the user requests or authorizes it.

## 12. Runtime Issue Fixing

If authorized runtime testing finds issues, fix the smallest resource/package surface that addresses the issue, rerun local validation, and keep runtime proof boundaries explicit.

## 13. Documentation

Document generated artifacts, validation results, proof boundaries, deferred items, and known follow-up items.

## 14. Skill Updates Only If Reusable Knowledge Is Learned

Update skills, standards, validators, or references only when the run produces reusable Yeeflow knowledge. Keep tenant-specific details, raw API responses, raw package `Resource`, raw `Sign`, tenant URLs, full workspace IDs, raw user IDs, and nonpublic visual evidence out of docs.

## 15. Git Commit/Push And Final Package Output

Commit and push only the intended safe source changes when requested. Final package output must separately report:

- Functional Specification status
- App Plan status
- local validation status
- signing status
- API acceptance status
- runtime/browser proof status
- deferred or runtime-proof-required items
- safety boundaries
