# Workflow Claim Task Action Study

Proof boundary: this is export-proven, product-documented, config-reference-backed, and validator-backed learning only. No workflow was imported, published, triggered, claimed, approved, rejected, completed, reassigned, or emailed in this pass.

## Sources

| Source | Role | Proof label |
|---|---|---|
| `/Users/Renger/Downloads/Workflow Actions Runtime Baseline (3)_Claim task.yap` | Export/schema source of truth | export-proven |
| `/Users/Renger/Downloads/node-configurations.json` | Node configuration path/control-type reference | config-reference-backed |
| Yeeflow Help Center: Claim Task Action, https://<yourdomain>.yeeflow.com/<redacted-path> | Product behavior and terminology | product-documented |
| Existing Assignment Task and task-form studies | Comparison reference | export-proven / validator-backed |

## Summary

The export contains four Claim Task nodes. All Claim Task nodes serialize as `CandidateTask`.

| Workflow host | WorkflowType | Claim Task count | Assignment Task comparison nodes | Notes |
|---|---:|---:|---:|---|
| Approval form workflow | `2` | 2 | 14 | Claim Task shares task form and `usertaskassignment[]` family with Assignment Task. |
| Data-list workflow | `1` | 2 | 1 | Data-list Claim Task can include direct user, applicant context expression, and list-item/Created By expression receiver sources. |
| Scheduled workflow | `3` | 0 | 1 | This export does not prove Scheduled Workflow Claim Task shape. |

## Claim Task Inventory

| Host | Internal type | Node label | Task type | Receiver/candidate source | Task form | Due date | Email config | Flow | Proof |
|---|---|---|---|---|---|---|---|---|---|
| Approval form | `CandidateTask` | Claim Task | `complete` | user-group expression | `WARTB Task4` | `duedatedefinition=120`, no `duedatetype` | fields present, disabled | 1 in / 1 out | export-proven |
| Approval form | `CandidateTask` | Claim Task | `approve` | user-group expression | `WARTB Task3` | `day`, value `5`, work-calendar true, `notifyrules=[]` | fields present, disabled | 1 in / 2 out | export-proven |
| Data-list | `CandidateTask` | Claim Task | `approve` | direct user + applicant line manager + Created By line manager | `Approval task` | `hour`, value `120`, `notifyrules=[]` | enabled with `to/subject/html` | 1 in / 2 out | export-proven |
| Data-list | `CandidateTask` | Claim Task | `complete` | direct user + applicant line manager + Created By line manager | `Approval task` | `hour`, value `120`, `notifyrules=[]` | enabled with `to/subject/html` | 1 in / 1 out | export-proven |

All IDs, user names, group names, and private organization references are redacted in normalized references.

## CandidateTask Mapping

`node-configurations.json` maps:

| Front-end action | Internal type | Config id | Usefulness | Proof |
|---|---|---|---|---|
| Claim Task | `CandidateTask` | `config_CandidateTask` | Confirms the internal type and expected property paths. | config-reference-backed + export-proven |
| Assignment Task | `MultiAssignmentTask` | `config_MultiAssignmentTask` | Useful comparison for shared task form, due date, and notification fields. | config-reference-backed + export-proven |
| Set variable | `SetVariableTask` | `config_SetVariableTask` | Useful for a future Set variable action study. | config-reference-backed |
| Set data list | `ContentList` | `config_ContentList` | Useful for a future Set data list action study. | config-reference-backed |
| Start | `StartNoneEvent` | `config_StartNoneEvent` | Useful shared Start action reference. | config-reference-backed |
| Connector/line | `SequenceFlow` | `config_SequenceFlow` | Useful for transition condition validation. | config-reference-backed |

The config reference is not runtime proof. The export wins when the config reference and actual export disagree.

Important mismatch: `config_CandidateTask` lists `properties.tasktype ` with a trailing space. The studied export uses `properties.tasktype` without trailing space for every Claim Task. Validators should warn if a trailing-space variant appears and preserve export field names when generating.

## Field Findings

