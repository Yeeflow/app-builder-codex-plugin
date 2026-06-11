---
name: yeeflow-copilot-template-builder
description: Build, validate, and maintain reusable Yeeflow Copilot template manifests from Word catalogs, icon manifests, instruction drafts, exported .yaic packages, and Sanity/template publishing reports. Use when preparing Copilot template libraries, mapping Copilot icons and packages, or coordinating Copilot creation/export/Sanity handoff workflows.
---

# Yeeflow Copilot Template Builder

Use this skill when the user is preparing reusable Yeeflow Copilot templates before upload, import/export, or Sanity publishing.

## Core Workflow

1. Read the source catalog first. Prefer `docs/Yeeflow_Copilot_Template_Configuration_Catalog.docx`; fall back to an explicit user-provided list only when parsing is blocked.
2. Build or update a creation manifest with one entry per Copilot:
   - `name`
   - `short_description`
   - `icon_file_path`
   - `instruction`
   - `tool_calls`
   - `validation_status`
3. Enrich each Copilot with reusable-template metadata when preparing Sanity records:
   - `copilotScope`
   - `userRole`
   - `supportedObjects`
   - `suggestedPrompts`
   - `knowledgeSources`
   - `connectedAgents`
4. Validate that every Copilot has exactly one matching 64 x 64 icon and, when exports are requested, one matching `.yaic` package.
5. Keep tools, knowledge sources, HTTP calls, lists, workflows, and connected Agents as guidance unless the user provides real target-app bindings.

## Expected Workspace Files

- `working/final-copilot-creation-manifest.json`
- `assets/icons/icon_manifest.json`
- `assets/icons/copilots/*.png`
- `output/Copilot/*.yaic`
- `output/Copilot/icons/*.png`
- `working/copilot-template-generation-report.md`
- `working/sanity-copilot-templateasset-*.json`

## Safety Rules

- Do not create duplicate Copilots.
- Do not bind tools, knowledge sources, workflows, lists, HTTP connections, or Agents during reusable-template setup unless target resources are explicit.
- Do not hand-generate opaque `.yaic` `PackageJson` payloads. Use Yeeflow import/export flows when final importable packages are needed.
- Treat generated `COPxxxxx` IDs as review/product-catalog IDs unless a confirmed runtime install ID is found.
- Keep Copilot copy practical and governed: guided assistance, drafting, context finding, and human-reviewed next steps.

## References

- For the recommended reusable Copilot content model, read `references/copilot-template-model.md`.

## Useful Script

Run:

```bash
node scripts/validate_copilot_manifest.js working/final-copilot-creation-manifest.json assets/icons/icon_manifest.json
```

This checks required manifest fields and icon/package mappings.

<!-- agent-copilot-application-resource-learning:start -->
## App-Level Copilot Resource Learning

In app-level .yap exports, Copilots are AI resources in OtherModules Type "Agents" with resource Type = 1. Settings.Instructions and Draft.Instructions are the primary instruction fields; Suggestions store quick prompts. Components can bind knowledge, other Agents, current app resources, or external connections.

Reusable Copilot templates should not include app-bound Components unless the target lists, Agents, knowledge resources, and connections are explicit. Generated packages should defer or placeholder external connections and require post-import reconfiguration.

Runtime import update: generated app-contained Copilot resources imported successfully in the Asia Tech visitor Copilot app after setting top-level `Publisher: 0`. Do not generate app-level Copilot records with `Publisher: null`; treat missing/null/non-numeric Publisher as an import blocker for generated-final packages. This proves import acceptance and resource materialization only, not Copilot chat execution.

For Copilot Access application resources tools, use compact list-resource entries with numeric bitmask permissions: `{ id: <ListID>, permissions: <number> }`. Permission bits are create/add = `1`, update/edit = `2`, delete = `4`, read/view = `8`; combine with bitwise OR. Do not use string permission arrays.

When a target app also includes data-list workflow Agents, keep that dependency explicit rather than implicit. `Spark & AI (1).yap` proves list workflows can call app-contained Agents with image inputs and row-ID bindings outside Copilot chat. Reusable Copilot templates should not assume those workflow-only Agent bindings exist unless the target app graph includes them.
<!-- agent-copilot-application-resource-learning:end -->

<!-- scheduled-workflow-ai-assistant-learning:start -->
## Workflow-Adjacent Copilot Templates

Do not model Scheduled Workflow execution as a Copilot template capability unless a real app resource is included. If a Copilot template references workflow-generated summaries or emails, document that the Scheduled Workflow and Agent invocation are app resources that require separate validation and runtime-safe testing.
<!-- scheduled-workflow-ai-assistant-learning:end -->
