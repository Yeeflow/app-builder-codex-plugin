---
name: yeeflow-mcp-incremental-application-builder
description: Build, extend, inspect, and safely change Yeeflow applications incrementally through the bundled Yeeflow App Builder MCP. Use when a user wants to create an application first and then add or update components, shared resources, portal settings, navigation, or permissions step by step instead of installing a whole YAPK package.
---

# Yeeflow MCP Incremental Application Builder

Build a live Yeeflow application as a resumable sequence of explicit, user-authorized changes. Treat the hosted `yeeflow_app_builder_mcp` tool schemas and live contracts as authoritative; never invent operation names, payload fields, component types, shared-resource types, IDs, or GUIDs.

This is an alternative to, not a replacement for, full YAPK generation and installation. Use YAPK for a complete versioned package, installation, upgrade, or migration. Use this skill when the user wants to create an application and incrementally add or change real resources.

## Safety and Authorization

- Start with OAuth-backed MCP discovery. Do not request, paste, store, log, or commit passwords, API keys, OAuth codes, bearer tokens, cookies, Authorization headers, client secrets, private tenant URLs, raw responses, or decoded resources.
- Before every create, save, update, or configuration write, show the exact target application/workspace (redacted as necessary), operation, resource type, expected dependency effect, and non-destructive behavior. Obtain explicit user confirmation for that batch of writes.
- Use non-destructive missing-resource semantics, such as `deleteMissing = false`, for ordinary component updates. Never remove unplanned children through a replace-style save.
- Obtain a separate, exact-target confirmation before any delete. State the resource identity, dependent resources, and whether recovery exists. Do not infer delete authorization from an earlier create or update confirmation.
- Treat Credential and Connection writes as elevated-risk: require a separate confirmation naming the target and purpose, never place secret values in chat or a ledger, and use the server's secure reference/secret-entry flow only when the user completes it. Do not read back or display secret material.
- Treat MCP acceptance as API acceptance only. Keep API acceptance, persisted readback, Designer editability, and runtime behavior as separate proof levels.

## Build Ledger and Resume Rules

Maintain a local, non-secret application build ledger for the current task. Before a write, read the existing ledger and live state. Record only:

- application and workspace references in redacted form;
- reviewed Functional Specification and App Plan revision/hash;
- requested resource type, stable logical name, MCP-issued IDs/GUIDs, dependency edges, and save/readback status;
- planned, confirmed, saved, readback-verified, deferred, and failed steps; and
- validation findings and proof level, without raw component payloads or secrets.

Never regenerate or substitute an existing live identity on resume. If the ledger and live readback disagree, stop, report the conflict, and ask the user whether to reconcile or abandon the planned change.

For a new application, initialize the ledger in `bootstrap` status with exactly one planned `Application/create` operation. Do not materialize another resource while bootstrap is active. The bootstrap contract must record the identity, icon, and theme strategy before the write:

- Default to `mcp-generated-before-create`: immediately before `Application/create`, call the live MCP `utils_generate_ids` capability and bind exactly one returned numeric ID to this operation. Never generate, guess, randomize, or substitute an application ID locally.
- Use `server-allocated-on-create` only when the freshly discovered live create contract explicitly proves that the server allocates the ID and accepts no caller ID. This is an exception, not a fallback after a failed create.
- Require `IconUrl` to be FontAwesome JSON with non-empty `b`, `i`, and `c` values. It must not be an image URL, SVG, or emoji. Choose an icon that matches the business domain; for procurement, a valid example is `{"b":"#0F766E","i":"fa-solid fa-cart-shopping","c":"#FFFFFF"}`.
- Omit `Themes` from bootstrap until the live Application contract, accepted theme shape, and a non-destructive correction/update operation have all been discovered. Do not send guessed empty arrays or inferred theme payloads.

After the MCP create and exact application readback, record the returned ID/provenance and verify the workspace, title, IconUrl, and theme state. Move the application to `readback-verified` only when that comparison passes; only then may dependent resources advance. If a correction is needed but no verified live Application update contract exists, block dependent writes and report the gap instead of attempting an unproven write.

## Application Create Or Non-Destructive Update

The observed workspace Application endpoint is an upsert contract: it creates with a new MCP-issued ID and non-destructively updates the existing Application when given its existing `ID`. Treat the user-facing operation as: “Creates or non-destructively updates an App Builder application. An existing `ID` updates that application.” The hosted MCP server owns its runtime tool metadata; this Plugin trains and validates the behavior but does not alter a server-published tool description.

For an Application update:

1. Read the exact target Application first and bind its existing `ID` and workspace to the ledger. Do not allocate a new ID.
2. Declare only the intended application-level fields. Preserve `ID`, `WorkspaceID`, and `Title` unless Title itself is intentionally changed. Set replace/missing-resource behavior to non-destructive; an update never authorizes delete or replacement.
3. Validate an `IconUrl` change as FontAwesome JSON before the write. A Theme change additionally requires a current live theme-contract reference.
4. Obtain explicit confirmation for the exact target Application/workspace and change batch.
5. Use the same discovered workspace Application endpoint with the existing `ID`, then immediately call `appbuilder_application_get`. Report `API accepted` and `persisted readback verified` separately. If stable fields drift or the intended change is absent, block later work rather than retrying with replacement semantics.

## Required Lifecycle

Apply this lifecycle to Application, every component, every shared resource, Portal, navigation, and permissions:

