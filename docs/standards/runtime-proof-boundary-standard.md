# Runtime Proof Boundary Standard

Generated Yeeflow applications must report proof boundaries separately. Do not collapse schema, signing, API acceptance, and runtime/designer correctness into one success label.

## Separate Proof Sections

Reports should show:

- local schema validation
- package validation
- feature and plan-conformance validation
- workflow graph validation
- UI/materialization validation
- signing and `verifysign`
- API install or upgrade-check
- API install or upgrade-apply
- runtime/designer/manual proof

## Signing

HTTP 200 from a signing endpoint is not enough. A signed package should verify:

- expected signature response shape
- 32-byte signature where applicable
- `verifysign` pass before install/upgrade is treated as signed

Do not run live signing APIs during plugin release validation unless the user explicitly asks for runtime/API proof.

## API Acceptance

`upgrade_check_passed` is API check proof only.

`upgrade_applied` is API apply proof only.

Neither proves:

- navigation matches the app plan
- dashboards are data-bound
- approval forms render usable controls
- form action expressions execute correctly
- requester-context Set variable wrappers are designer/runtime-correct

## Approval Runtime Completeness

Approval forms must include:

- real request controls with bindings
- real task/review controls with bindings
- request page URLs that resolve
- task page URLs that resolve
- workflow control panel
- workflow history
- valid assignment task routing
- decision/comment controls where applicable

Static text-only approval pages fail runtime completeness even if the package is schema-valid.

## Workflow Assignment Routing

Assignment task assignee validation is not runtime routing proof. Reports must list every workflow Assignment Task, its assignee source, job-position source/proof status when applicable, and any unresolved blocker. Job-position assignees must be discovered, user-selected, or admin-created after explicit confirmation; missing job positions block generation until resolved. Manager-based assignees must use supported expression-editor patterns for line manager, department manager, or location manager. Do not print raw user/job-position records, full IDs, full emails, raw API responses, decoded package payloads, raw `Resource`, or raw `Sign`.

Runtime/browser proof for assignment routing requires submitting a safe request and observing that the task routes to the intended manager, job position, requester, explicit user, or supported expression result. Signing, API install acceptance, workflow designer open/publish, and local package validation do not prove task routing.

## Requester Context

For native user profile attributes, use `getUserAttr` and verified workflow-variable token wrappers:

- target Department: `id = "Department"`, `name = "Workflow Variables:Department"`, `valueType = "groupselect"`
- target Manager: `id = "Manager"`, `name = "Workflow Variables:Manager"`, `valueType = "user"`
- source Requester: `id = "Requester"`, `name = "Workflow Variables:Requester"`, `valueType = "user"`
- Department attribute key: `DepartmentID`
- Manager attribute key: `LineManager`

Reject old `__variables_` requester-context tokens.
