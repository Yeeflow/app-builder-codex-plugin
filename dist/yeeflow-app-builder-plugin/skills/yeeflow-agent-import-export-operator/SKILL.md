---
name: yeeflow-agent-import-export-operator
description: Export, inspect, validate, and organize Yeeflow AI Agent .yaia template packages. Use when saving Agents as templates, checking exported packages, studying Yeeflow import/export payloads, or preparing safe import/export batches without guessing resource bindings.
---

# Yeeflow Agent Import Export Operator

## Export Workflow

1. Confirm the source Yeeflow category and Agent names.
2. Query or inspect live Agents and collect IDs.
3. Export each Agent one at a time using the authenticated Yeeflow session or known API route.
4. Save files under the requested folder. Preserve `.yaia` extension.
5. Validate:
   - expected file count
   - non-empty files
   - readable outer JSON wrapper
   - `Name`, `Description`, and `PackageJson` present
   - no accidental duplicate or stale export

## Known Yeeflow Export Notes

- `.yaia` files are JSON wrappers with an opaque `PackageJson` payload.
- Prior evidence indicates `PackageJson` is Base64 around Brotli-compressed inner text, but wrapper details may vary.
- Do not generate import packages from guessed binary structure. Use normalized `importRead` / `import` paths only after validation.
- Tool definitions can contain real list, workflow, Agent, or HTTP bindings. Do not clone those blindly into reusable templates.

## Safety Rules

- Do not import until the user explicitly asks.
- Do not overwrite, delete, rename, or duplicate live Agents unless the user explicitly asks.
- Treat exported files as templates only after validating names and package shape.

## Useful Script

Run `scripts/validate_yaia_exports.js <folder> [expected-count]` to validate an export folder.

<!-- agent-copilot-application-resource-learning:start -->
## Application Resource Export Learning

The DEMO Innovation Ecosystem Platform .yap study proves that app-contained AI Agents live in Data.OtherModules where Type = "Agents" and individual AI Agent resources use Type = 0. The same module also contains Copilots with Type = 1. Treat app-contained Agent exports differently from standalone .yaia packages: tool bindings may reference app data lists, knowledge resources, other AI resources, and application connections.

When inspecting app-level exports, decode read-only, preserve large numeric IDs as strings, and redact tenant/user IDs, connection IDs, endpoints, OAuth/client metadata, token-like values, and credentials. Do not clone Components blindly into reusable templates. For generated packages, unresolved Settings.Data.Value references to lists, connections, current app/listset, or connected Agents are blockers in final mode.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow Invocation Learning

`AI Agent and Copilot Local Resource Baseline8.yap` proves app-contained AI Agents can be invoked from workflow `AI` nodes, not only from Copilots. The workflow stores the target Agent ID in `properties.data.AgentID` and maps inputs/outputs through `properties.inputVariables[]` and `properties.outputVariables[]`. When inspecting app-level exports, include workflow references to Agents in the dependency graph and do not execute live AI during validation.

`Spark & AI (1).yap` adds a data-list workflow invocation case: the host list registers the workflow in `FlowMappings[]`, the workflow `AI` node maps an `icon-upload` list field into Agent input `label_image`, and native `ListDataID` into a row-ID input for same-item update behavior. When inspecting similar exports, redact uploaded-image details and record payloads, and separately map any application-resource access tool that can update app data.
<!-- scheduled-workflow-ai-assistant-learning:end -->
