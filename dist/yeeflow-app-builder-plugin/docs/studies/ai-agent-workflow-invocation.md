# AI Agent Workflow Invocation

Primary source export: `<downloads>/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: export-proven invocation structure only.

## Agent Resource

The workflow calls AI Agent `Email generation` from `Data.OtherModules[]` where:

- module `Type = "Agents"`
- resource `Type = 0`
- `Settings` is a JSON string
- `Settings.InputVariables[]` declares `QueryItems`
- `Settings.OutputVariables[]` declares `Subject` and `Body`
- `Settings.Model.Id = "default"`
- `Components` is empty

This Agent has no tools, connections, or knowledge resources in the export. The workflow invocation is therefore governed AI execution but not an external connector call.

## Invocation Pattern

The workflow references the Agent by ID:

```json
{
  "type": "agent",
  "data": {
    "AppID": 41,
    "ListSetID": "<APP_LISTSET_ID>",
    "AgentID": "<EMAIL_GENERATION_AGENT_ID>"
  }
}
```

Input flow:

1. `QueryData` writes local list JSON into workflow variable `QueryItems`.
2. `AI` action passes `QueryItems` to Agent input `QueryItems`.
3. Agent returns `Subject` and `Body`.
4. `AI` action maps those outputs into workflow variables `EmailSubject` and `EmailBody`.
5. `MailTask` uses those variables as subject/body.

## Shared Product Pattern

This export reinforces that AI Agents can be invoked from more than Copilots. The proven workflow path is:

- Scheduled Workflow -> AI Assistant action -> AI Agent

The later `Spark & AI (1).yap` study extends this proof to data-list workflows. In that export, `Data.Childs[].FlowMappings[].Setting.NewTrigger = true` starts a `WorkflowType = 1` list workflow, and the workflow `AI` node maps current-row `Image File` plus native `ListDataID` into Agent inputs. Form-action reuse remains unproven until a focused form-action export is studied.

## Generation Boundary

Safe generated packages can include a local Agent and an `AI` action reference only after validators confirm the Agent exists and all mappings are local. Do not execute the workflow automatically, send emails, or call live AI during import/open smoke tests.