| Field/path | Export finding | Config reference | Proof |
|---|---|---|---|
| `properties.name` | present as Claim Task node label | listed | export-proven + config-reference-backed |
| `properties.displayname` | not present in studied Claim Tasks | listed | config-reference-backed |
| `properties.usertaskassignment[]` | stores receivers/candidates | listed | export-proven + config-reference-backed |
| `properties.taskurl` | references task-form page IDs | listed | export-proven + config-reference-backed |
| `properties.tasktype` | `approve` and `complete` found | config has trailing-space path | export-proven |
| `properties.duedatetype` | `day` and `hour` found | listed | export-proven + config-reference-backed |
| `properties.duedatedefinition` | numeric values `5` and `120` found | listed | export-proven + config-reference-backed |
| `properties.isfromworkcalendar` | true found for day due date | listed | export-proven + config-reference-backed |
| `properties.notifyrules[]` | empty arrays found on due-date Claim Tasks | not listed in CandidateTask config | export-only |
| `properties.disablequickapproval` | not found in export | listed | config-reference-backed only |
| `properties.isenabledemail` | true/false found | listed | export-proven + config-reference-backed |
| `properties.to`, `subject`, `html` | present as expression/rich text fields | listed | export-proven + config-reference-backed |
| `properties.from`, `cc` | not found in studied Claim Tasks | listed | config-reference-backed only |
| `properties.files.list`, `files.variables` | not found | listed, list-workflow note | config-reference-backed only |

## Receiver/Candidate Sources

| Pattern | Found where | Normalized meaning | Runtime caveat |
|---|---|---|---|
| User group expression | Approval Claim Tasks | Candidate pool from user group users | Group expansion and claim ownership are not runtime-proven. |
| Direct user | Data-list Claim Tasks | A specific user can be part of receiver pool | Tenant-sensitive; do not commit real IDs. |
| Applicant line manager expression | Data-list Claim Tasks | Receiver derived from applicant context | Context resolution is not runtime-proven for Claim Task. |
| Created By line manager expression | Data-list Claim Tasks | Receiver derived from list-item Created By context | Data-list list-field receiver expansion is not runtime-proven. |

No position-based Claim Task receiver was found in this export, even though the config reference allows position methods.

## Claim Task vs Assignment Task

| Dimension | Assignment Task | Claim Task | Proof |
|---|---|---|---|
| Front-end purpose | Directly assigns work to one or more assignees. | Sends work to a receiver/candidate pool; a user claims ownership first. | product-documented |
| Internal type | `MultiAssignmentTask` | `CandidateTask` | export-proven + config-reference-backed |
| Main people field | `properties.usertaskassignment[]` means assignees. | `properties.usertaskassignment[]` means receivers/candidates. | export-proven |
| Task form | `properties.taskurl` references task form. | `properties.taskurl` references task form. | export-proven |
| Task type | approval/default or `complete`; previous studies also found approval/default by absence. | `approve` and `complete` found explicitly. | export-proven |
| Due date | same due date family, plus reminder rules in previous Assignment Task study. | `day`/`hour`, numeric definition, work-calendar flag, and empty `notifyrules[]` found. | export-proven |
| Email notification | `isenabledemail/to/subject/html` family. | same family found. | export-proven |
| Runtime ownership | assignee owns pending task directly. | receiver sees claimable task, then one claimant owns pending task. | product-documented, not runtime-proven here |
| Recommended use | Specific users must act. | A pool/team can voluntarily take ownership. | product-documented |

## Approval Workflow vs Data-List Workflow

| Capability | Approval workflow Claim Task | Data-list workflow Claim Task | Proof |
|---|---|---|---|
| Internal type | `CandidateTask` | `CandidateTask` | export-proven |
| Receiver field | `properties.usertaskassignment[]` | `properties.usertaskassignment[]` | export-proven |
| Task form field | `properties.taskurl` | `properties.taskurl` | export-proven |
| Receiver expressions | user group only in this export | direct user, applicant line manager, Created By line manager | export-proven |
| Data-list field values | not found | `listitem` / `CreatedBy` expression found | export-proven |
| Due date | `day` and plain numeric default found | `hour` found | export-proven |
| Email enabled | disabled in both approval Claim Tasks, fields still present | enabled in both data-list Claim Tasks | export-proven |
| File attachment fields | not found | not found | unproven |

## Help Center Comparison

