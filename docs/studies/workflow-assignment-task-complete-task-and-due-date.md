# Workflow Assignment Task Complete Task And Due Date Settings

## Purpose

This study extends Assignment Task export learning with `Test ABC (2).yap`, focused on task type, Complete task configuration, due dates, due-date reminder actions, and reminder email settings.

Proof boundary:

- `export-proven`: found in `Test ABC (2).yap`.
- `product-documented`: described in Yeeflow Help Center.
- `validator-backed`: checked by local validators after this study.
- `runtime-proven`: not claimed here.

No approval requests were submitted and no email delivery was tested.

## Sources

Source export:

```text
/Users/Renger/Downloads/Test ABC (2).yap
```

Comparison exports:

```text
/Users/Renger/Downloads/Test ABC.yap
/Users/Renger/Downloads/Test ABC (1).yap
```

References:

- Yeeflow Help Center: Assignment Task Action
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Add assignee with Assignee Editor
  https://<yourdomain>.yeeflow.com/<redacted-path>

## Export Inventory

`Test ABC (2).yap` decoded successfully with large numeric IDs preserved as strings.

| Item | Count / value | Proof |
|---|---:|---|
| Approval forms | 1 | export-proven |
| Workflow type | 2 | export-proven |
| Workflow shapes | 38 | export-proven |
| Assignment Task nodes | 12 | export-proven |
| Start nodes | 1 | export-proven |
| SequenceFlow nodes | 24 | export-proven |

## Task Type Findings

Assignment Task task type is stored on `MultiAssignmentTask.properties.tasktype` when present.

| Task type | Export shape | Count | Interpretation | Proof |
|---|---|---:|---|---|
| Approval/default task | `tasktype` absent | 5 | Existing exports use absent `tasktype` for approval/default behavior. | export-proven |
| Complete task | `tasktype: "complete"` | 7 | Complete-task behavior is explicitly serialized with `complete`. | export-proven |

Product documentation describes two Assignment Task types: Approval task and Complete task. The export proves `complete` as the explicit Complete task marker, while Approval task remains represented by absent `tasktype` in these exports.

## Complete Task Configuration

Fields found on Complete task nodes:

| Field | Observed values | Notes | Proof |
|---|---|---|---|
| `tasktype` | `complete` | Explicit Complete task marker. | export-proven |
| `approveway` | `allapprove`, `anyapprove`, `custompercentage` | Completion condition is shared with approval-style nodes. | export-proven |
| `approvepercentage` | `100`, `60` | `60` appears with `custompercentage`. | export-proven |
| `issequential` | `true` on two Complete tasks | Sequential Appointed Order marker remains the same field. | export-proven |
| `automaticapproveddefinition` | `true` on two Complete tasks | Product-doc equivalent is Auto approve/auto complete style behavior; runtime effect untested. | export-proven |
| `isallowrecalled` | `true` on two Complete tasks | Allows recall after task action, subject to runtime rules. | export-proven |
| `isallowreassign` | `true` or `false` | Reassign button setting. | export-proven |
| `isallowsign` | `true` or `false` | Add-assignee/sign-like button setting. | export-proven |
| `allowskip` | mostly `true`, one `false` | Skip/auto handling remains runtime-sensitive. | export-proven |

## Due Date Settings

Due date fields are stored directly under `MultiAssignmentTask.properties`.

| Field | Shape | Notes | Proof |
|---|---|---|---|
| `duedatedefinition` | number | Numeric due amount. Default-like `120` is common; `3` appears for day-based due dates. | export-proven |
| `duedatetype` | `hour`, `day`, `express` | `hour` and `day` are direct units; `express` uses a date variable expression. | export-proven |
| `duedateexpress` | expression-button HTML string | Present with expression-based due date; observed label references a workflow variable. | export-proven |
| `isfromworkcalendar` | boolean | Observed `true` with a day-based due date. | export-proven |

Product documentation also lists minutes as a due-date unit. `minute` was not found in `Test ABC (2).yap` or `Test ABC (3).yap`, so it remains `product-documented` but not export-proven in these files.

## Reminder Actions

Due-date reminder actions are stored in `properties.notifyrules[]`.

Common rule fields:

