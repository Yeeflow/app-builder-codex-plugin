# Workflow Actions: Scheduled vs Approval and Data List

## Purpose

This quick export-learning pass compares Scheduled Workflow Start and Assignment Task action shapes against the already learned approval-form and data-list workflow behavior.

Source export:

```text
/Users/Renger/Downloads/Workflow Actions Runtime Baseline (1).yap
```

Comparison sources:

- `docs/studies/workflow-approval-vs-data-list-actions.md`
- `docs/studies/workflow-start-action-settings.md`
- `docs/studies/workflow-assignment-task-generation-rules.md`
- `docs/studies/scheduled-workflow-generation-rules.md`
- `docs/studies/scheduled-workflow-resource-structure.md`

Help Center references:

- Yeeflow Help Center: Start Action, https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Assignment Task Action, https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Add assignee with Assignee Editor, https://<yourdomain>.yeeflow.com/<redacted-path>

Raw `.yap` exports, decoded payloads, private IDs, user names, email addresses, tenant IDs, credentials, and raw API data are not committed.

## Export Inventory

| Item | Finding | Proof level |
|---|---|---|
| Export | `Workflow Actions Runtime Baseline (1).yap` decoded read-only | export-proven |
| App shell | `Workflow Actions Runtime Baseline` | export-proven |
| Scheduled Workflow count | 1 | export-proven |
| Scheduled Workflow name | `Schedule workflow sample` | export-proven |
| Scheduled Workflow type | `WorkflowType = 3`, `ListID = 0` | export-proven + validator-backed |
| Schedule settings | `TimeZone`, `Times[]`, `StartDate`, `EndDate`, `Frequency`, `Interval` | export-proven |
| Start action | One `StartNoneEvent` | export-proven |
| Assignment Task | One `MultiAssignmentTask` | export-proven |
| Other nodes | Three `SequenceFlow`, one `EndNoneEvent`, one `EndRejectEvent` | export-proven |

## Start Action Comparison

| Capability | Approval form workflow | Data-list workflow | Scheduled workflow | Proof level | Notes |
|---|---|---|---|---|---|
| Node type | `StartNoneEvent` | `StartNoneEvent` | `StartNoneEvent` | export-proven | Same broad workflow node family. |
| Incoming flow | none | none | none | export-proven + validator-backed | Help Center also describes Start as having no incoming connector. |
| Outgoing flow | one or more | one | one | export-proven + validator-backed | Scheduled export has one outgoing sequence flow. |
| Allow terminate | `terminate` and `terminate-conditions` found in approval export | absent in data-list export | absent in scheduled export | export-proven | Scheduled matches data-list absence in this export. |
| Allow recall | `revoke-conditions` found in approval export | absent in data-list export | absent in scheduled export | export-proven | Do not add recall fields to scheduled workflows from approval-form assumptions. |
| Conditions | approval Start condition rows found | not found in data-list Start | not found in scheduled Start | export-proven | Scheduled condition support remains unproven here. |
| Email notification | `isenabledemail`, `to`, `subject`, `html` | same field family present | same field family present | product-documented + export-proven | Email delivery was not tested. |
| Workflow host context | approval request/applicant context | list item trigger context | schedule resource context with application/applicant-style labels in expressions | export-proven | The scheduled export did not expose data-list field expression sources. |

## Assignment Task Comparison

| Capability | Approval form workflow | Data-list workflow | Scheduled workflow | Proof level | Notes |
|---|---|---|---|---|---|
| Action type | `MultiAssignmentTask` | `MultiAssignmentTask` | `MultiAssignmentTask` | export-proven | Same action family. |
| Assignee config | `properties.usertaskassignment[]` | same property family | same property family | export-proven + validator-backed | Scheduled export has one assignee entry. |
| Assignee source | users, groups, positions, applicant/context expressions | direct/expression/list-field sources | applicant line manager expression | export-proven | Scheduled export proves only the applicant-line-manager expression shape for this host. |
| Data-list field source | not applicable | Created By/list-item expression found | not found | export-proven | Supports the expectation that scheduled expression context is not data-list-field based in this export. |
| Task type | absent `tasktype` approval/default; `tasktype="complete"` in focused export | absent/default in studied data-list export | absent/default | export-proven | Complete task in Scheduled Workflow remains unproven here. |
| Appointed order | sequential/default patterns found | absent/default in studied data-list export | absent/default | export-proven | Scheduled sequential/parallel runtime remains untested. |
| Completion controls | `approveway` values and custom percentage found | `allapprove` found | `allapprove`, `approvepercentage: 100` | export-proven | Scheduled custom percentage not found in this export. |
| Due date/reminder | due-date and reminder fields found | due-date/reminder fields found | `duedatedefinition: 120`; no `duedatetype` or `notifyrules` | export-proven | Scheduled reminder rules not found. |
| Email notification | email fields found on some tasks | email fields found | `isenabledemail: false`; field present | export-proven | Scheduled Assignment Task email enabled shape not found. |
| Task form | approval task forms | data-list task forms with list-bound controls | `taskurl` page reference | export-proven | Scheduled task form page exists in `pageurls[]`; no list-bound task form behavior found. |

## Expression Context Comparison

