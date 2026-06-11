# Workflow Task Form Runtime Baseline

## Scope

Generated package:

```text
workflow-task-form-runtime-baseline.v1.yap
```

Local copy used for import:

```text
/Users/Renger/Downloads/workflow-task-form-runtime-baseline.v1.yap
```

Generator:

```text
generate-workflow-task-form-runtime-baseline.mjs
```

The generated package starts from `Workflow Actions Runtime Baseline (2)_Task forms.yap` and applies the corrected approval-form definition from `Workflow Action Approval Test.ywf`.

## Runtime Result

| Area | Result | Proof level | Notes |
|---|---|---|---|
| package import | passed | import/open-proven | Yeeflow imported the package as `Workflow Task Form Runtime Baseline`. |
| app open | passed | import/open-proven | The imported app opened and was not empty. |
| published submission form open | passed | import/open-proven | `Workflow Task Form Runtime Test` opened with the submission form and Action Panel. |
| form designer open | passed | designer-proven | The designer opened for the approval form. |
| task form selector | passed | designer-proven | The selector listed `WARTB`, `WARTB Task`, `WARTB Task2`, `WARTB Task3`, and `WARTB Task4`. |
| copied readonly task form | passed | designer-proven | `WARTB Task` rendered copied readonly request controls. |
| editable task-owner form | passed | designer-proven | `WARTB Task3` rendered task-only comment and user-picker controls plus custom buttons. |
| corrected Add others button | passed for designer visibility | designer-proven | `Add others to this task` rendered on `WARTB Task3`; operation execution was not run. |
| workflow designer open | passed | designer-proven | The workflow graph rendered with Assignment Task nodes and connected flows. |
| workflow publish | passed | publish-proven | Yeeflow reported `The form has been published successfully!`. |

## Proof Boundary

Runtime-proven in this pass:

- Package import/open.
- Approval form open.
- Form designer open.
- Workflow designer open.
- Workflow publish.

Designer/publish-proven only:

- Submission form plus four task forms in the form selector.
- Standard Action Panel on the submission form and copied task forms.
- Task-specific readonly/editable layout patterns.
- `WARTB Task3` custom approve/reject/reassign/add-assignee button layout.
- `WARTB Task4` custom complete button layout.
- Assignment Task graph render and publish.

Not runtime-proven:

- Approve operation execution.
- Reject operation execution.
- Reassign operation execution.
- Add assignee / Add others operation execution.
- Complete task execution.
- Task-owner field save/persistence.
- User picker value resolution.
- Claim Task task-form behavior.
- Email delivery.

No approval request was submitted, no task operation was executed, no user was reassigned, no assignee was added, no Complete task was completed, and no email was sent.

## Local Validation

Local validation before import:

- `node --check generate-workflow-task-form-runtime-baseline.mjs`
- `node --check scripts/inspect-workflow-task-forms.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check workflow-action-config-validator.js`
- `node validate-yap-package.js workflow-task-form-runtime-baseline.v1.yap --mode generator --stage final`
- `node validate-yap-graph.js workflow-task-form-runtime-baseline.v1.yap --mode generator --stage final`
- `node scripts/inspect-workflow-task-forms.mjs workflow-task-form-runtime-baseline.v1.yap --out-dir /tmp/workflow-task-form-runtime-inspect`
- `node workflow-action-config-validator.js workflow-task-form-runtime-baseline.v1.yap`
- `git diff --check`

The package validator passed with warnings only. The warnings preserve the existing boundary around tenant-local assignees, user-group/list-field routing, and runtime-unproven task operation behavior.

## Generation Notes

The generator performs a narrow package repair for runtime testing:

- preserves the export-proven task-form package family
- applies the corrected `.ywf` definition so `WARTB Task3` uses the corrected Add others binding
- renames the package/app/form for this focused baseline
- fills missing child data-list `ListModel.ListType` from `ListModel.Type` so the package validator accepts the copied child list structure

The generated `.yap` remains ignored and must not be committed.

## Next Runtime Step

The next pass should use a disposable request and explicitly selected safe users before executing task operations. Suggested order:

1. Open a generated pending task for the copied readonly task form.
2. Open `WARTB Task3` from a safe approval task and verify custom controls in task runtime.
3. Execute approve/reject only with a disposable request.
4. Execute reassign/add-assignee only after a safe target user is selected and confirmed.
5. Execute Complete task only on a disposable Complete task path.

Email delivery remains out of scope unless safe recipients and delivery scope are explicitly approved.