| Field | Shape | Notes | Proof |
|---|---|---|---|
| `id` | UUID-like string | Redact as `<REDACTED_NOTIFY_RULE_ID>`. | export-proven |
| `actiontype` | `"1"` | Interpreted as Reminder from product docs and email-shaped rule content. | export-proven + product-documented |
| `actiondate.relative` | `"0"`, `"-1"`, `"1"` | `"0"` = at/on due date; `"-1"` = before due date; `"1"` = after due date. | export-proven + product-documented |
| `actiondate.value` | number | Present for before/after offsets. | export-proven |
| `actiondate.type` | `day`, `hour` | Offset unit for before/after rules. | export-proven |
| `subject` | expression-button rich text | Redacted; references form/task due-date context. | export-proven |
| `content` | expression-button rich text / HTML | Redacted; references form/task due-date context. | export-proven |

Observed reminder timing patterns:

| Timing | Export shape | Example offset | Proof |
|---|---|---:|---|
| On due date | `actiondate.relative: "0"` | none | export-proven |
| Before due date | `actiondate.relative: "-1"` | 2 days, 10 hours | export-proven |
| After due date | `actiondate.relative: "1"` | 4 days, 30 hours | export-proven |

Automatic Treatment is product-documented in the Help Center, but only reminder-shaped `actiontype: "1"` rules were found in this export.

## Reminder Recipients

Assignment task email recipient configuration was observed on the task-level `to` field, not inside each `notifyrules[]` item.

| Recipient concept | Export-proven shape | Status | Notes |
|---|---|---|---|
| Task owner / assignee | `properties.to` expression button labeled `Current Task Context:Assignee:Email` | matched | Used by enabled assignment task notification and due-date reminders. |
| Applicant | not found as reminder recipient | product-documented / not found in export | Applicant appears in reminder body tokens, not as the reminder recipient. |
| Task owner line manager | not found | unproven | No committed shape. |
| Task owner department manager | not found | unproven | No committed shape. |
| Others / specified recipients | not found | unproven | No literal or fixed email recipient was found. |

## Help Center Comparison

| Help Center concept | Export-proven field/shape | Match status | Notes | Proof level |
|---|---|---|---|---|
| Assignment Task can be Approval or Complete task | `tasktype: "complete"` or absent `tasktype` | matched | Complete task marker is explicit; Approval/default is absent in the studied export. | product-documented + export-proven |
| Complete task uses Complete-style completion | `tasktype: "complete"`, `approveway`, `approvepercentage` | partially matched | Export proves storage, not button/runtime behavior. | export-proven |
| Due date custom time supports days/hours/minutes | `duedatetype: "day"`, `"hour"` | partially matched | Minutes are product-documented but not found. | product-documented + export-proven |
| Due date from date variable | `duedatetype: "express"`, `duedateexpress` | matched | Expression button references a workflow date variable. | product-documented + export-proven |
| Working day option for day unit | `isfromworkcalendar: true` | matched | Runtime working-calendar behavior not tested. | export-proven |
| Reminder before/at/after due date | `notifyrules[].actiondate.relative` | matched | Relative values map to before/on/after. | product-documented + export-proven |
| Reminder email to task owner | task-level `to` expression for current task assignee email | matched | Rule-level recipient not found. | product-documented + export-proven |
| Automatic Treatment action | not found | not found in export | Do not generate until an export proves shape. | product-documented / unproven |

## Generation Rules

- Preserve absent `tasktype` for approval/default tasks unless a future export proves an explicit approval marker.
- Use `tasktype: "complete"` only for Complete task generation.
- Preserve `approveway` and `approvepercentage` on both Approval/default and Complete task nodes.
- Preserve `automaticapproveddefinition` and `isallowrecalled` when copied from an export, but do not claim runtime behavior until tested.
- Preserve due-date fields together: `duedatedefinition`, `duedatetype`, optional `duedateexpress`, and optional `isfromworkcalendar`.
- Generate `minute` due-date units only as product-documented until an export proves the exact serialized value.
- Preserve `notifyrules[]` as an array of reminder action objects; do not invent Automatic Treatment actions.
- Treat all email notification behavior as configuration-only until a safe delivery test is explicitly scoped.

## Validator Recommendations

Validators should warn, not hard-error in compatibility mode, for:

- unknown `tasktype` values
- `custompercentage` without numeric `approvepercentage`
- unknown `duedatetype`
- `duedatetype: "express"` without `duedateexpress`
- non-boolean `isfromworkcalendar`
- malformed `notifyrules[]`
- unknown reminder timing values
- missing reminder subject/content

## Known Gaps

- Minute due-date serialization was not found.
- Reminder recipients other than current task assignee were not found.
- Automatic Treatment rule shape was not found.
- Complete task runtime button behavior was not tested.
- Due-date reminder scheduling and email delivery were not tested.