| Source category | Approval form workflow | Data-list workflow | Scheduled workflow | Proof level | Notes |
|---|---|---|---|---|---|
| Applicant/request context | found | found in some labels | found | export-proven | Scheduled Start uses `Applicant:Email`; Assignment Task uses `Applicant:Line Manager`. |
| Workflow/instance context | found | found | found | export-proven | Scheduled Start subject references workflow name. |
| Data-list field values | not found | found, including Created By/list item context | not found | export-proven | No scheduled workflow list-field assignee source found in this export. |
| Workflow variables | found in earlier scheduled workflow AI/email learning | not the focus here | not found in this scheduled Start/Assignment Task sample | export-proven | Scheduled variable context remains proven by earlier scheduled workflow docs, not this export. |
| User/org reference sources | user, group, department, position, location shapes found in prior approval exports | user/group/list-field shapes found in prior data-list export | applicant line-manager expression only | export-proven | No API lookup was needed because committed results are category-level only. |

## Product-Behavior Reference

The Help Center says Start actions initiate workflows, have no incoming connector, and can be configured with email notification. The scheduled export matches the no-incoming-flow and email-field concepts, but does not prove terminate/recall fields for Scheduled Workflow.

The Help Center says Assignment Tasks can assign work to users, groups, positions, or expressions, can be approval or complete tasks, can use appointed order, and can have due dates and notifications. The scheduled export matches the Assignment Task action family and expression assignee storage, but only proves a narrow applicant-line-manager assignee plus default approval settings for Scheduled Workflow.

## Generation Rules

- Model Scheduled Workflow resources as `Data.Forms[]` entries with `WorkflowType = 3` and `ListID = 0`.
- Preserve Scheduled Workflow Start actions as `StartNoneEvent` with no incoming flow and at least one outgoing flow.
- For Scheduled Workflow Start actions, preserve email fields when present: `isenabledemail`, `to`, `subject`, and `html`.
- Do not copy approval-form `terminate`, `terminate-conditions`, or `revoke-conditions` fields into Scheduled Workflow Start actions unless a scheduled export proves them.
- Preserve Scheduled Workflow Assignment Tasks as `MultiAssignmentTask` with `properties.usertaskassignment[]` when found.
- Preserve applicant/context expression-button strings for Scheduled Workflow Assignment Tasks; do not convert them into static user IDs.
- Do not generate data-list field/Created By assignee expressions inside Scheduled Workflows unless another scheduled export proves a list/query context that provides those values.
- Do not execute, publish, or trigger Scheduled Workflows during export learning.
- Treat Scheduled Workflow Assignment Task routing, task creation, email delivery, due-date behavior, and appointed-order behavior as unproven until a focused runtime baseline explicitly tests them.

## Validator and Inspector Recommendations

- `scripts/inspect-scheduled-workflows.mjs` now reports redacted Scheduled Workflow Start and Assignment Task shapes.
- Validators should continue warning, not hard-erroring, for Scheduled Workflow Start absence of terminate/recall fields.
- Validators should accept `MultiAssignmentTask` in `WorkflowType = 3` workflows using the same warning-first assignee checks as approval and data-list workflows.
- Validators should warn for scheduled assignment expressions that expose data-list field context unless a scheduled export proves the context.
- Validators should warn that Scheduled Workflow execution, task routing, and email delivery require a separate runtime baseline.

## Runtime Boundary

This branch does not generate, import, publish, execute, or trigger a Scheduled Workflow. All Scheduled Workflow Start and Assignment Task findings are export-proven and validator-backed only. Existing Scheduled Workflow import/open/designer proof from earlier AI Assistant learning remains separate and does not prove Assignment Task routing.

Recommended next step: merge this as a quick export-learning milestone if review is clean, then rebuild the plugin because skill/docs/inspector mirrors changed.

## Claim Task Note

`Workflow Actions Runtime Baseline (3)_Claim task.yap` includes approval-form and data-list `CandidateTask` examples, but no Scheduled Workflow Claim Task. The user expectation that Scheduled Workflow Claim Task should be same/similar to approval/application workflow remains unproven by export in this pass.

Do not generate Scheduled Workflow Claim Task as a proven shape until a scheduled export contains `CandidateTask`, or until a focused scheduled runtime/design proof is explicitly scoped. Scheduled Workflow Assignment Task learning remains limited to `MultiAssignmentTask` from the previous scheduled workflow export.

## Set Variable Note

`Workflow Actions Runtime Baseline (4)_Set variable.yap` includes approval-form and data-list `SetVariableTask` examples, but no Scheduled Workflow Set variable node. The scheduled workflow in that export still has workflow variables, but this does not prove scheduled Set variable serialization, expression context, or runtime mutation behavior.

Do not generate Scheduled Workflow Set variable as a proven shape until a scheduled export contains `SetVariableTask`, or until a focused scheduled runtime/design proof is explicitly scoped.

## Set Data List Note

`Workflow Actions Runtime Baseline (5)_Set data list.yap` includes approval-form and data-list `ContentList` examples, but no Scheduled Workflow Set data list node. The studied scheduled workflow in that export has no `ContentList` action.

Do not generate Scheduled Workflow Set data list as a scheduled-workflow-proven shape until a scheduled export contains `ContentList`, or until a focused scheduled designer/open proof is explicitly scoped. Approval-form and data-list workflow Set data list findings remain export-proven for those hosts only.

## Signal Event Note

`Workflow Actions Runtime Baseline (6)_Signal event.yap` includes one approval-form workflow `SignalEvent`, but no data-list or Scheduled Workflow Signal event. The studied scheduled workflow in that export has no `SignalEvent` action.

Do not generate Scheduled Workflow Signal event as a proven shape. The current Signal event proof is limited to approval-form workflow, where it has no incoming flow, one outgoing flow, and `properties.eventdefinitions[]` containing `RevokeEventDefinition` and `CancelEventDefinition`. Scheduled workflow recall/terminate event handling remains unproven.
