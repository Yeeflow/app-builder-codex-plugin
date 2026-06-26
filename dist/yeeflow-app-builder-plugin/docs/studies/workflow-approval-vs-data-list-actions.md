# Workflow Actions: Approval Form vs Data List

## Purpose

This study compares export-proven Start action and Assignment Task action shapes between approval form workflows, data-list workflows, and the later quick Scheduled Workflow export study.

Source exports:

- Approval workflow baseline: `<downloads>/Test ABC.yap`
- Approval workflow extended settings: `<downloads>/Test ABC (1).yap`, `<downloads>/Test ABC (2).yap`, `<downloads>/Test ABC (3).yap`
- Data-list workflow: `<downloads>/Purchase Requests.ydl`
- Scheduled workflow comparison: `<downloads>/Workflow Actions Runtime Baseline (1).yap`

The data-list export was decoded read-only. Raw `.ydl`, decoded payloads, private IDs, user names, email addresses, tenant IDs, and raw response data are not committed.

References:

- Yeeflow Help Center: Assignment Task Action, https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Add assignee with Assignee Editor, https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Start Action, https://<yourdomain>.yeeflow.com/<redacted-path>

## Data-List Workflow Inventory

| Item | Export-proven finding | Proof level |
|---|---|---|
| Export | `Purchase Requests.ydl` | export-proven |
| Data list | One data list with 14 fields; list and field IDs redacted | export-proven |
| Workflow | One workflow with `WorkflowType: 1` and one `FlowMappings[]` entry | export-proven |
| Trigger | `FlowMappings[].Setting.NewTrigger: true` with `FieldName: null` | export-proven |
| Start action | One `StartNoneEvent`, zero incoming flows, one outgoing flow | export-proven + validator-backed |
| Assignment Task | One `MultiAssignmentTask` with four assignee entries | export-proven + validator-backed |
| Task form | One task form with list-bound controls, normal controls, action panel, and history | export-proven |

## Start Action Comparison

| Capability | Approval form workflow | Data-list workflow | Export-proven field/shape | Match/difference | Proof level |
|---|---|---|---|---|---|
| Start node | `StartNoneEvent` | `StartNoneEvent` | Same stencil ID | matched | export-proven |
| Incoming/outgoing | No incoming; outgoing sequence flows | No incoming; one outgoing sequence flow | `incoming: []`, `outgoing[]` | matched | export-proven + validator-backed |
| Allow terminate | Present in `Test ABC (3).yap` as `terminate` and `terminate-conditions` | Not present in `Purchase Requests.ydl` Start properties | fields absent in data-list Start | difference | export-proven |
| Allow recall | `revoke-conditions` present in `Test ABC (3).yap` | Not present in data-list Start properties | field absent in data-list Start | difference | export-proven |
| Email notification | `isenabledemail`, `to`, `subject`, `html` | Same email field family present | `isenabledemail: true`, expression-button recipient/subject/body shapes | matched | product-documented + export-proven |
| Conditions | Terminate/recall condition rows in approval form workflow | No Start condition fields found in data-list export | not found in data-list export | difference | export-proven |
| Request context | Applicant/request context in expression labels | Applicant/submitter labels still appear in notification expressions | expression labels only, values redacted | partially matched | export-proven |
| List item context | Not applicable in approval form exports | Data-list workflow has list item trigger and list field context in assignment expressions | `FlowMappings[].Setting.NewTrigger` and list-item expression source | export-only difference | export-proven |

## Assignment Task Comparison

| Capability | Approval form workflow | Data-list workflow | Export-proven field/shape | Match/difference | Proof level |
|---|---|---|---|---|---|
| Action stencil | `MultiAssignmentTask` | `MultiAssignmentTask` | Same stencil ID | matched | export-proven |
| Assignee editor array | `properties.usertaskassignment[]` | `properties.usertaskassignment[]` | Same property family | matched | export-proven + validator-backed |
| Static users | Direct user entries found | One direct user entry found | `type: user`, `method: direct`, redacted value | matched | export-proven + API-category-assisted from prior study |
| Job positions | Direct/by department/by location found in approval exports | No job-position assignee found in this data-list export | not found in data-list export | approval-only in current source | export-proven |
| Departments/locations | Present through position routing in approval exports | Not found as assignment sources in this data-list export | not found | approval-only in current source | export-proven |
| Expression editor | Applicant, department, position, user group expressions found | Applicant line manager, user group, and list-item expressions found | expression-button `value` strings | matched with extra data-list context | export-proven |
| List field values | Not found in approval form exports | Found as list-item expression context | `type: listitem` inside assignee expression | data-list only | export-proven |
| Created By field assignee | Not found in approval form exports | Found as Created By line-manager expression | list-item `CreatedBy` with `LineManager` property | data-list only | export-proven |
| Task type | Approval/default by absent `tasktype`; Complete via `tasktype="complete"` in `Test ABC (2).yap` | `tasktype` absent, matching approval/default shape | absent `tasktype` | matched default | export-proven |
| Appointed order | `issequential=true` or absent/default | Not found in this data-list assignment task | absent `issequential` | not found in data-list source | export-proven |
| Due date | `duedatedefinition`, `duedatetype`, `duedateexpress`, reminders | `duedatedefinition: 120`, `duedatetype: hour`, one `notifyrules[]` entry | same field family | matched | export-proven + validator-backed |
| Email notification | `isenabledemail`, `to`, `subject`, `html`, `notifyrules` | Same field family present | current task assignee email expression; subject/body redacted | matched | product-documented + export-proven |
| Task form | Approval form task forms use workflow controls and normal controls | Data-list task form mixes normal controls with list-bound controls | `pageurls[].formdef` with `isListControl` controls | data-list extension | export-proven |

