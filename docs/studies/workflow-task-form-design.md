# Workflow Task Form Design

## Scope

Source export:

```text
/Users/Renger/Downloads/Workflow Actions Runtime Baseline (2)_Task forms.yap
```

This study is export-proven and product-documented for schema learning. A later focused baseline imported, opened, rendered the designer, and published the generated task-form package; no approval request was submitted, no task operation was executed, and no email was sent.

## Model Found

The export contains one app-level approval form named `Workflow Action Approval Test` with `WorkflowType = 2` and `ListID = 0`.

The approval form workflow stores its task pages inside `Data.Forms[].DefResource.pageurls[]`.

| Page | Classification | Export page type | Action panel | Custom buttons | Main pattern | Proof |
|---|---:|---:|---:|---:|---|---|
| `WARTB` | submission form | `type=1` | yes | no | requester submission form | export-proven |
| `WARTB Task` | task form | `type=2` | yes | no | copied submission form, all value-entry controls readonly | export-proven |
| `WARTB Task2` | task form | `type=2` | yes | no | copied form plus editable task-owner fields | export-proven |
| `WARTB Task3` | task form | `type=2` | no | yes | custom approve/reject/reassign/add-assignee buttons | export-proven |
| `WARTB Task4` | task form | `type=2` | no | yes | custom complete button | export-proven |

Task forms are separate from the submission form. `WARTB Task` is reused by multiple Assignment Task nodes. This matches the product-documented model that each Assignment Task associates with one task form, while one task form can be reused by multiple Assignment Task or Claim Task nodes.

No Claim Task node was found in this export.

## Assignment Task Associations

Assignment Task nodes are `MultiAssignmentTask` shapes. The associated task form is stored as:

```text
MultiAssignmentTask.properties.taskurl
```

The value resolves to a page ID in `DefResource.pageurls[]`.

| Assignment task pattern | Task type | Associated task form | Form strategy | Compatibility | Proof |
|---|---|---|---|---|---|
| static direct user | approval/default | `WARTB Task` | action panel | valid | export-proven |
| multiple static users | approval/default | `WARTB Task2` | action panel with editable task-owner fields | valid | export-proven |
| position by department | approval/default | `WARTB Task3` | custom approve/reject/reassign/add-assignee buttons | valid, with one button-binding warning | export-proven |
| position by location | approval/default | `WARTB Task3` | custom approve/reject/reassign/add-assignee buttons | valid, with one button-binding warning | export-proven |
| user group assignment | complete | `WARTB Task4` | custom complete button | valid | export-proven |
| direct position and due-date examples | complete or approval/default | `WARTB Task` | action panel | valid; panel buttons are derived by task type | export-proven plus product-documented |

`properties.tasktype` is absent for approval/default tasks and equals `complete` for Complete tasks.

## Action Panel

The Action Panel control is stored as a normal form control:

```text
type = "workflowControlPanel"
attrs.show-task-panel = true
attrs.rejectValidation = true
attrs.align = "center"
```

The export does not store explicit Approve, Reject, Complete, Reassign, or Add assignee child buttons inside the Action Panel control. Button availability is product-documented as derived from the associated Assignment Task node:

- submission form: Save as draft and Submit
- approval task: Approve and Reject
- complete task: Complete
- reassign/add assignee: shown when `isallowreassign` / `isallowsign` are enabled

In this export, Assignment Task button option fields include:

```text
properties.isallowreassign
properties.isallowsign
properties.allowskip
```

## Custom Buttons And Form Actions

`WARTB Task3` removes the Action Panel and adds four `action_button` controls:

| Button label | Bound form action | Submit operation shape | Supporting controls | Proof |
|---|---|---|---|---|
| `Approval this request` | approval action | `submit` with no `submitType` | task comments textarea | export-proven |
| `Reject this request` | reject action | `submitType = "2"` | task comments textarea | export-proven |
| `Reassign this task to others` | reassign action | `submitType = "4"`, `forword`, `remark` | task comments textarea and user picker | export-proven |
| `Add others to this task` | expected add-assignee action | `submitType = "5"`, `forword`, `remark`, `assignee` | task comments textarea and user picker | export-proven with warning |

Important correction: the original `.yap` study found that the exported `WARTB Task3` included a form action named `Add assignee button clicked` with `submitType = "5"`, but the visible `Add others to this task` button pointed to the Reject action ID. The follow-up export `Workflow Action Approval Test.ywf` corrects this binding: the visible Add others button now points to the Add assignee action, and that action contains the expected Submit form step with `submitType = "5"`, `forword`, `remark`, and `assignee`.

