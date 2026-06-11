# Scheduled Workflow Resource Structure

Source export: `<downloads>/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: export-proven structure only. No generated scheduled-workflow package, schedule execution, email delivery, or AI execution is runtime-proven in this branch.

## Location

Scheduled Workflow resources are stored in `Data.Forms[]`, not in `Data.Childs[]`.

Observed resource markers:

| Field | Value / pattern |
| --- | --- |
| `WorkflowType` | `3` |
| `ListID` | `0` |
| `ProcModelID` | large numeric workflow/process ID string |
| `Key` | workflow key, such as `AS-WIU` or `AS-DIU` |
| `DefResource` | JSON string containing workflow graph, variables, pageurls, and metadata |
| `Settings` | JSON string containing recurrence schedule |
| `Deployed` | `true` in both studied workflows |

The decoded `DefResource` has the same broad process graph shape as other Yeeflow workflows:

- `childshapes[]` contains `StartNoneEvent`, action nodes, `SequenceFlow`, and `EndNoneEvent`.
- `variables.basic[]`, `variables.listref[]`, and `variables.filter[]` store workflow variable definitions.
- `pageurls[]` exists even for scheduled workflows and contains a lightweight workflow page with `workflowControlPanel` and `workflowHistory`.
- `defkey` matches `Data.Forms[].Key`.
- `workflowType = 3`.
- `AppListSetID` points to the containing application/listset.

## Workflows Found

| Workflow | Key | Schedule | Actions |
| --- | --- | --- | --- |
| Weekly information update | `AS-WIU` | weekly, Monday and Wednesday | `MailTask` |
| Daily information update | `AS-DIU` | every 2 working days | `QueryData`, `AI`, `MailTask` |

## Resource Dependencies

The daily workflow references:

- data list `Innovation Ideas` through `QueryData.properties.listid`
- AI Agent `Email generation` through `AI.properties.data.AgentID`
- workflow variables `QueryItems`, `QueryAmount`, `EmailSubject`, and `EmailBody`

## ReplaceIds

The wrapper contained 23 `ReplaceIds`. For generated packages, scheduled workflow process IDs, workflow graph node IDs, page IDs, local list IDs, local field IDs, AI resource IDs, and local app/listset IDs should be considered for fresh generated IDs. Do not remap tenant/user metadata or private recipient values.

## Validation Recommendations

- Treat `WorkflowType = 3` as the Scheduled Workflow discriminator.
- Validate `Settings` parses as JSON and contains `TimeZone`, `Times`, `StartDate`, `Frequency`, and `Interval`.
- Validate `DefResource` parses as JSON and `defkey` matches `Key`.
- Validate `QueryData` targets resolve to included data lists.
- Validate `AI` agent-mode actions resolve to included AI Agent resources.
- Warn on fixed email recipients and block live execution unless recipients are explicitly safe.

## Start and Assignment Task Comparison Export

`Workflow Actions Runtime Baseline (1).yap` adds one Scheduled Workflow with Start and Assignment Task actions:

| Item | Export-proven shape |
| --- | --- |
| Workflow | `WorkflowType = 3`, `ListID = 0` |
| Schedule | `TimeZone`, `Times[]`, `StartDate`, `EndDate`, `Frequency`, `Interval` |
| Start | `StartNoneEvent`, no incoming flow, one outgoing flow |
| Start email | `isenabledemail`, `to`, `subject`, `html` |
| Start terminate/recall | `terminate`, `terminate-conditions`, and `revoke-conditions` absent |
| Assignment Task | `MultiAssignmentTask` with `properties.usertaskassignment[]` |
| Assignee | one applicant-line-manager expression-button assignee |
| Assignment settings | absent `tasktype`, `approveway = "allapprove"`, `approvepercentage = 100`, absent `issequential`, `duedatedefinition = 120` |

This proves Scheduled Workflow can store the same Start and Assignment Task action families, but not execution behavior. Do not trigger schedules, send email, or claim task routing from this export.
