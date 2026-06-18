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
- business decision gates are answered, default-approved, or listed as blockers
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

All fields, controls, variables, workflow nodes, form actions, schedule workflow properties, page controls, and configuration shapes must come from active plugin-known skills, standards, validators, template library entries, or export-proven references. Unknown capabilities must be marked `export-learning-required`, `runtime-proof-required`, or `deferred`. Temporary scripts and ad hoc generation logic must not bypass plugin knowledge.

## 5. App Plan Review Gate

Review the App Plan before any full-page design images, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, package/sign/upgrade, or runtime proof.

The review must confirm:

- required 23 sections are present
- Resource Generation Order uses the standard Yeeflow order
- Data Lists and Document Libraries include field names, field types, dependencies, validation, relationships, sample rows, and Placeholder planning
- Approval Forms include submission fields with Placeholder, task form fields with Placeholder, workflow nodes, assignments, form actions, temp variables, Query data, and Set data list targets
- Form Reports are standalone and based on Approval Forms
- Schedule workflows, AI Agents, Copilots, Custom Data List forms, Data List workflows, Notifications, Views, Dashboards, Navigation, and Permissions are planned or explicitly not applicable
- Dashboard planning is separate from Form Report planning
- Dashboard controls come from plugin-known controls, template library, validators, or export-proven references
- field/control/workflow/action/schedule/resource types are plugin-supported or marked for learning/proof/deferment
- Generation Contract and Hard Gates, Validation Plan, Proof Boundary, Assumptions, Deferred or Runtime-Proof Items, and Recommended Next Prompt are present

If the App Plan review fails, revise and validate again. A failed App Plan review gate blocks business clarification closure, generation-readiness review, design image generation, page blueprinting, resource/package generation, signing, install/import/upgrade, and runtime proof.

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

1. <Question>
   - Option A:
   - Option B:
   - Recommended default:
   - Why this matters:

Generation is paused until these questions are answered or defaults are explicitly approved.
```

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

Before design images, page implementation blueprints, resource/package generation, decoded resource-vs-blueprint parity, signing, install/import/upgrade, or runtime proof, also run:

```bash
node scripts/validate-functional-spec-to-app-plan-traceability.mjs --spec <functional-spec.md> --plan <app-plan.md>
```

Traceability fails when business objects, relationships, approvals, forms, workflows, reporting, documents, AI/Copilot, integrations, permissions, or UI/experience requirements in the Functional Specification are not mapped to Yeeflow resources, planning sections, or explicit deferred/not-applicable coverage in the App Plan. Deferred items must include a reason, fallback, proof impact, or follow-up. This validator proves planning traceability only; it does not prove generated package conformance or runtime behavior.

## 8. Decide Safe Build Scope

Choose the safest build scope that satisfies the reviewed Functional Specification and App Plan.

Default scope is the complete functional application described by the approved App Plan, not a simple MVP, unless the user requests staged generation or approves deferral. Staged generation is allowed when:

- the app is too large for one safe package
- critical information is missing and the user approves assumptions
- a focused runtime proof package is explicitly requested
- an advanced capability must be learned or runtime-proven before full generation

Do not defer core business capabilities silently.

## 9. Resource/Package Generation

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

## 10. Local Validation

Run the relevant safe local checks for the generated artifact and proof boundaries. At minimum, validate schema, graph/resource structure, Functional Specification/App Plan conformance, ID provenance for generated-final `.yapk`, navigation runtime metadata, approval forms, Form Reports, schedule workflows, AI/Copilot resources, custom data list forms, data-list workflows, notifications, views, dashboard controls, grid-table Collection patterns, root padding, plan-to-package conformance, and source/dist consistency as applicable.

Do not sign, install, import, upgrade, or run live Yeeflow writes unless explicitly authorized.

## 11. Runtime Import/Testing Only When Requested Or Authorized

Runtime proof is a separate layer from local validation, package schema validation, signing, API acceptance, and browser/design proof. Run runtime import/testing only when the user requests or authorizes it.

## 12. Runtime Issue Fixing

If authorized runtime testing finds issues, fix the smallest resource/package surface that addresses the issue, rerun local validation, and keep runtime proof boundaries explicit.

## 13. Documentation

Document generated artifacts, validation results, proof boundaries, deferred items, and known follow-up items.

## 14. Skill Updates Only If Reusable Knowledge Is Learned

Update skills, standards, validators, or references only when the run produces reusable Yeeflow knowledge. Keep tenant-specific details, raw API responses, raw package `Resource`, raw `Sign`, tenant URLs, full workspace IDs, raw user IDs, and private screenshots out of docs.

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
