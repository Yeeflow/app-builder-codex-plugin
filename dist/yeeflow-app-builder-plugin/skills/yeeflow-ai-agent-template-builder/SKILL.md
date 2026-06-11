---
name: yeeflow-ai-agent-template-builder
description: Build, validate, and maintain Yeeflow AI Agent template manifests from Word catalogs, icon manifests, prompt drafts, exported .yaia packages, and live Yeeflow creation logs. Use when preparing reusable Yeeflow AI Agent templates, checking template completeness, mapping icons to templates, or coordinating Agent creation/export workflows.
---

# Yeeflow AI Agent Template Builder

## Core Workflow

1. Read the source catalog first. Prefer `docs/Yeeflow_AI_Agent_Template_Configuration_Catalog.docx`; fall back to an explicit user-provided list only when parsing is blocked.
2. Build or update a creation manifest with one entry per AI Agent:
   - `name`
   - `short_description`
   - `icon_file_path`
   - `input_variables`
   - `output_variables`
   - `persona_and_prompt`
   - `tool_calls`
   - `validation_status`
3. Validate that every template has exactly one matching icon file and that all variables have name, type, and short description.
4. Keep tool calls as guidance unless the user provides real Yeeflow resources, workflows, Agents, or HTTP/API connections.
5. Update the workspace logs after any live Yeeflow operation.

## Expected Workspace Files

- `working/final-ai-agent-creation-manifest.json`
- `assets/icons/icon_manifest.json`
- `working/creation-log.md`
- `working/live-ai-agent-prompt-update-result.json`
- `ouput/AI Agents/*.yaia` when exports are requested

## Safety Rules

- Do not create duplicate Agents.
- Do not add tools during reusable-template setup unless resource bindings are explicit.
- Do not delete or rename live Agents unless the user explicitly asks.
- Publish only after name, description, prompt, variables, and icon are verified.
- If using imports, verify the resulting Agent in Yeeflow and publish only after checking the expected fields.

## Useful Script

Run `scripts/validate_ai_agent_manifest.js <manifest.json> [icon_manifest.json]` to check basic manifest structure and icon mapping.

<!-- agent-copilot-application-resource-learning:start -->
## App-Level Agent Resource Learning

The app-level .yap structure is export-proven but generated import behavior is not yet runtime-proven. In a .yap, AI Agent resources are stored under OtherModules Type "Agents" with resource Type = 0. Components Type = 1 are knowledge bindings; Components Type = 2 are tools. Proven tool subtypes include list query/create/update/delete, connection-backed HTTP/API tools, OpenAPI operation tools, connected-Agent tools, and current application resource access.

Reusable templates should keep operational tools as guidance unless target app resources are explicit. App-bound generation must include a resource graph for lists, knowledge, Agents, Copilots, and connections, with fresh IDs and no real credentials.

Runtime import update: generated app-contained AI Agent resources imported successfully in the Asia Tech visitor Copilot app after setting top-level `Publisher: 0`. Do not generate app-level Agent records with `Publisher: null`; treat missing/null/non-numeric Publisher as an import blocker for generated-final packages. This proves import acceptance only, not Agent execution.

For app-contained Access application resources tools, use compact list-resource entries with numeric bitmask permissions: `{ id: <ListID>, permissions: <number> }`. Permission bits are create/add = `1`, update/edit = `2`, delete = `4`, read/view = `8`; combine with bitwise OR.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow-Callable Agent Templates

When an Agent is intended for workflow AI Assistant use, define input and output variables with stable IDs that workflow `AI.properties.inputVariables[]` and `AI.properties.outputVariables[]` can map. The export-proven pattern calls an app-contained Agent from Scheduled Workflow using `properties.data.AgentID`; generated app packages must include and remap the Agent with the workflow.

`Spark & AI (1).yap` proves a second workflow-host pattern for the same mechanism: a data-list workflow can pass a current-row image field into Agent input `type = "img"` and pass native `ListDataID` into a text input for same-row update behavior. It also proves a current application-resource access tool shape with `Components[].Type = 2`, `SubType = 10`, `Settings.Data.Value = <current app/listset id>`, and scoped list access in `Settings.resources.dataLists.items[]`. Reusable templates should describe this as a binding requirement unless the target app/list/workflow graph is explicit.
<!-- scheduled-workflow-ai-assistant-learning:end -->
