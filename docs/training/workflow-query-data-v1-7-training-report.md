# Workflow Query Data V1.7 Training Report

## Input

- `Approval form workflow sample-v1.7.yapk`
- V1.6 Workflow Query Data focused training baseline

## Export-Proven Additions

1. Data List Workflow (`WorkflowType = 1`) QueryData count-only query using current-record `ListDataID` as the dynamic filter operand.
2. Complete count branch coverage followed by `ContentList edit` when records exist and `ContentList add` when none exist.
3. Data List Workflow registration through host-list `FlowMappings[]` with `Setting.NewTrigger = true` and a resolving `flowstatus` FieldName.
4. Loop through a current Data List Sub List using `loopType = list`, `prefix = __list_`, current iteration `LoopIndex`, and current row `LoopItem.<field>` expressions.
5. Loop through multiple values using `loopType = values`, `loopValue.type = 2`, and a multiple User field expression.
6. Loop for fixed times using `loopType = number` and a numeric expression-token array.
7. Loop actions nested under `LoopBody.children[]`, including ContentList, MailTask, and Delay.

## Validator Corrections

- `values` and `number` loops do not require `loopValue.prefix`.
- list loops allow `__variables_` for workflow List variables and `__list_` for Data List Sub List fields.
- every Loop mode requires a resolving LoopBody `bodyRef`.
- validators recursively inspect LoopBody children.
- a non-null new-item FlowMappings FieldName is valid only when it resolves to a `flowstatus` field.

## Proof Boundary

These structures are export-proven and validator-backed. The export does not prove plugin-generated Data List Workflow materialization, actual trigger execution, record creation/update, email delivery, Delay timing, or repeated-loop execution. Those remain focused generation/runtime proof requirements.
