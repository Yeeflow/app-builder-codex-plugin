# Application Planning Capability Coverage

This study audits whether recent Yeeflow platform learning is visible during application planning, before package generation starts. It is a planning-coverage milestone: it does not add new package validation behavior, generate a baseline package, or claim new runtime proof.

## Planning Rule

Every full Yeeflow application build plan should include a `Capability Coverage Plan` before implementation. The plan should choose the capabilities that belong in v1, explicitly exclude capabilities that are irrelevant, mark partially proven or unproven capabilities honestly, assign each selected capability to the responsible skill, and define validation plus runtime-test boundaries.

The planning phase should avoid both under-planning and feature stuffing. A capability is considered when it is relevant to the business process, not automatically included in every app.

For newly learned capabilities, also apply `docs/studies/new-capability-runtime-gate-process.md`. Planning may select export-proven or validator-backed capabilities, but it must not describe them as runtime-proven unless a focused runtime baseline passed for the selected host/scope.

## Coverage Matrix

| Capability | Learned status | Source docs or skill location | Consider during app planning | Planning questions or decision criteria | Implementation skill responsible | Validation/runtime test requirements | Safety boundary |
|---|---|---|---|---|---|---|---|
| Data lists | runtime-proven | `yeeflow-application-builder`, `yeeflow-application-generator`, data-list generator docs | yes | What business records, master data, transaction lists, lookup lists, and follow-up/task lists are needed? | `yeeflow-data-list-generator`, `yeeflow-application-generator` | Validate child lists, app graph, field IDs, lookup targets, sample rows, custom forms, materialization. Runtime-test list open and data visibility. | Do not create placeholder lists without v1 purpose. Preserve tenant/private data boundaries. |
| Approval forms | runtime-proven | `yeeflow-approval-form-generator`, approval form control and design docs | yes | Are approvals, submissions, task pages, workflow panels, or controlled status changes needed? | `yeeflow-approval-form-generator`, `yeeflow-application-generator` | Validate form Def, workflow, ContentList targets, task assignment, publish/open/submit/review when scoped. | Do not hardcode tenant-specific users; require safe assignment strategy. |
| Dashboards | runtime-proven for proven controls; partial for some chart/report shapes | `yeeflow-dashboard-generator`, dashboard UI/UX docs | yes | Which operational pages, queues, KPIs, summaries, and drill-downs support the app's v1 workflow? | `yeeflow-dashboard-generator`, `yeeflow-application-generator` | Validate Type `103` ownership, layout JSON, data bindings, ReportIds/exts. Runtime-test render and data-bound values or empty states. | Do not count static KPI/mockup text as runtime proof. |
| Document libraries | runtime-proven for Type `16`, multiple libraries, root folders, simple custom fields/views | `docs/studies/document-library-*`, `yeeflow-application-generator` | yes when document management is relevant | Are file repositories, generated root folders, custom document metadata, views, or document custom forms needed? | `yeeflow-application-generator`, document-library rules in validator | Validate `ListModel.Type = 16`, default fields, Type `0` views, folder rows, `SimplePortal = null`, ReplaceIds. Runtime-test library open/folder render. | Do not fake document uploads or commit file payloads/private documents. |
| Doc library controls | runtime-proven on dashboards for root/static folder display; document-library custom-form host runtime-proven; approval/data-list hosts partial | `docs/studies/doc-library-control-*`, `yeeflow-dashboard-generator` | yes when dashboards or forms must expose library files | Should users see library contents from dashboards or forms? Should the control be root-bound or folder-bound? Are caption/search/add needed? | `yeeflow-dashboard-generator`, relevant form generator | Validate `type = "document-library"`, target Type `16` library, fields, folder path, caption layout. Runtime-test per host. | Do not claim approval-form live or data-list custom-form runtime proof until focused tests pass. |
| Custom forms | runtime-proven for standard data-list custom forms and many approval controls; partial for advanced hosts | Data-list, approval-form, custom-form docs | yes | Which resources need New/Edit/View forms, request pages, task pages, or document custom forms? | `yeeflow-data-list-generator`, `yeeflow-approval-form-generator`, `yeeflow-application-generator` | Validate layout/control bindings, field mappings, action rules, publish/open behavior. | Avoid unsupported controls or mark as required proof/deferred. |
| Data list workflows | import-proven and designer-shape learned; runtime execution remains scoped | `docs/studies/data-list-workflow-*`, app generator | yes when list events should automate work | Which list trigger is needed: new item, field/status change, or manual? Is `Setting.NewTrigger = true` required? | `yeeflow-application-generator`, workflow action docs | Validate `FlowMappings[]`, `DefResource` designer metadata, trigger settings, action references. Runtime-test open/designer first. | Do not run row mutation or AI execution without safe sandbox scope. |
| Approval workflows | runtime-proven for standard app approval flows | Approval-form generator docs, workflow action references | yes | What business stages, branches, assignments, ContentList writes, and audit outputs are required? | `yeeflow-approval-form-generator`, `yeeflow-expression-generator` | Validate workflow graph, actions, expressions, assignments, ContentList mappings. Runtime-test submit/review branches. | Avoid tenant-specific user assignment unless explicitly mapped and safe. |
| Scheduled workflows | import/open/designer runtime-proven for safe baseline; execution scope partially documented | `docs/studies/scheduled-workflow-*`, app generator | yes for timed automation | Is recurrence needed? Weekly or every X working days? Timezone? Should QueryData, AI Assistant, or Send email run? | `yeeflow-application-generator`, package validator | Validate `WorkflowType = 3`, schedule `Settings`, variables, `QueryData`, `AI`, `MailTask`. Runtime-test import/open/designer/config only unless execution is explicitly safe. | Do not trigger schedules, send email, or call live AI unless safe recipient/data/scope is approved. |
| QueryData workflow action | export-proven; used in scheduled workflow baseline | `docs/studies/workflow-query-data-action.md` | yes when workflows need list reads | Which list is queried? What filters and output variables are needed? | App generator, expression generator | Validate target list references, filters, output variables, workflow graph. Runtime-test configuration; execution only with safe data. | Avoid querying tenant/private data in tests. |
| AI Assistant workflow action | export-proven in scheduled and data-list workflows; execution runtime-sensitive | `docs/studies/workflow-ai-assistant-*`, app generator | yes when AI should summarize, classify, score, draft, or recommend | Which Agent is called? What input/output variables are mapped? Are image/file inputs needed? | App generator, AI Agent skills | Validate Agent reference, variable maps, image/file value types, output variables. Runtime-test non-executing config first. | Do not execute live AI or mutate rows unless sandbox scope is approved. |
| Send email workflow action | export-proven; safe baseline uses reserved test recipient | `docs/studies/workflow-send-email-action.md` | yes when notifications or drafts are required | Is email send required, or should app generate drafts/review tasks? Who receives mail? Are subject/body expression-based? | App generator, expression generator | Validate `MailTask`, recipient, subject/body, variables. Runtime-test config; send only in safe scope. | Never generate real recipients by default; no accidental email execution. |
| AI Agents | import-proven as app-contained resources; workflow invocation export-proven; runtime execution scoped | `docs/studies/ai-agent-*`, generated Agent skills, app generator | yes when reusable AI work is needed | Which reusable Agents are needed? What inputs/outputs/tools? Should they read/update app resources? | AI Agent template/operator skills, app generator | Validate OtherModules, `Publisher: 0`, settings JSON, components/tools, input variables, local resource access. Runtime-test config visibility before execution. | Keep generated IDs within `System.Int64`; no secrets, real credentials, or destructive tool calls. |
| Copilots | import-proven as app-contained Type `1`; chat/runtime behavior not fully proven for generated apps | `docs/studies/copilot-*`, generated Copilot skills | yes when conversational UX is part of app | Does the app need a Copilot? Quick prompts? Local tools? Connected Agents? Image uploads or attachments? | Copilot template/operator skills, app generator | Validate OtherModules, suggestions, components, tools, `Publisher: 0`, local references. Runtime-test config and safe chat only when scoped. | Do not overclaim generated Copilot runtime until smoke tested. |
| Access application resources tool | export-proven/import-learned for local list access | `docs/studies/agent-access-application-resources-tool.md`, app generator | yes when AI must read/update app lists | Which lists can the AI access? Read only or update/create? Is same-row update needed through item ID input? | App generator, AI Agent/Copilot skills | Validate compact `{ id, permissions }` entries and list references. Runtime-test read/update only in disposable sandbox. | Use least privilege; avoid destructive update/delete by default. |
| Image/file input extraction | export-proven for Agent workflow mapping; runtime execution sensitive | `docs/studies/ai-agent-image-extraction-inputs.md`, `docs/studies/workflow-ai-assistant-image-input.md` | yes when images/files drive AI decisions | Which fields hold images/files? Should values use `icon-upload` or `file-upload`? What is extracted? | App generator, AI Agent skills | Validate input variable type `img`, field mappings, Agent prompts/tools. Runtime-test with harmless files only. | Do not upload private images or execute real analysis without approval. |
| Copilot image upload scenario | partial/import-planning only unless focused runtime proof exists | Copilot app-resource docs and runtime plans | yes when user-facing Copilot should accept images | Is image upload central to user value or should it be deferred? Which Agent/tool handles it? | Copilot skills, AI Agent skills, app generator | Validate Copilot/Agent dependency graph; runtime-test only with harmless sandbox files. | Mark as partial until focused generated runtime proof exists. |
| Application navigation menu | export-proven | `docs/studies/application-settings-navigation-menu.md`, app generator | yes | Should navigation be default or custom? Which resources are top-level? Which are grouped? Are custom labels/icons needed? | `yeeflow-application-generator`, `yeeflow-application-builder` | Validate root `LayoutView.sort[]`, references, depth, group labels, icons/no-icon. Runtime-test menu render. | Groups are top-level only; no nested groups. |
| Navigation groups | export-proven | Application settings docs | yes | Are business-facing groups clearer than raw resource list? What child resources belong together? | App generator | Validate `Type: "classes"` with `list[]`, max depth 2, required `Title`. Runtime-test group/child render. | Do not nest groups. |
| Navigation layout | export-proven | `docs/studies/application-settings-navigation-layout.md` | yes | Use `default`, `left`, `onheader`, or `none`? Does the menu fit in header? | App generator | Validate `attrs["navigator-menu"].position`; runtime-test selected layout. | Use only proven values. |
| Header height/title visibility | export-proven for `height: 46` and `hideTitle: true`; default 56 is product-known/export-observed by absence | `docs/studies/application-settings-header.md` | yes when shell appearance matters | Should app title show? Is small header needed? Are additional heights required? | App generator | Validate `attrs.appearance`, boolean `hideTitle`, header height type. Runtime-test title/header render. | Do not overclaim unobserved height variants. |
| User groups | export-proven for group records; member assignment unproven | `docs/studies/application-user-groups.md` | yes for role/permission planning | Are app user groups needed for permissions, pickers, or future access control? Are members needed? | App generator, builder | Validate `Data.AppGroups[]`, `{ ID, Name, Description }`, ReplaceIds. Runtime-test groups page only with placeholder groups. | Do not generate members, real users, emails, or tenant identities until proven. |
| Custom code controls/actions | runtime-proven only by specific scripts/hosts | Custom code generator skill, app generator | yes for non-native interactions | Can native controls/actions solve it? Which host needs custom code? What parameters/read/write behavior? | `yeeflow-custom-code-generator`, app/form/dashboard generators | Validate script presence, params, host bindings, custom-code inspection. Runtime-test render/query/writeback. | Avoid custom code for simple native behavior; no unsupported runtime APIs. |
| Connections / HTTP API / OAuth | export-proven as sensitive dependencies; generation remains credential-sensitive | AI Agent/Copilot and connection docs | yes for integration-heavy apps | Is external connectivity required in v1? Can it be a post-import configuration step? Are credentials available safely? | App generator, Agent/Copilot skills, feature learning when unknown | Validate references and redaction; runtime-test only with safe credentials/sandbox. | Never commit credentials, tokens, OAuth secrets, or tenant connection IDs. |
| OpenAPI/REST tools | partial/export-known, credential-sensitive | Agent/Copilot tool docs | yes when external APIs are part of AI/tool design | Is OpenAPI tool required? Is schema known? What operations are safe? | AI Agent/Copilot skills | Validate tool schema/references; runtime-test non-destructive operations only. | Defer execution unless credentials and endpoints are safe. |
| Safe runtime testing and deferred execution | runtime-process proven | `yeeflow-runtime-test-orchestrator`, runtime checklist docs | yes | What should be import-proven, runtime-proven, render-only, blocked, or not tested? Which actions must not execute? | Runtime test orchestrator, package validator | Validate before build/runtime; document scope and labels. | Do not run AI/email/external/destructive actions without explicit safe scope. |

## Capability Coverage Plan Template

Every full app plan should include:

```text
Capability Coverage Plan

Selected capabilities:
- <capability>: <why it is needed in v1, responsible skill, proof target>

Intentionally excluded capabilities:
- <capability>: <why it is not relevant or is better deferred>

Deferred or unproven capabilities:
- <capability>: <proof gap, fallback, required learning/runtime test>

Runtime test boundary:
- Import/open:
- Resource rendering:
- Workflow/AI/email/external execution:
- Deferred execution:

Safety boundary:
- Private data:
- Credentials/tokens:
- Generated packages/artifacts:
- Human review requirements:

Skill and validator dependencies:
- <skill/validator/doc>: <use>
```

## Planning Self-Check

Before generating a package, Codex should confirm:

- the plan considered the current learned capability set without forcing irrelevant features into the app
- every selected capability has a responsible specialized skill or documented generator rule
- unproven, partial, or runtime-sensitive capabilities are marked honestly
- validation commands and runtime proof boundaries are named before build/runtime test
- no generated plan depends on real users, tenant IDs, emails, credentials, tokens, private documents, image binaries, raw exports, decoded payloads, or generated package artifacts being committed
