# App Plan Generation Contract

Every generated Yeeflow application plan must follow the canonical `docs/standards/app-plan-standard-template.md` unless the user explicitly requests a lightweight plan. `docs/app-plan-standard-template.md` is a compatibility entrypoint only. A lightweight plan is allowed only when the user explicitly asks for a quick outline. Lightweight plans must still include Data Model and Lists, Forms and Approval Forms, Application Navigation, UI/UX and Control Mapping, Generation Contract and Hard Gates, Proof Boundary, and Assumptions/Deferred Items.

`Generation Contract and Hard Gates` is binding for later YAPK/YAP generation and validation; it is not background guidance.

Before design images, page implementation blueprints, resource generation, decoded resource-vs-blueprint parity, signing, install/upgrade, or runtime proof, the planning gates are executable:

- `scripts/validate-business-clarification-gate.mjs --spec <functional-spec.md> --plan <app-plan.md>`
- `scripts/validate-generation-readiness-review.mjs --plan <app-plan.md>`
- `scripts/validate-functional-spec-to-app-plan-traceability.mjs --spec <functional-spec.md> --plan <app-plan.md>`

These validators prove planning readiness and traceability only. They do not prove package schema validity, package conformance, signing/API acceptance, install/upgrade success, or runtime behavior.

The App Plan must explicitly plan how Data List records are displayed on pages before implementation begins. Each record-list section must choose Data table, Collection, Kanban, Vertical timeline, or Horizontal timeline and state the reason. Collection, Kanban, Vertical Timeline, and Horizontal Timeline controls must plan item-template Dynamic controls with source fields. Collection and Kanban controls must plan item actions or explicitly state `No Collection/Kanban item actions required`. Approval Forms and Custom Data List forms that use Sub List controls must plan Sub List list actions or explicitly state `No custom Sub List actions required`.

All App Plan resource types, field types, variable types, controls, Dynamic controls, workflow nodes, form actions, Collection/Kanban actions, Sub List actions, property paths, bindings, and configuration shapes must come from the active plugin's known skills, standards, validators, template library, control/property knowledge base, extension registry, or export-proven references. Unknown shapes must be marked `export-learning-required`, `runtime-proof-required`, or `deferred` and must not be treated as generation-ready.

Use this section in addition to the normal purpose, roles, process, lists/fields, list views, custom list forms, list workflows, scheduled workflows, notifications, forms, dashboards/pages, navigation, UI/UX mapping, custom code/custom CSS decisions, AI Agent/Copilot decisions, golden references, permissions, integrations, assumptions, deferred items, and proof boundary sections.

Northpeak reference note: `northpeak-resource-operations-plan.md` is the style reference for a complete plan because it uses numbered sections, plan status, target roles, process flow, navigation, detailed lists/fields, forms, dashboards/pages, UI/control mapping, golden template strategy, composition checklist, actions/workflow logic, permissions, integrations, document/attachment decisions, reports, validation, proof boundary, assumptions, deferred/runtime-proof items, and a recommended next prompt. Reuse that structure, not its business-specific content.

## Template