Treat the corrected binding shape as export-proven. Runtime execution is still not proven until a safe task operation test is run.

`WARTB Task4` removes the Action Panel and adds one custom button:

| Button label | Bound form action | Submit operation shape | Associated task type | Proof |
|---|---|---|---|---|
| `Task completed` | complete action | `submit` with no `submitType`, action name `Submit as completed` | Complete task | export-proven |

For Submit form steps, the export-proven operation mapping is:

| Operation | Submit form shape | Notes |
|---|---|---|
| approve | `type="submit"` with no `submitType` on an Approval task action | same default submit shape is also used for complete, so host task type/action name matters |
| reject | `attrs.submitType = "2"` | includes comment expression |
| reassign | `attrs.submitType = "4"` | includes `forword` user expression and `remark` comment expression |
| add assignee | `attrs.submitType = "5"` | includes `forword`, `remark`, and `assignee` expressions |
| complete | `type="submit"` with no `submitType` on a Complete task action | action name is `Submit as completed` |

The export uses the misspelled field name `forword`; preserve it exactly.

## Readonly And Editable Patterns

`WARTB Task` is a copy-style task form. Compared with the submission form, all value-entry controls become readonly:

- submission form: 3 readonly controls, 6 editable value controls
- `WARTB Task`: 9 readonly controls, 0 editable value controls

The observed readonly marker is:

```text
control.readonly = true
```

`WARTB Task2`, `WARTB Task3`, and `WARTB Task4` show task-specific forms that keep copied request controls mostly readonly and add editable task-owner controls such as input, input number, textarea, and task-only user picker.

Task-only workflow variables found:

| Variable | Type | Used by |
|---|---|---|
| `Taskcomments` | text | comment and remark expressions |
| `AnotherUser` | user | reassign/add-assignee user expressions |

## Product Documentation Comparison

References:

- Yeeflow Help Center: Design task forms
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Understand task forms
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Action Panel
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Form Actions
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Submit Form step
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Assignment Task Action
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Yeeflow Help Center: Configuring Custom Approve and Reject Buttons on the task form
  https://<yourdomain>.yeeflow.com/<redacted-path>

| Help Center concept | Export-proven field/shape | Match | Proof |
|---|---|---|---|
| Task forms are separate from submission forms | `pageurls[].type=1` vs `type=2` | matched | product-documented + export-proven |
| One task form can be reused by multiple Assignment Tasks | multiple `properties.taskurl` values resolve to `WARTB Task` | matched | product-documented + export-proven |
| Action Panel on submission form submits/saves draft | `workflowControlPanel` on `WARTB` | partially matched; button labels are derived, not explicit in export | product-documented + export-proven |
| Action Panel on task form depends on Assignment Task type | `workflowControlPanel` plus `tasktype` on task node | matched by model; runtime not tested here | product-documented + export-proven |
| Custom buttons can replace Action Panel | `action_button.attrs.control_action` plus `formdef.actions[]` | matched | product-documented + export-proven |
| Submit form can approve/reject/complete/reassign/add assignee | submit steps with default, `2`, `4`, `5` submit types | matched | product-documented + export-proven |
| Copying submission form can set controls readonly | `WARTB Task` copied controls have `readonly=true` | matched | product-documented + export-proven |

## Add Assignee Binding Correction

| Item | Previous `.yap` finding | Updated `.ywf` finding | Change | Proof level | Notes |
|---|---|---|---|---|---|
| `WARTB Task3` Add others button | Button label was `Add others to this task`, but `attrs.control_action` resolved to `Reject button click` | Button label resolves to `Add assignee button clicked` | corrected binding | export-proven | Button no longer points to reject |
| Add-assignee Submit form step | Separate action existed with `submitType="5"` but was not referenced by the Add others button | Add others button references the action with `submitType="5"` | action is now reachable from the button | export-proven | Runtime execution not tested |
| Add-assignee user mapping | `forword` and `assignee` both referenced the `AnotherUser` user variable | same shape preserved | no schema change | export-proven | Preserve export spelling `forword` |
| Comment mapping | `comment` and `remark` referenced `Taskcomments` text variable | same shape preserved | no schema change | export-proven | No private data in normalized refs |
| Validator guidance | Warn for label/action operation mismatches | Warn remains useful, but corrected export is the positive reference | refined | validator-backed after local checks | Do not hard-error compatibility exports |

