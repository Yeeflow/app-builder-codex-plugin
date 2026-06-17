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

For full end-to-end app generation and Supplier-like validation reports, use these explicit proof-layer keys:

- `schemaValidation`
- `appPlanConformance`
- `designContractValidation`
- `controlBindingValidation`
- `exactMetadataShapeValidation`
- `idStabilityValidation`
- `signVerify`
- `installOrUpgrade`
- `runtimeBrowserProof`
- `pixelComparison`

`schemaValidation: pass` is not UI proof. `signVerify: pass` or `installOrUpgrade: pass` is not runtime proof. Runtime browser proof must open the decoded installed `#/list-set/{AppID}/{ListSetID}` URL, not an install log or operation ID. Pixel/design comparison must use canonical per-page PNG artifacts and must not be collapsed into schema, API, or runtime status.

Full-page design blueprint validation is another pre-runtime proof layer. A functional spec, app plan, full-page design image manifest, page implementation blueprint, control/property contract, decoded resource parity report, and local hard-gate result must be complete before package/sign/upgrade or runtime proof claims. Resource generation cannot start until blueprint validation passes, and package/sign/upgrade cannot start until decoded resource parity and local hard gates pass.

Horizontal navigation active-state styling needs its own runtime proof boundary. `ListSet.LayoutView.attrs["navigator-menu"]` active-state metadata and `LayoutView.customcss` are decoded metadata only unless a runtime export/browser study proves they affect the app chrome. If active styling is required, final proof must use a fresh top-level load with a safe cache-busting query before the hash route and record Chrome DOM/computed-style evidence for `.ak-listset-new-navigation-item.active`: injected style tag present, selector text present, active item present, transparent active background, blue active text, and blue solid nonzero bottom border. A hidden `codein` CSS injector may be used only when placed inside a rendered page container such as `Content`; a root-child execution-critical `codein` is not enough. Package validation, signing, upgrade acceptance, ID stability, decoded CSS presence, and decoded control presence do not prove app chrome active-style success.

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
