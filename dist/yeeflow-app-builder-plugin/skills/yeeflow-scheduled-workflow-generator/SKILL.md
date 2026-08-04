---
name: yeeflow-scheduled-workflow-generator
description: Generate, validate, inspect, and debug standalone Yeeflow Scheduled Workflow .ywf files. Use when a user requests an independently importable scheduled workflow, recurrence configuration, WorkflowType 3 graph packaging, scheduled workflow round-trip validation, or safe scheduled workflow fixtures without generating a full application package.
---

# Yeeflow Scheduled Workflow Generator

## Core Contract

Generate standalone Scheduled Workflow files with the same workflow graph builders, action configuration rules, dependency mapping, and Workflow Designer gates used by full application generation. Do not hand-build a simplified graph that diverges from the full-app path.

Use the export-proven profile:

- outer file extension `.ywf`;
- outer `WorkflowType = 3`;
- decoded `Def.workflowType = 3`;
- `FlowKey` equals decoded `Def.defkey`;
- `Settings` is a JSON string containing recurrence settings;
- workflow resource registration uses `ListID = 0` when materialized inside an app.

Read [standalone-scheduled-ywf-profile.md](references/standalone-scheduled-ywf-profile.md) when designing or validating the wrapper.

## Generation Workflow

1. Produce a reviewed Scheduled Workflow plan, including recurrence, timezone, actions, variables, dependencies, recipient safety, deployment state, and proof boundary.
2. Allocate or obtain issued IDs. Never copy IDs from an unrelated export.
3. Prepare a canonical shared-builder plan containing the exact Scheduled Workflow metadata, issued `rootListSetId` and `defResourceId`, selected resource inventory, `actionRecords`, and `loopRecords`.
4. Generate the decoded `Def` with the exported full-app workflow builder and wrap it in one command:

```bash
node scripts/generate-scheduled-ywf-from-plan.mjs \
  scheduled-workflow-plan.json \
  output.ywf \
  --issued-ids issued-ids.json
```

5. Use the lower-level `build-scheduled-ywf-wrapper.js` only when a decoded `Def` has already been produced by a proven shared builder; do not hand-author the graph.
6. The generator must run pre-write validation, write a temporary file, reread it, compare bytes, run post-write validation, and rename only after success.
7. Validate independently:

```bash
node scripts/validate-scheduled-ywf.js output.ywf --stage final --issued-ids issued-ids.json
```

## Hard Gates

- Require the exact export-proven outer keys and canonical UTF-8 JSON.
- Require parseable canonical base64 `Def` and parseable `Settings`.
- Require one Start event, at least one End event, unique node IDs, and resolvable SequenceFlow endpoints.
- Require `AppListSetID`, `ProcModelAppID`, and the export-proven process metadata keys.
- Require issued-ID provenance in final mode.
- Block unresolved placeholders and unacknowledged fixed email recipients.
- Validate referenced Data Lists, fields, AI Agents, Custom Services, and connections before final handoff.
- Default generated runtime baselines to a safe future schedule and non-deployed state. Do not execute a schedule, AI action, email, service, or record mutation without explicit authorization.
- The current shared generation facade supports the export-proven Set Data List and Loop action family. For AI, email, Query Data, Invoke Service, or other action families, require a separate export-proven shared builder before claiming requirement-to-file generation.

## Proof Boundary

Local wrapper generation and validation prove only canonical structure, graph consistency, recurrence shape, ID provenance, and round-trip stability. They do not prove tenant import, Designer rendering, schedule activation, action execution, email delivery, AI execution, or Custom Service runtime behavior.