1. Read the reviewed Functional Specification and App Plan. Do not create omitted placeholders or resources outside the plan.
2. Discover the applicable live MCP contract and supported operations. List/get the target application and existing resources before mutation.
3. Resolve prerequisites and allocate IDs/GUIDs only through the MCP capability exposed for that purpose. For a new Application, use the bootstrap identity strategy above and preserve the returned identity in the ledger before create when caller ID is required.
4. Materialize only the planned change through the type-specific generator or a contract-shaped generic materializer. Validate locally before saving. Application bootstrap validation includes workspace/title, FontAwesome `IconUrl`, identity strategy, and theme/update-contract gates.
5. After explicit confirmation, save through the contract's create/update operation, preserving unspecified existing resources. Application create and update use the discovered workspace Application upsert endpoint; an existing ID means non-destructive update, never delete/replace.
6. Immediately get the exact saved resource. Validate the persisted representation, IDs, references, and type-specific invariants against the materialized intent. For Application bootstrap, compare returned workspace, title, IconUrl, and theme state exactly; API acceptance alone is not success.
7. Update the ledger only after readback succeeds. If it fails, do not continue dependent writes; report API acceptance separately from failed persistence proof.
8. Re-list and verify application-level navigation, permissions, Portal links, and dependency edges after the affected batch. Perform Designer or runtime proof only when separately requested and authorized.

## Application and Component Coverage

Create or select the Application first, then build dependencies before their consumers. Use the following component mappings. A mapping is guidance to reuse existing generation and validation contracts; it does not authorize a write and does not make an unavailable specialist path appear implemented.

| MCP component type | Existing skill mapping | Incremental rule |
| --- | --- | --- |
| `ApprovalForm` | `yeeflow-approval-form-generator` | Materialize fields, DefResource, workflow, roles, and numbering before save; read back the workflow and form resources. |
| `ScheduleForm` | `yeeflow-scheduled-workflow-generator` | Validate schedule, workflow graph, targets, and recurrence before save and readback. |
| `Dashboard` | `yeeflow-dashboard-generator` | Resolve every data source, page, action, filter, and navigation dependency before save. |
| `DataList` | `yeeflow-data-list-generator` | Validate list, fields, layouts, views, forms, workflows, and relationship bindings; retain stable list/field/layout identities. |
| `Document` | `yeeflow-data-list-generator` | Use its two-phase live Document Library materializer and merge/readback path; never hand-author a Type 16 component. |
| `DataReport` | `yeeflow-form-report-generator` | Validate report data-source and consumer bindings before save and persisted readback. |
| `FormNewReport` | `yeeflow-form-report-generator` | Validate form report controls, target bindings, and owning form before save and persisted readback. |
| `Knowledge` | `yeeflow-ai-agent-template-builder` when available | Discover the live Knowledge contract first; do not claim a dedicated local materializer where one is absent. |
| `AIAgent` | `yeeflow-ai-agent-template-builder`, `yeeflow-ai-agent-ui-operator` when available | Validate model-independent configuration and Knowledge/Connection references; never record provider secrets. |
| `Copilot` | `yeeflow-copilot-template-builder`, `yeeflow-copilot-instruction-designer`, `yeeflow-copilot-import-export-operator` when available | Validate instructions, tool/Knowledge references, and permissions without exposing secrets. |
| `CustomService` | `yeeflow-custom-service-generator` | Validate endpoint/configuration references and permissions; require elevated confirmation for a Connection or Credential dependency. |

Use the source Skill only if it is present in the current installation. If a listed specialist is absent, use MCP contract discovery plus the generic lifecycle, label the specialized local validation gap, and do not claim full type-specific proof.

## Shared Resources and Application Configuration

Apply the same lifecycle to all MCP shared-resource types:

| Shared resource | Required controls |
| --- | --- |
| `Theme` | Read before change; validate application and page consumers after save. |
| `Component` | Use only the contract's reusable-component shape; validate all planned consumers after save. |
| `Group` | Read membership and permission impact before write; require exact confirmation for membership removal. |
| `Credential` | Use an elevated, secret-safe flow; never display or persist values in the ledger or output. |
| `Tag` | Validate type, scope, and intended assignments after save. |
| `Metadata` | Validate schema/field semantics and dependent component references after save. |
| `Connection` | Use an elevated, secret-safe flow; readback only non-secret identity/status fields and validate dependent references. |

For Portal, navigation, and permissions:

- Read current Portal configuration, navigation tree, themes, group assignments, and application permissions before changing them.
- Create a navigation item only after its target has passed persisted readback. Do not create dangling menu links.
- Use planned roles/groups and least privilege. Report added, changed, and removed access separately.
- Require explicit confirmation for permission broadening, group membership changes, public exposure, or Portal publication. Require stronger confirmation for access removal or destructive replacement.
- Get/read back the Portal/application configuration and verify every planned navigation target and permission assignment resolves.

## Dependency Order

Use the App Plan's declared graph. When it does not state an order, start with Application, then shared foundations (`Metadata`, `Tag`, `Theme`, non-secret `Component`), storage (`DataList`, `Document`), forms/workflows (`ApprovalForm`, `ScheduleForm`), reports, `Dashboard`, `Knowledge`, `AIAgent`, `Copilot`, `CustomService`, then Portal/navigation/permissions. Resolve Connection and Credential dependencies only with their elevated authorization and before a consumer that requires them.

Do not save a consumer with guessed IDs, unresolved references, or missing prerequisites. A circular dependency requires an explicit staged baseline plan and readback checkpoint before either side gains the final reference.

## Completion Report

Report the ledger as a concise matrix: planned resource, live ID (redacted), operation, dependencies, bootstrap identity/icon/theme strategy where applicable, API result, persisted-readback result, and remaining Designer/runtime proof. State every deferred or blocked item and why. Never claim application completion merely because the API accepted a save.