## Task Form Comparison

| Capability | Approval form workflow | Data-list workflow | Export-proven field/shape | Match/difference | Proof level |
|---|---|---|---|---|---|
| Normal controls | Present in approval task forms | Present in data-list task form | normal controls bound to workflow variables | matched | export-proven |
| List field controls | Not applicable in approval form exports | Present | `isListControl: true` | data-list only | export-proven |
| Custom list fields | Not applicable in approval form exports | Present | `identifier` such as a custom `Text*` field, binding prefix `____customListFields_` | data-list only | export-proven |
| Default/native fields | Not applicable in approval form exports | Present for Created By and Title-style list fields | `identifier: CreatedBy`, native field binding shape | data-list only | export-proven |
| Read-only custom fields | Not applicable in approval form exports | Present | custom list field controls with `readonly: true` | data-list only | export-proven |
| Default/native read-only behavior | Not applicable in approval form exports | Created By appears read-only in studied export | `attrs.readonly: true` | data-list only; do not overgeneralize | export-proven, runtime-unproven |
| Workflow controls | Action panel/history found in task forms | Action panel/history found in task form | `workflowControlPanel`, `workflowHistory` | matched | export-proven |

## Help Center Comparison

| Help Center concept | Export-proven field/shape | Match status | Notes | Proof level |
|---|---|---|---|---|
| Start action initiates workflow and can send email | Data-list Start has no incoming flow and has `isenabledemail/to/subject/html` | matched | Product article describes Start email generally; data-list export confirms email fields in a data-list workflow. | product-documented + export-proven |
| Start allow terminate / allow recall | Approval export has terminate/recall condition fields; data-list export does not | partially matched | Help article describes these for Start action generally; data-list export did not include them. | product-documented + export-proven |
| Assignment Task can assign to users, groups, positions, expressions | Data-list export has direct user, applicant line manager, user group, and list-item expressions | matched | Position shapes were proven in approval exports, not this `.ydl`. | product-documented + export-proven |
| Workflow variable / data-list value as assignee | Data-list export uses list-item Created By context in assignee expression | matched | Help Center discusses variable/data-list-driven users; export proves one serialized list-item shape. | product-documented + export-proven |
| Task forms are associated with assignment tasks | Data-list assignment task references a task form in `pageurls[]` | matched | Data-list task form additionally includes list-bound controls. | product-documented + export-proven |

## Generation Rules

- Keep approval form workflow and data-list workflow Start action rules separate.
- For data-list workflow Start actions, do not invent `terminate`, `terminate-conditions`, or `revoke-conditions` unless a data-list export proves them.
- Preserve Start email notification fields together when present: `isenabledemail`, `to`, `subject`, and `html`.
- Preserve data-list workflow `FlowMappings[]` trigger settings and workflow `ListID`/`WorkflowType` linkage.
- Preserve Assignment Task assignee list values as expression-button strings; do not convert list-item expressions into static IDs.
- For Created By assignee routing, preserve the list-item `CreatedBy` source and selected property, such as `LineManager`, as export-proven.
- Do not invent user, group, position, department, location, list, or field IDs. Use safe lookup or explicit tenant-local mapping only when authorized.
- Preserve data-list task form list controls with `isListControl: true`, `identifier`, `InternalName`, `fieldID`, and `____customListFields_` binding.
- Set custom list fields read-only when the task should display source data without updating it.
- Treat default/native list field editability as export-proven only for the fields observed here; runtime/designer proof is still needed before broad claims.
- Lay out generated workflow nodes without overlap and keep sequence-flow source/target plus incoming/outgoing references consistent.

## Validator Recommendations

