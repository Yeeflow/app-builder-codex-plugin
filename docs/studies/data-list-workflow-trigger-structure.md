# Data-List Workflow Trigger Structure

Source export: `/Users/Renger/Downloads/Spark & AI (1).yap`

Classification: export-proven structure only.

## Host Resource Layout

The `Stock Box` data-list resource proves this split:

- list metadata, fields, views, sample rows: `Data.Childs[]`
- workflow definitions: `Data.Forms[]`
- list-to-workflow trigger binding: `Data.Childs[].FlowMappings[]`

This branch did not find a dedicated trigger object inside the workflow `StartNoneEvent`.

## New-Item Trigger Representation

For `Extract&Update In-Stock`, the new-item trigger is represented by the host-list `FlowMappings[]` entry, not by special `StartNoneEvent` properties.

Observed trigger markers:

| Location | Observed value |
| --- | --- |
| `FlowMappings[].Title` | workflow display title |
| `FlowMappings[].DefKey` | workflow key |
| `FlowMappings[].Method` | `0` |
| `FlowMappings[].Setting` | JSON string with `{"NewTrigger": true}` |
| `FlowMappings[].FieldName` | flow-status field name when present |

## Workflow Resource Shape

The matching workflow resource is a `Data.Forms[]` entry with:

- `WorkflowType = 1`
- `ListID = <host list ID>`
- `ProcModelID = <workflow/process ID>`
- `DefResource = "<json string>"`
- `Deployed = true`

The decoded `DefResource` contains:

- `childshapes[]`
- `variables.basic[]`
- `variables.listref[]`
- `variables.filter[]`
- `ProcModelListID`
- `ProcModelAppID`
- `ProcModelListSetID`
- `AppListSetID`
- `workflowType = 1`

## Start Event

The workflow graph begins with `stencil.id = "StartNoneEvent"`.

In this export, the `StartNoneEvent` itself does not carry the new-item trigger discriminator. It behaves like a generic start node, while the trigger semantics come from the list registration layer.

## Current-Item Access

The workflow accesses the triggering item directly through list-field expressions inside the workflow graph:

- current image field via `exprType = "list_field"` and `prop = "<field slot>"`
- current item ID via `exprType = "list_field"` and `prop = "ListDataID"`

That proves the created row is already the active workflow context by the time the `AI` node runs.

## Trigger-Side Recommendations

- For generated data-list workflows, always keep the `FlowMappings[]` entry and `Data.Forms[]` workflow in sync through `DefKey`.
- If a flow-status field is used in `FlowMappings.FieldName`, validate that the field exists and is a `flowstatus` control type.
- Treat `Setting.NewTrigger = true` as the export-proven new-item trigger marker.
- Do not assume `StartNoneEvent` alone is enough to express the trigger type for data-list workflows.