| Concept | Product behavior | Export field/shape | Config reference | Match | Proof |
|---|---|---|---|---|---|
| Claim Task creates claimable work for a receiver pool | Receivers see task in Claim Tasks list and may claim it. | `CandidateTask.properties.usertaskassignment[]` stores receiver/candidate sources. | `config_CandidateTask.properties.usertaskassignment` | matched | product-documented + export-proven + config-reference-backed |
| Receiver options include users, job positions, groups, variables | Help article describes user picker, positions, groups, variables. | Export found user group expression, direct user, applicant expression, list-item expression. | Receiver schema allows direct/expression/position methods. | partially matched | product-documented + export-proven |
| Task form association | Claim Task selects a task form. | `properties.taskurl` resolves to task pages. | `properties.taskurl` | matched | product-documented + export-proven |
| Approval task | Claimed task can approve/reject and should have approved/rejected outgoing paths. | `tasktype="approve"` with two outgoing flows found. | `properties.tasktype` / config typo `tasktype ` | matched | product-documented + export-proven |
| Complete task | Claimed task can complete work items and may have one or more outgoing paths. | `tasktype="complete"` with one outgoing flow found. | `properties.tasktype` / config typo `tasktype ` | matched | product-documented + export-proven |
| Due date settings | supports hours/days/minutes/custom date variable. | `hour`, `day`, numeric definition, work-calendar flag found; minutes not found here. | due date fields listed | partially matched | product-documented + export-proven |
| Email notification | can send email notification to receivers. | `isenabledemail=true` plus `to/subject/html` found in data-list Claim Tasks. | email fields listed | matched | product-documented + export-proven |
| Quick completion | available for approval tasks per article. | `disablequickapproval` not found in export. | field listed | product-only/config-only | product-documented + config-reference-backed |

## Generation Rules

- Use `CandidateTask` for front-end Claim Task only when export-proven.
- Treat `properties.usertaskassignment[]` as receiver/candidate configuration, not direct final assignee ownership.
- Use Claim Task when a pool/team can voluntarily take ownership; use Assignment Task when specific users must take action directly.
- Preserve `properties.taskurl` and validate it resolves to a task-form page.
- Preserve `tasktype="approve"` or `tasktype="complete"` when present. Do not generate `properties.tasktype ` with a trailing space.
- Preserve due-date and email fields together when present.
- Preserve expression-button strings for user group, applicant, and list-item/Created By receiver sources. Do not convert them to static IDs.
- Do not invent users, groups, positions, departments, locations, or list fields. Use authorized read-only lookup only when needed.
- Do not claim claim-pool visibility, claim ownership locking, pending-task routing after claim, quick completion, or email delivery without a focused runtime baseline.

## Validator Recommendations

- Warning-first: validate `CandidateTask` receiver config as `properties.usertaskassignment[]`.
- Warn when receiver/candidate config is missing, empty, or malformed.
- Warn when `taskurl` is missing or does not resolve to a task form.
- Warn when explicit `tasktype` is not `approve` or `complete`.
- Warn on `properties.tasktype ` trailing-space variant.
- Warn when email is enabled but `to`, `subject`, or `html` is missing.
- Warn when due-date fields are inconsistent with `duedatetype`.
- Warn when list-item/Created By receiver expressions are used outside data-list workflows unless another export proves the host context.
- Keep runtime-sensitive behavior as warnings, not hard errors, in compatibility mode.

## Runtime Test Plan Addendum

Recommended next step is a focused runtime baseline for Claim Task designer/open/publish proof first:

- approval workflow Claim Task approval type with user-group receiver
- approval workflow Claim Task complete type with user-group receiver
- data-list workflow Claim Task approval and complete types with direct + expression receivers
- task-form selector/panel proof
- due-date and email configuration panel proof

Claim execution should remain deferred unless safe receivers are explicitly selected. Email delivery should remain out of scope unless safe recipients and delivery scope are explicitly approved.

## Runtime Baseline Update

The combined `Workflow Actions Batch Runtime Baseline` imported and opened successfully. The approval workflow designer rendered a `CandidateTask` Claim Task with receiver/candidate configuration and task-form selection, and the workflow published successfully. The data-list workflow designer also rendered a `CandidateTask` with direct user, applicant line manager, and Created By line manager candidate expressions plus task-form settings, and the data-list workflow published successfully.

This upgrades the Claim Task baseline to import/open/designer/publish-proven for the generated approval and data-list configuration shapes only. Claim execution, claim locking, pending-task routing, approve/reject/complete after claim, quick completion, and email delivery remain not runtime-proven.