- Warn, not hard-error in compatibility mode, when a data-list workflow task form list-field control references an unknown field.
- Warn when a list-field binding does not use the studied `____customListFields_` prefix.
- Warn when a native/default list field is explicitly editable; studied native/default examples were read-only.
- Warn when a custom list field is editable unless generation explicitly wants the task to update that source field.
- Warn that list-item assignee expressions are export-proven but runtime routing still needs a focused baseline.

## Runtime-Test Additions

Future focused runtime baselines should add data-list workflow designer/open proof for:

- data-list Start action email notification configuration
- Assignment Task assignee from Created By/list item context
- data-list task form list-bound controls
- read-only custom list fields
- default/native list fields in task forms

Runtime submit/routing proof should use disposable list records and safe assignee references only. Do not test email delivery unless safe recipients and delivery scope are explicitly approved.

## Combined Baseline Coverage

`tools/generators/generate-workflow-actions-combined-runtime-baseline.mjs` builds a single ignored package with one approval form and one data list so the two workflow families can be checked in one Yeeflow app:

- approval-form workflow: Start terminate/recall/email fields plus representative Assignment Task assignee, task type, appointed order, due-date, reminder, and notification settings
- data-list workflow: Start email settings without terminate/recall fields, Created By/list-field assignee expression, and a task form with list-bound controls

The combined package is for import/open/designer/publish proof first. It should not be used to claim routing, email delivery, due-date reminder delivery, or data-list task form save behavior until those paths are explicitly submitted and observed with safe test data.

The combined package was imported and tested in Chrome. The approval workflow designer opened with a non-overlapping graph, the approval Start panel rendered terminate/recall/condition/email settings, representative Assignment Task panels rendered assignee/task-type/appointed-order controls, and the approval workflow published successfully. After read-only API-assisted safety checks confirmed the first approval Assignment Task was a single direct-user target, one fake approval request was submitted and a new Pending task appeared for `Workflow Action Approval Test` with task label `Static User Assignment`. This submit proof is limited to the first approval direct-user task.

The data-list workflow designer opened with a Start -> Assignment Task -> End graph, rendered data-list Start email settings without terminate/recall controls, rendered the data-list Assignment Task mixed assignee/list-field expression configuration, and published successfully. Data-list item submission was skipped because the first data-list Assignment Task has mixed direct, expression, user-group, and list-item/Created By sources. Data-list routing, group/position/list-field expansion, task-form save/edit behavior, due-date reminders, and email delivery were not tested.

## Known Gaps

- Data-list Start terminate/recall fields were not found in this export.
- Data-list Start email delivery was not tested.
- Created By/list-field assignee routing was not runtime-tested.
- Approval direct static-user routing is runtime-proven only for the first submitted task in the combined baseline.
- Data-list task form save/edit behavior for list-bound controls was not runtime-tested.
- Default/native list field read-only behavior is based only on the studied export shape.

## Claim Task Addendum

`Workflow Actions Runtime Baseline (3)_Claim task.yap` adds Claim Task comparison coverage.

| Capability | Approval form workflow | Data-list workflow | Proof level |
|---|---|---|---|
| Internal action type | `CandidateTask` | `CandidateTask` | export-proven + config-reference-backed |
| Receiver/candidate field | `properties.usertaskassignment[]` | `properties.usertaskassignment[]` | export-proven |
| Task form association | `properties.taskurl` resolves to task pages such as `WARTB Task3`/`WARTB Task4` | `properties.taskurl` resolves to data-list task page `Approval task` | export-proven |
| Task type | `approve` and `complete` | `approve` and `complete` | export-proven |
| Receiver sources | user-group expression | direct user, applicant line manager, Created By line manager | export-proven |
| Data-list field context | not found | `listitem` / `CreatedBy` expression found | export-proven |
| Email config | fields present but disabled in studied Claim Tasks | `isenabledemail=true` with `to`, `subject`, and `html` | export-proven |
| Claim ownership behavior | product-documented only | product-documented only | not runtime-proven |

Use Claim Task for candidate/receiver pool ownership. Use Assignment Task for direct assignee ownership. Do not claim group/list-field claim routing or claim locking until a focused runtime baseline proves it.

## Scheduled Workflow Addendum

`Workflow Actions Runtime Baseline (1).yap` adds one Scheduled Workflow comparison point. See `docs/studies/workflow-scheduled-vs-approval-data-list-actions.md` for the focused study.