```md
## Generation Contract and Hard Gates

### Output Package
- Default output: `.yapk`
- `.yap` only if explicitly requested
- Package generation expected in this task: Yes/No
- Planning-only task: Yes/No
- Package handoff requires API signing when credentials are available: Yes/No

### YAPK Signing Gate
- Required when generating `.yapk` and OAuth/API-key access is available: Yes/No
- Required endpoints: `POST /utils/apppackage/setsign`, `POST /utils/apppackage/verifysign`
- Placeholder `Sign` may be described as upload-ready: No
- Local schema validation alone proves upload readiness: No
- Signing/install acceptance proves ID provenance or navigation runtime metadata completeness: No

### API-Issued Content ID Provenance Gate
- Required for generated-final `.yapk`: Yes
- Required API: `GET /utils/generate/ids?count=<n>`
- Local sequential counters, hardcoded generated IDs, copied sample/export IDs, random values, timestamps, UUID fallback, and deterministic local-only seeds allowed: No
- Required proof artifact: `dist/<app-name>-id-provenance-report.json`
- Source marker required: `api-generated`
- Non-API numeric generated content IDs allowed: No
- Generation must stop before signing, install, upgrade-check, or handoff when provenance validation fails: Yes

### YAPK Upgrade ID Stability Gate
- Required for generated-final `.yapk` upgrade/new-version output: Yes/No
- Previous package path:
- Previous ID lineage/provenance manifest:
- New ID lineage manifest:
- Existing resource IDs preserved for dashboards, approval forms, data lists, fields, layouts, workflows, user groups, AI Agents, Copilots, navigation, and persisted relationship IDs: Yes/No
- Only newly added resources receive new API-issued IDs: Yes/No
- Removed IDs reused for different objects: No
- Missing previous package/manifest may still be called upgrade-safe: No
- Generation must stop before signing, upgrade-check, upgrade, install-like writes, or handoff when ID stability validation fails: Yes

### Approval Form Contract
- Approval required: Yes/No
- Approval form:
- Request page:
- Task pages:
- Approval statuses:
- Workflow steps:
- Assignment task assignee plan:
  - Task name:
  - Assignment type: line manager / department manager / location manager / job position / explicit user / requester/submitter / other supported expression
  - Required job position name, if applicable:
  - Source: discovered existing job position / user-selected existing job position / admin-created after confirmation / unresolved / N/A
  - Proof status:
  - Fallback or blocker:
- Workflow control panel required: Yes/No
- Workflow history required: Yes/No
- DefResource required: Yes/No
- If deferred, user-approved staged build required: Yes/No
- Job-position assignments may use invented IDs or names: No
- Missing job positions block generation until resolved by discovery, user selection, or explicitly confirmed admin creation/update: Yes
- Job-position writes require explicit confirmation and confirmed system-admin permission: Yes
- Manager-based assignees must use supported expression-editor patterns and validator-backed shapes: Yes

### Navigation Runtime Contract
- Navigation Runtime Metadata Gate required for generated-final `.yapk`: Yes
- Group shape: `ID`, `AppID`, `ListSetID`, `Type: "classes"`, `Title`, `Icon`, and `list`
- Group `ID` must be API-issued and present in the ID provenance manifest
- Group `AppID` must equal the package/root AppID
- Group `ListSetID` must equal the current root `ListSet.ListID`
- Do not use `children`/`Childs` for runtime grouped navigation
- Every child item must include `AppID`, `Title`, `ListID`, `ListSetID`, and `Type`
- Page/dashboard entries: `Type: 103`, include `LayoutID`, and use `ListID = LayoutID`
- Approval form entries: `Type: 105`, `ListID = Forms[].Key`
- Data list entries: `Type: 1`, `ListID = Childs[].List.ListID`
- Unreachable resources allowed only if documented hidden/deferred
- Generation must stop before signing, install, upgrade-check, or handoff when navigation runtime metadata validation fails: Yes

### Dashboard Grid-Table Collection Pattern Contract
- Required when a dashboard record-list section claims the grid-table Collection pattern: Yes
- Dashboard record-list control choice stated for each section: Data table / Collection / Kanban / Vertical timeline / Horizontal timeline / none
- Record Display Control Selection reason stated for each Data List record section: Yes/No
- Use dashboard `data-list` control for grid-table dashboard sections: No, unless Data table is explicitly requested
- Item-template Dynamic controls planned for every Collection, Kanban, Vertical Timeline, or Horizontal Timeline: Yes/No
- Collection/Kanban item actions planned or explicitly marked `No Collection/Kanban item actions required`: Yes/No
- Header `flex_grid` paired with each grid-table Collection: Yes/No
- Header `flex_grid` and Collection wrapped in one container: Yes/No
- Wrapper sets `attrs.container.gap = 0`: Yes/No
- Wrapper sets `attrs.style.gap = [null, 0]`: Yes/No
- Row-click detail behavior planned: Yes/No
- If row-click detail is planned, Collection includes `attrs.data.link`, `attrs.data.opentype = "slide"`, and `attrs.data.modalsize = 2`: Yes/No
- If row-click detail is planned, each source data list has a concrete Type `1` custom detail layout: Yes/No
- Duplicate dashboard header hidden with `attrs.hideHeaderAll = true` when app shell/navigation provides context: Yes/No/Not applicable
- Dashboard title uses visible title typography such as `attrs.heads.ty = [null, "h5-medium"]`: Yes/No
- Text controls include width/positioning where needed, token typography, and plain-string color or validated color token: Yes/No
- Internal helper metadata enumerable in encoded package objects: No
- Type `1` custom detail layout `LayoutView = null` allowed: No
- Generation must stop before signing, install, upgrade-check, or handoff when planned dashboard grid-table Collection validation fails: Yes

### Plan-to-Package Conformance Contract
- Planned lists must exist: Yes/No
- Planned fields must exist: Yes/No
- Planned forms must exist: Yes/No
- Planned approval form must exist when required: Yes/No
- Planned task pages must exist: Yes/No
- Planned dashboards/pages must exist: Yes/No
- Planned navigation groups must exist: Yes/No
- Planned print pages must be reachable or intentionally hidden: Yes/No
- Planned workflows/actions must be implemented or explicitly deferred: Yes/No
- Planned record display controls, item-template Dynamic controls, Collection/Kanban actions, and Sub List list actions must be implemented or explicitly deferred: Yes/No
- Planned data-list views, custom list forms, public forms, and notifications must be implemented or explicitly deferred: Yes/No
- Planned scheduled workflows must be implemented or explicitly deferred: Yes/No
- Planned AI Agents, Copilots, knowledge resources, custom code, custom CSS, and golden/template references must be implemented or explicitly deferred: Yes/No
- Planned permissions/integrations must be implemented or explicitly deferred: Yes/No

### Advanced Capability Contract
- Custom code/control required: Yes/No/Deferred
- Custom CSS required: Yes/No/Deferred
- Data-list workflows required: Yes/No/Deferred
- Scheduled workflows required: Yes/No/Deferred
- Notifications required: Yes/No/Deferred
- AI Agent/Copilot/knowledge required: Yes/No/Deferred
- Golden/template references named for each advanced feature: Yes/No
- Plugin-supported type/property/action rule satisfied for controls, Dynamic controls, action types, property paths, bindings, and configuration shapes: Yes/No
- Runtime proof required before claiming execution/delivery works: Yes/No

### Proof Boundary Contract
- App plan approval status:
- Local schema validation status:
- ID provenance proof status:
- Navigation runtime metadata proof status:
- Dashboard grid-table Collection validation status:
- Wrapper gap validation status:
- Detail layout link validation status:
- Dashboard header visibility validation status:
- Dashboard title/text style validation status:
- Schema helper-leak validation status:
- App-plan conformance status:
- UI/control quality validation status:
- Data-list views/forms/workflows/notifications validation status:
- Scheduled workflow validation status:
- AI Agent/Copilot validation status:
- Custom code/custom CSS validation status:
- Golden/template conformance status:
- API signing status:
- API signature verification status:
- API install/import acceptance status:
- Application access link status after successful install/import:
  - Selected workspace: name/category/redacted ID preview
  - Installed/imported ListSetID: safe value or unavailable
  - Link: `<tenant-url>/#/list-set/41/<listset-id>` only when tenant URL comes from OAuth/session context and ListSetID is safely resolved
  - Fallback: `Application link: unavailable; ListSetID or tenant URL was not safely resolved.`
  - Boundary: API install/import success is not browser runtime proof; open the link and verify navigation, dashboards, lists, forms, and workflows.
