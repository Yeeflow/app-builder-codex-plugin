# App Plan Generation Contract

Every generated Yeeflow application plan must include `Generation Contract and Hard Gates`. This section is binding for later YAPK/YAP generation and validation; it is not background guidance.

Use this section in addition to the normal purpose, roles, process, lists/fields, forms, workflows, dashboards/pages, navigation, UI/UX mapping, permissions, integrations, assumptions, deferred items, and proof boundary sections.

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

### Approval Form Contract
- Approval required: Yes/No
- Approval form:
- Request page:
- Task pages:
- Approval statuses:
- Workflow steps:
- Workflow control panel required: Yes/No
- Workflow history required: Yes/No
- DefResource required: Yes/No
- If deferred, user-approved staged build required: Yes/No

### Navigation Runtime Contract
- Group shape: `Type: "classes"` + `list`
- Do not use `children`/`Childs` for runtime grouped navigation
- Page entries: `Type: 103`
- Approval form entries: `Type: 105`, `ListID = Forms[].Key`
- Data list entries: `Type: 1`, `ListID = child list ID`
- Unreachable resources allowed only if documented hidden/deferred

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
- Planned permissions/integrations must be implemented or explicitly deferred: Yes/No

### Proof Boundary Contract
- App plan approval status:
- Local schema validation status:
- App-plan conformance status:
- UI/control quality validation status:
- API signing status:
- API signature verification status:
- API install/import acceptance status:
- Runtime UI inspection status:
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
- Print pages are reachable if intended:
- Generated app matches approved plan:
```

## Validation Expectation

`scripts/validate-app-plan-conformance.mjs` must flag missing `Generation Contract and Hard Gates` coverage. Generation reports must keep local validation, API signing, API install/import acceptance, and runtime UI inspection as separate proof levels.