| Capability | Approval form workflow | Data-list workflow | Scheduled workflow | Proof level |
|---|---|---|---|---|
| Workflow discriminator | `WorkflowType = 2` | `WorkflowType = 1` | `WorkflowType = 3`, `ListID = 0` | export-proven |
| Start node | `StartNoneEvent` | `StartNoneEvent` | `StartNoneEvent` | export-proven |
| Start terminate/recall | present in approval export | absent in data-list export | absent in scheduled export | export-proven |
| Start email config | present | present | present | product-documented + export-proven |
| Assignment Task family | `MultiAssignmentTask` | `MultiAssignmentTask` | `MultiAssignmentTask` | export-proven + validator-backed |
| Scheduled assignee source | approval/applicant context | list-item context available in data-list export | applicant line-manager expression only in scheduled export | export-proven |
| Data-list field expression source | not found | found | not found in scheduled export | export-proven |

Generation rule: do not copy approval-form terminate/recall fields or data-list field assignee sources into Scheduled Workflow generation unless a Scheduled Workflow export proves those fields. Scheduled Workflow Assignment Task routing remains untested.

## Set Variable Addendum

`Workflow Actions Runtime Baseline (4)_Set variable.yap` adds Set variable comparison coverage.

| Capability | Approval form workflow | Data-list workflow | Proof level |
|---|---|---|---|
| Internal action type | `SetVariableTask` | `SetVariableTask` | export-proven + config-reference-backed |
| Current workflow variable target | `formtype="current"` found | `formtype="current"` found | export-proven |
| Another approval workflow target | `formtype="custom"` with target app/listset/proc key and form id found | same target metadata shape found | export-proven |
| Multiple variables in one action | 3 `variablesetting[]` rows found | 4 `variablesetting[]` rows found on another-workflow node | export-proven |
| Data-list field values | not found as right-side values | `exprType="list_field"` right-side values found | export-proven |
| Data-list field targets | not applicable | not found; Set variable targets workflow variables only | export-proven absence |
| Data-list field mutation | use Set data list / `ContentList` | use Set data list / `ContentList` | product-documented |

Do not claim runtime variable mutation, another-workflow updates, or list-field value resolution until a focused runtime baseline proves those paths.

## Set Data List Addendum

`Workflow Actions Runtime Baseline (5)_Set data list.yap` adds Set data list comparison coverage.

| Capability | Approval form workflow | Data-list workflow | Proof level |
|---|---|---|---|
| Internal action type | `ContentList` | `ContentList` | export-proven + config-reference-backed |
| Selected data source | `listtype="select"` found | `listtype="select"` found | export-proven |
| Current list mode | not found | `listtype="current"` found | export-proven |
| Add operation | `type="add"` found | `type="add"` found | export-proven |
| Edit/update operation | `type="edit"` found | `type="edit"` found | export-proven |
| Delete/remove operation | `type="remove"` found | not found in this export | export-proven |
| Field mappings | `listdatas[]` with `Columns`, `Per`, `Data` | same shape | export-proven |
| Filters | `wheres[]` found on edit/remove | `wheres[]` found on edit | export-proven |
| Numeric operation codes | `Per` codes `0`, `1`, `2`, `3`, `4` found | `Per` codes `0`, `1` found | export-proven |
| List-field values | approval variables/application context; approval sub-list variable references | `exprType="list_field"` values, including sub-list valueType `list` | export-proven |
| Document-library target | not found | not found | unproven in this export |

Set data list is the workflow action for data-source mutation. Use it instead of Set variable when the requirement is to add, update, or delete data-list records or fields. Runtime mutation, numeric operation execution, and sub-list row iteration remain not runtime-proven.

## Signal Event Addendum

`Workflow Actions Runtime Baseline (6)_Signal event.yap` adds Signal event comparison coverage.

| Capability | Approval form workflow | Data-list workflow | Scheduled workflow | Proof level |
|---|---|---|---|---|
| Internal action type | `SignalEvent` | not found | not found | export-proven absence outside approval workflow in this export |
| Purpose | recall/terminate event source branch | unproven | unproven | product-documented + export-proven |
| Incoming flow | none | not applicable | not applicable | export-proven |
| Outgoing flow | one flow to downstream cleanup branch | not applicable | not applicable | export-proven |
| Event definitions | `RevokeEventDefinition`, `CancelEventDefinition` | not found | not found | export-proven + config-reference-backed |
| Relationship to Start | pairs with approval Start terminate/recall settings | data-list Start has no terminate/recall fields in studied exports | scheduled Start has no terminate/recall fields in studied exports | export-proven comparison |
| Downstream cleanup | `ContentList` edit with nonempty `wheres[]` | not found | not found | export-proven schema; runtime-unproven |

Use Signal event only as approval-workflow-proven schema for now. It is a separate event source with no incoming line, unlike normal workflow actions. It can connect to Set data list / `ContentList` for compensation or cleanup patterns, but recall/terminate firing and downstream data mutation are not runtime-proven.