- Runtime UI inspection status:
- Runtime/designer visual proof status:
- Evidence: ID allocation manifest and validator results
- Boundary: signing and install acceptance do not prove ID provenance, navigation runtime metadata completeness, or dashboard runtime/designer visual fidelity
- Workflow/notification/AI/custom-code execution proof status:
- Workflow assignment runtime proof status:
  - Assignment task assignee plan present: Yes/No
  - Job positions discovered/confirmed/user-selected/admin-created after confirmation/unresolved:
  - Manager expressions validator-backed: Yes/No
  - Runtime/browser workflow routing verified: Yes/No
  - Boundary: Workflow assignment correctness is not proven until runtime/browser verification.
- Deferred items:
- Known risks:

### Runtime Inspection Checklist
- App opens:
- Navigation groups render:
- Approval form appears:
- Request page opens:
- Task pages exist:
- Lists open:
- Dashboards/pages render:
- Dashboard header hidden when planned:
- Dashboard title size/style matches plan:
- Grid-table header and Collection have no visible gap:
- Collection row click opens planned slide detail:
- Detail modal size matches plan:
- Navigation refresh still renders the dashboard:
- Print pages are reachable if intended:
- Generated app matches approved plan:
```

## Validation Expectation

Use `scripts/validate-app-plan-resource-order.mjs <plan.md>` to check required Markdown headings, Yeeflow resource generation order, Placeholder planning, Form Report separation, record display control selection, item-template Dynamic control planning, Collection/Kanban action decisions, Sub List action decisions, plugin-supported type/property rules, and hard-gate text before package generation. Use `scripts/validate-business-clarification-gate.mjs`, `scripts/validate-generation-readiness-review.mjs`, and `scripts/validate-functional-spec-to-app-plan-traceability.mjs` to enforce business decision closure, 13-area planning readiness, App Plan control/action/property decisions, and Functional Specification to App Plan traceability before package generation. Use `scripts/validate-app-plan-conformance.mjs` after package generation to compare the generated app against the approved plan. Generation reports must keep local validation, API signing, API install/import acceptance, and runtime UI inspection as separate proof levels.
