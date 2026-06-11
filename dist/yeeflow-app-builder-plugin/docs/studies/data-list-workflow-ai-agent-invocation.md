# Data-List Workflow AI Agent Invocation

Source export: `<downloads>/Spark & AI (1).yap`

Classification: export-proven structure only. No live AI execution or real-record update was performed in this branch.

## Primary Case

- Application: `Spark & AI`
- Data list: `Stock Box`
- Workflow: `Extract&Update In-Stock`
- Workflow key: `extract_update_stock_box_label_data`
- Agent: `Dental Aligner Label Info`
- Invocation node: workflow graph `stencil.id = "AI"`

Exact numeric IDs were preserved in the ignored inspection directory and intentionally redacted from committed docs.

## Proven Invocation Shape

The `Stock Box` list stores workflow registration in `Data.Childs[].FlowMappings[]` and the workflow definition itself in `Data.Forms[]`.

Observed pattern:

1. The host data list registers the workflow through `FlowMappings[]`.
2. The workflow resource lives in `Data.Forms[]` with `WorkflowType = 1` and `ListID = <Stock Box ListID>`.
3. The decoded `DefResource.childshapes[]` contains a `StartNoneEvent`, one `AI` node, and an `EndNoneEvent`.
4. The `AI` node references the in-app Agent through `properties.data.AgentID`.
5. The `AI` node maps current-item values into Agent input variables through `properties.inputVariables[]`.
6. The Agent contains an application-resource access tool that is scoped to app resources and instructed to update the originating `Stock Box` item.

## Trigger Registration

The new-item trigger is not stored on the `StartNoneEvent`.

It is proven by the `Stock Box` list `FlowMappings[]` entry:

- `Title = "Extract&Update In-Stock"`
- `DefKey = "extract_update_stock_box_label_data"`
- `Method = 0`
- `Setting = {"NewTrigger": true}`
- `FieldName = "Text24"`

`Text24` is the list field whose control type is `flowstatus`, linking the list to the workflow state.

## AI Assistant Node

Observed AI node properties:

| Property | Observed value |
| --- | --- |
| `stencil.id` | `AI` |
| `properties.name` | `Update records based on image` |
| `properties.type` | `agent` |
| `properties.user` | `null` |
| `properties.data.AppID` | local app ID |
| `properties.data.ListSetID` | local app/listset ID |
| `properties.data.AgentID` | local bundled Agent ID |
| `properties.inputVariables` | array |
| `properties.outputVariables` | empty array |

This export proves that data-list workflows reuse the same `AI` workflow node family already proven in scheduled workflows, but with list-field expressions instead of workflow-variable expressions as the primary input source.

## Input Mapping

Two Agent inputs are bound:

| Agent input | Type | Workflow mapping |
| --- | --- | --- |
| `label_image` | `img` | list-field expression pointing at `Stock Box.Image File` |
| `stock_box_item_id` | `text` | list-field expression pointing at native `ListDataID` |

The image binding uses:

```json
{
  "exprType": "list_field",
  "valueType": "icon-upload",
  "prop": "Text9",
  "id": "ImageFile",
  "type": "expr"
}
```

The item-ID binding uses:

```json
{
  "exprType": "list_field",
  "valueType": "input",
  "prop": "ListDataID",
  "id": "ListDataID",
  "type": "expr"
}
```

## Comparison Across Invocation Contexts

| Host context | Trigger source | Agent reference shape | Primary input mapping | Output mapping | Resource access behavior | Proof status |
| --- | --- | --- | --- | --- | --- | --- |
| Copilot | user chat/tool call | Agent/Copilot tool binding in AI resource `Components[]` | Copilot runtime inputs | tool-specific | tool/component-driven | export-proven from earlier studies |
| Scheduled workflow | recurrence schedule | `AI.properties.data.AgentID` | workflow variables, for example `QueryItems` | workflow variable mapping | Agent tools or later workflow actions | export-proven |
| Approval workflow | approval/task events | expected reuse of `AI` node shape | likely workflow variables or form-derived values | likely workflow variables | runtime-sensitive | not directly proven in this branch |
| Form action | page/button/onload action | separate form-action AI wrapper | form variables / temp variables | form-action variable mapping | runtime-sensitive | previously observed as adjacent only |
| Data-list workflow | `FlowMappings.Setting.NewTrigger = true` on list item creation | `AI.properties.data.AgentID` | current list item fields, including image/file and `ListDataID` | none in this export | Agent uses app-resource access tool to update same item | export-proven in this branch |

## Generation Guidance

- Model data-list workflows as `Data.Forms[]` entries with `WorkflowType = 1` and nonzero `ListID`.
- Register them on the host list through `FlowMappings[]`.
- Use `FlowMappings.Setting.NewTrigger = true` for new-item-triggered workflows.
- When the workflow needs an Agent, use workflow node `stencil.id = "AI"` with `properties.type = "agent"`.
- Map file/image fields through `inputVariables[]` using list-field expressions.
- Pass the current row ID through a list-field expression on `ListDataID`.
- Treat any Agent tool that can update app resources as runtime-sensitive until it is proven safe in an isolated sandbox app.
