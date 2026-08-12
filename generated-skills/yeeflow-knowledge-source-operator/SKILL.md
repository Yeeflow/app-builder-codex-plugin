---
name: yeeflow-knowledge-source-operator
description: Create, inspect, update, validate, and safely retire application-bound Yeeflow Knowledge sources. Use when an AI Agent or Copilot needs a Document Library, Data List, or approved application source; when configuring fields and filters; or when proving an Agent/Copilot knowledge binding before publishing.
---

# Yeeflow Knowledge Source Operator

## Scope

Knowledge sources are application resources of component type `Knowledge`. The current MCP contract exposes their lifecycle through generic component operations: discover the contract first, then use `appbuilder_component_list`, `appbuilder_component_get`, `appbuilder_component_save`, and `appbuilder_component_delete` with `componentType: "Knowledge"`. Do not invent dedicated `knowledge_create`, `knowledge_update`, or `knowledge_delete` tool names.

Use this skill for a real application-bound source. A reusable Agent or Copilot template may describe a source as deferred, but must not claim it is connected until the target application has been configured and read back.

## Safe Lifecycle

1. Map the intended business purpose, source resource, permitted fields, filters, and every Agent/Copilot that may use it.
2. Read the application component contract and existing `Knowledge`, `AIAgent`, and `Copilot` resources. Reuse only the exact resource IDs returned by Yeeflow.
3. Create or update the Knowledge resource with a stable name and description. Each `Datas[]` entry must identify its source and type, and contain only approved fields and filters.
4. Read the saved Knowledge resource back. Confirm its ID, enabled state, each `Datas[]` source/type, and the configured field/filter scope.
5. Bind each consuming Agent or Copilot explicitly. Its `Components[]` entry must use `Type: 1`, the exact Knowledge `Source` ID, and the matching Knowledge name. A name alone is not a binding.
6. Save and read back every consuming Agent/Copilot. Its prompt or instructions may describe only the Knowledge sources that are actually bound.
7. Run the package-level binding check before generated-final packaging or publish:

```bash
node scripts/validate-knowledge-source-bindings.mjs <app.yap-or-decoded-data.json> --mode final
```

8. For deletion, first prove there are no reverse `Components[].Type === 1` references:

```bash
node scripts/validate-knowledge-source-bindings.mjs <app.yap-or-decoded-data.json> --mode final --delete-target <knowledge-id>
```

Do not delete a source with reported consumers. Do not delete a live source merely because its display name is similar to the requested target.

## Configuration and Verification Gates

- A Knowledge source needs a non-empty ID, name, and at least one `Datas[]` entry.
- Every data entry needs a source and type. Treat missing/invalid settings, fields, or filters as a configuration gap and re-read the source resource before publishing.
- An Agent/Copilot Knowledge component must resolve by `Source` to an included Knowledge ID. The component name must match that resource.
- If a prompt/instruction names a Knowledge source or source dataset but the resource is not bound, the final validator fails. Remove the claim or add and re-read the real binding.
- The validator proves package/configuration consistency only. UI visibility and retrieval quality require separate browser/runtime verification using safe test data.

## Authoring Guidance

- Keep the source narrowly scoped: approved fields, necessary filters, and a purpose-specific description.
- In Agent prompts and Copilot instructions, state what the configured source may be used for, what it cannot decide, and when to request human review.
- Never place credentials, bearer tokens, URLs with secrets, or private document contents in Knowledge settings, prompts, package fixtures, or logs.
- Preserve a clean distinction between: saved/read-back configuration, UI materialization, and live retrieval execution. Do not claim runtime retrieval from save success alone.
