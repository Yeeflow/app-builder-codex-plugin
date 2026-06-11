# Yeeflow Form Action Submit Step Rules

Use these rules when generating Yeeflow form action steps that submit, save, validate, reject, forward, or otherwise operate on the active form/task.

## Scope

Export-backed from `Form Actions Phase 1 Test v1 Runtime.yap`:

- minimal Submit form step
- Save changes submit-step mode
- designer-visible submit type values

Configured and studied in this export:

- Form Submit / Task Approve / Task Complete
- Save changes

Generated-runtime-proven by `Form Actions Phase 2 Query Submit Test v1`:

- default `submit` step triggered from an `action_button` submits the approval workflow
- reviewer task opens for a requester/current-user expression assignment
- approval completes
- workflow ContentList persistence creates a target-list record
- Save changes mode returns success and does not advance the workflow

Designer-visible but not configured/proven in this export:

- Execute form validation
- Reject
- Task forward
- Add task assignee

## Step Type

Submit form actions use:

```json
{ "type": "submit" }
```

The step lives in:

```text
page.formdef.actions[].steps[]
```

## Default Submit

Minimal observed shape:

```json
{
  "type": "submit"
}
```

Use this for normal form submit / task approve / task complete when no special options are needed.

Rules:

- Keep the native Action Panel available unless the user explicitly asks for custom submit buttons.
- Use a custom action button only when the app needs a specific form-action-driven submit experience.
- Use `formdef.formAction.onSubmit` for submit-time business validation that must run before workflow submission, such as quota checks.
- When submit-time validation calls another action first, use an `otheraction` step that targets the reusable check action, then conditionally run the native `submit` step.
- Conditional warning/confirm/check steps before the native `submit` step normally require step-level `continue: true`, which is the export-backed shape for designer checkbox `Continue next step when condition is not met`. Without it, the valid path can skip the warning but stop before submit.
- If the submit check depends on editable driver fields such as Requester / Applicant, product rows, quota cycle, or application type, make sure those same checks also run on page load and relevant field changes when users can alter the values before submit.
- For guard/block designs, put the invalid-case condition on the warning step and the valid-case condition on the following submit step. If override is allowed, store the confirm result in a temp variable and reference that result in the submit condition.
- Never generate an `otheraction` step that calls its own parent action; that is a recursive action loop, not a submit implementation.
- Do not confuse form action `submit` with workflow graph actions.

## Save Changes

Observed Save changes shape:

```json
{
  "type": "submit",
  "name": "Submit with draft",
  "attrs": {
    "submitType": "3",
    "closeForm": true,
    "ignoreValid": true
  }
}
```

Rules:

- Treat Save changes as a submit mode.
- Use it for draft-like or intermediate save behavior.
- Do not use Save changes for workflow progression.
- Generate `ignoreValid: true` only when draft behavior is intentional.
- Document whether the form closes after save.

## Context Support

Based on designer behavior and current docs:

- approval forms: supported
- data-list forms: supported
- public forms: supported
- dashboards: Submit form step is not supported

Dashboard form actions may still use non-submit step types in future phases if dashboard exports prove the wrapper shape.

## Task Context

Task-specific submit options remain deferred until export-backed:

- Reject
- Task forward
- Add task assignee

Do not generate these from labels alone. They likely require task-context settings, comments, target users, or routing properties.

## Validation Recommendations

Warn when:

- submit step has malformed `attrs`.
- `submitType` is not one of the observed/designer-visible values.
- Save changes uses `ignoreValid: true` without a draft/save purpose.
- Submit form step appears in a dashboard context.
- action button triggering submit has missing or generic `nv_label`.

Use errors only for structurally invalid JSON.

## Runtime Baseline Status

`Form Actions Phase 2 Query Submit Test v1` proved both submit modes in a generated package:

- `Submit form for testing` used a default `type: "submit"` form action step and created workflow instance `20552123947196252162026051500001`.
- The reviewer task opened for `Renger from Yeeflow`, was approved, and the workflow completed.
- The ContentList step created a target-list row with readable values including Request Title, Loaded Count, Selected Query Title, Selected Query Status, Approval Status, and Created From Workflow.
- `Save as draft` used `attrs.submitType = "3"` and returned a success toast without progressing the workflow.

Keep `Save changes` for draft/intermediate save behavior only. Use default submit when the button is intended to move the workflow forward.
