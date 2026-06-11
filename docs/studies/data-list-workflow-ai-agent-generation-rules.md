# Data-List Workflow AI Agent Generation Rules

Classification: generation guidance promoted from the `Spark & AI (1).yap` export study unless otherwise marked.

## Host List And Workflow Registration

- Create data-list workflows as `Data.Forms[]` entries with `WorkflowType = 1`.
- Keep `Data.Forms[].ListID` equal to the host data-list ID.
- Register each host-list workflow in `Data.Childs[].FlowMappings[]`.
- Keep `FlowMappings[].DefKey` equal to the workflow `Key`.
- For new-item-triggered flows, use `FlowMappings[].Setting = {"NewTrigger": true}`.
- For Add Item / new-item triggers, keep `FlowMappings[].FieldName = null`; the trigger is not bound to a flow-status field.
- Keep `Data.Forms[].Settings = null` for export-like data-list new-item workflows; the trigger configuration lives in `FlowMappings[].Setting`.
- When a flow-status field is used in `FlowMappings.FieldName`, ensure the field exists on the host list and is `Type = "flowstatus"`.

Runtime caveat: Asia Tech follow-up testing still found unresolved trigger-condition setting issues after the package otherwise tested well. Treat the `FieldName = null` and `Settings = null` guidance as the best current candidate from manual comparison, not a fully generalized runtime-proven rule. Before promoting this into stricter generator behavior for other apps, compare a fresh working runtime export against the generated package and verify the trigger-condition panel and workflow designer both open correctly.

## AI Assistant Workflow Action

- Use workflow node `stencil.id = "AI"`.
- For Agent mode, set `properties.type = "agent"`.
- Include `properties.data.AppID`, `properties.data.ListSetID`, and `properties.data.AgentID`.
- Store `properties.inputVariables` and `properties.outputVariables` as arrays even when outputs are empty.
- For current-row image input, map an Agent `img` input from a list-field expression with `valueType = "icon-upload"` or `valueType = "file-upload"`.
- For current-row identity/update binding, pass native `ListDataID` through a list-field expression.

## Agent Requirements

- App-contained Agents should live in `OtherModules Type = "Agents"` with resource `Type = 0`.
- Workflow-facing Agents should define stable input IDs and types that the workflow node can bind directly.
- For image extraction, declare the image input as `type = "img"`.
- If the Agent must update the triggering row, give it a separate text input for the row ID rather than forcing the prompt to rediscover it.

## Application Resource Access Tool

- Treat the current app/listset tool shape as export-proven when:
  - `Components[].Type = 2`
  - `Components[].SubType = 10`
  - `Settings.Data.Value = <current app/listset id>`
  - `Settings.resources.dataLists.items[]` scopes allowed lists
- Validate that every referenced scoped list exists in the package.
- Do not guess permission integers; preserve known-good values only from export-backed shapes.

## Safety Rules

- Never include real uploaded images, private files, or real record values in generated baselines.
- Do not auto-run AI/image-extraction workflows during import/open checks.
- Do not runtime-test destructive or updating Agent tools against real business records.
- If a safe baseline is generated, keep execution disabled or clearly non-triggered unless an explicitly safe sandbox run is approved.

## Validator Guidance

Hard errors are appropriate for:

- missing `ListID` on a data-list workflow
- classifying `WorkflowType = 1` data-list workflows as approval forms
- missing or unresolved `FlowMappings.DefKey` registration for generated list workflows
- non-null `FlowMappings.FieldName` on generated Add Item / new-item triggers
- non-null `Data.Forms[].Settings` on generated data-list new-item workflows
- missing or unresolved `AI.properties.data.AgentID`
- unresolved app-resource tool list references in generator final mode

Warnings are appropriate for:

- image input mappings that use unproven upload control value types
- runtime-sensitive update tools
- missing app-resource `resources` scoping on import-only studies
- partially understood permission metadata

## Materialization Inspection

`WorkflowType = 1` data-list workflows are materialized as `Data.Forms[]` entries, but they are not approval forms. Materialization checks should report them separately as list workflows and validate that:

- `Data.Forms[].ListID` is present
- `Data.Forms[].ListID` resolves to an existing child list
- `Data.Forms[].ProcModelID` is present
- the workflow `Key` is registered from the host list through `FlowMappings[].DefKey`

The Asia Tech visitor Copilot package used this rule for one Contacts new-item workflow and passed local materialization inspection with 0 errors and 0 warnings. This only proves package structure and local materialization, not workflow execution.

## Workflow Designer Shape

Data-list workflow definitions need the same designer-facing graph metadata as export-backed workflows, even when the graph is small:

- `DefResource.pageurls = []`
- `DefResource.variables = { "basic": [], "listref": [], "filter": [] }`
- `DefResource.flowPage = []`
- `DefResource.graphposition`, `graphzoom`, and `graphver`
- every `childshapes[]` item includes both `id` and `resourceid`
- non-sequence nodes include `position`
- `SequenceFlow.source` and `SequenceFlow.target` include both `id` and `resourceid`

The first Asia Tech visitor Copilot workflow used a simplified graph shape and the imported designer failed with `Cannot read properties of undefined (reading 'find')`. Regenerate list workflows with the export-like shape before claiming designer-open readiness.

The later user-created runtime comparison workflow `ATX_CONTACT_AI_ANALYSIS_2` showed one more required trigger-registration detail: the working Add Item trigger used `FlowMappings.FieldName = null`, `FlowMappings.Setting = {"NewTrigger": true}`, `Data.Forms[].Settings = null`, and `Data.Forms[].Deployed = true`. The generated workflow had `FieldName` bound to a normal text field, which made the frontend show an empty trigger condition and kept the workflow designer from opening reliably.

## Import-Safe ID Range

Yeeflow import/materialization may parse generated IDs such as `LayoutID` through `System.Int64`. Keep all numeric-looking generated IDs less than or equal to `9223372036854775807`.

The first Asia Tech visitor Copilot package generated 20-digit child-list layout IDs such as `73221000000000001001`, which failed runtime import at `Childs[0].Layouts[0].LayoutID`. Regenerated layout IDs use a 19-digit range such as `7322100000000001001`.

Validators and generators should fail generated-final packages on `SYSTEM_INT64_ID_OVERFLOW` before runtime import.