## Focused Runtime Baseline

`tools/generators/generate-workflow-task-form-runtime-baseline.mjs` creates `workflow-task-form-runtime-baseline.v1.yap` by applying the corrected `Workflow Action Approval Test.ywf` form definition to the studied package family.

The generated package imported in Yeeflow as `Workflow Task Form Runtime Baseline`, opened successfully, opened the approval form, opened the form designer, rendered the task-form selector with `WARTB`, `WARTB Task`, `WARTB Task2`, `WARTB Task3`, and `WARTB Task4`, rendered `WARTB Task3` with the custom approve/reject/reassign/add-assignee buttons, opened the workflow designer, and published successfully.

This upgrades the package host surfaces to import/open/designer/publish-proven only. It does not prove custom button operation execution, task-owner field persistence, reassign/add-assignee runtime behavior, Complete task execution, Claim Task behavior, or email delivery.

## Generation Rules

- Preserve submission form and task forms as separate `pageurls[]` entries.
- Use `type=1` for submission form pages and `type=2` for task form pages when following this export.
- Every generated `MultiAssignmentTask` and `CandidateTask` should have `properties.taskurl` resolving to a task form page.
- Mirror generated task form references across `properties.taskurl`, `properties.taskUrl`, and `properties.TaskUrl`.
- Set Assignment Task and Claim Task node `properties.pagetype = 1`.
- Set referenced task page outer `pageurls[].pagetype = 1`, even when `pageurls[].type = 2` identifies the page as a task form.
- Treat missing/null TaskUrl, unresolved task page IDs, and referenced task pages with outer `pagetype = 2` as generated-final publish-readiness errors.
- One task form may be reused by multiple Assignment Task nodes when the form responsibilities match.
- For simple approve/reject or complete-only tasks, a copied readonly task form with `workflowControlPanel` is export-proven.
- For task-owner data entry, copied request controls should stay readonly unless intentionally editable, and task-only fields can be added.
- When replacing Action Panel with custom buttons, ensure each `action_button.attrs.control_action` points to a matching `formdef.actions[].id`.
- For Add others/Add assignee custom buttons, bind to the form action whose Submit form step uses `submitType="5"`, not to Reject/Reassign/Approve actions.
- Submit form operations must match task type:
  - approval/default task: approve/reject/reassign/add assignee
  - complete task: complete
- Reassign and add-assignee custom actions require a user-valued expression source; this export uses the `AnotherUser` workflow variable.
- Preserve exact field names such as `submitType` and `forword`.
- Do not claim custom button runtime behavior until focused runtime proof executes the task operation safely.

## Validator Recommendations

Keep checks warning-first in compatibility mode:

- warn when an Assignment Task lacks `properties.taskurl`
- warn when `taskurl` does not resolve to a task form page
- warn when an approval/default task is paired only with complete custom actions
- warn when a Complete task is paired only with approve/reject custom actions
- warn when an `action_button` label implies one operation but its bound action uses another Submit form operation; `Workflow Action Approval Test.ywf` is the corrected positive Add assignee reference
- warn when reassign/add-assignee submit steps lack a user expression
- warn when comment/remark expressions reference missing variables
- warn when copied task forms unexpectedly leave request controls editable for complete-only review tasks

Hard errors should wait until import/runtime failure is proven for generated-final packages.

## Runtime Test Plan

The first focused task-form baseline is documented in `docs/studies/workflow-task-form-runtime-baseline.md`.

Future task-operation baseline:

1. Open task forms through safe disposable tasks.
2. Execute custom approve/reject/reassign/add-assignee/complete only with safe test assignees.
3. Verify task-owner editable field persistence only on disposable requests.
4. Do not send email or route to broad/unknown users.

## Known Gaps

- Claim Task task-form association was not found in this export.
- The Add-assignee custom button binding mismatch in the previous `.yap` is corrected in `Workflow Action Approval Test.ywf`; execution still needs runtime proof.
- Action Panel button labels are product-documented and derived; the export does not store them as explicit child buttons.
- Complete-task custom submit uses the same default Submit form shape as approval but is distinguished by action/task context; runtime proof is still needed.
- Reassign/add-assignee execution was not tested.
- Task-owner field persistence was not tested.
