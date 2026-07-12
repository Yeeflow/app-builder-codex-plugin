# Set Variable Golden Reference Standard

Proof boundary: export-proven from the manually configured `Business Travel Request-v1.1.yapk`; generator and validator backed after the focused regression suite. Runtime mutation remains a separate proof.

The Approval Form Form Action, Approval workflow, Data List workflow, field-change action, Start another action, and current-list update additions are export-proven from `Business Travel Request-v1.2.yapk`.

## Capability Decision

Use Set variable when page or workflow logic must assign a known value or expression result to an existing variable/field. Do not use it to query records, persist unrelated resources, or create undeclared variables.

- Dashboard Form Actions may target declared page `tempVars` only.
- Data List Form Actions may target declared page `tempVars` or fields on the current Data List record.
- Approval Form Actions may target declared approval/page variables supported by that form context; they must not use Data List `list_field` targets.
- Approval, Data List, and Scheduled workflows use `SetVariableTask.properties.variablesetting[]`. Workflow nodes have no single/multiple toggle; one versus many is represented only by array length.

## Form Action Serialization

Single assignment:

```json
{
  "type": "setvar",
  "attrs": {
    "setvar_var": { "exprType": "variable", "id": "__temp_var_Status", "type": "expr" },
    "setvar_val": [{ "type": "str", "value": "Active" }]
  }
}
```

Multiple independent assignments use `setvar_multi: true` plus non-empty `setvar_array[]`, each with `var` and expression-token-array `value`. Do not use one multi step when assignment B depends on the newly assigned value from assignment A; use ordered steps.

Page-load actions bind through `formAction.onLoad`. Button/container clicks and Collection actions bind through a resolvable `attrs.control_action`. Every target temp variable must be declared on the same page/form.

Approval Form field-change actions bind through the source field control's `attrs.control_event_rule`. A Form Action `otheraction` step starts another action through `attrs.control_action`; that target must resolve to another action on the same page. The v1.2 Requester example proves this chain: Page Load sets `Requester = currentUser()`, assigns page temp variables, starts the department action, and the Requester field invokes the same department action after user changes.

Approval Form Set Variable may target workflow/form variables such as User, Department, Text, and Number, or declared page temp variables. User organization attributes use nested export-proven expressions such as `getUserAttr(Requester, DepartmentID)` and `getOrgAttr(getUserAttr(Requester, DepartmentID), Name)`. Derived Department and Department Name controls should be read-only.

Data List field targets use `exprType: "list_field"` and a real current-list field ID/prop. Conditional steps use an expression-token-array `condition`. `continue: true` means continue to the next step when the condition is not met; serialize it only as a boolean. The Domestic/International allowance example requires the first conditional step to continue so the second condition can be evaluated.

Dynamic Display may consume a temp variable assigned by Set variable. The producer target ID, page `tempVars` declaration, and consumer expression ID must resolve to the same variable. This proves structural linkage, not runtime behavior.

Editable/read-only Dynamic Display uses `attrs.control_display[].actions.attrs.style_regulation_action = "style_regulation_action_editable"` for the true condition. Every rule's `controlId` must equal the containing control's `id`; do not copy another control's ID when cloning a rule.

For plan-driven Approval field generation, `Read Only = Yes` is materialized directly. A generated Dynamic Display rule requires an exact JSON rule array in the field plan; the shared builder replaces each planned `controlId` with the newly generated containing control ID. Prose-only Dynamic Display requirements are not silently converted into guessed expressions.

## Workflow Serialization

Every `SetVariableTask` assignment must include `idx`, `id`, `name`, `type`, `editable`, and expression-token-array `value`. Supported RHS patterns in the focused export include:

- fixed string/number/boolean/date values;
- `now`, `dateAdd`, `iif`, `currentUser`, `getUserAttr`, and `isInGroup` functions when valid for the host;
- another declared workflow variable;
- instance Applicant expression.

The target must be a declared workflow variable with matching ID/type metadata. Scheduled Workflow uses the same `SetVariableTask` contract as Approval and Data List workflows.

## Data List Workflow Boundary

In a Data List Workflow, `SetVariableTask` can assign only declared workflow variables. It may read the current Data List field on the RHS using an export-shaped `exprType: "list_field"` token, but it cannot use that field as the assignment target.

To update a current Data List item field, use `ContentList` / Set Data List with `properties.listtype = "current"` and `properties.listdatas[]` mappings. Each mapping target must resolve to a field on the workflow host list. To update another list, use the selected-list shape with exact application/list metadata and filters. Never reinterpret a planned field mutation as Set Variable.

## App Plan Contract

Form Action rows must use `Form Action Set Variable Planning` and name action, ordered step, host, trigger, target kind, target ID, exact JSON RHS expression tokens, condition, continue behavior, bound control, action-chain target, and consumer. Rows with the same action and step order become one multi-variable step. The shared materializer applies this contract to Approval submission/task pages, custom Data List forms, and Dashboard pages; standalone and full-app generation must call the same helper. Workflow node rows use `Set Variable Assignments` with this machine-readable grammar:

```text
VariableId :: variableType :: Business Name :: JSON expression token array ;; next assignment...
```

Never materialize an empty placeholder assignment when the plan omits exact assignments. Emit an empty `variablesetting[]` and fail validation so the plan can be corrected.

Full-app Data List Workflow and Scheduled Workflow resource envelopes remain explicitly blocked by their existing materializer-not-implemented gates. Their Set Variable schema is export-proven and validator-backed, but the generator must not claim those workflow resources were materialized until the host workflow envelope/registration implementation is complete.

## Generated-Final Hard Gates

- `FORM_ACTION_SETVAR_TARGET_MISSING`
- `FORM_ACTION_SETVAR_TARGET_UNDECLARED`
- `FORM_ACTION_SETVAR_MULTI_ARRAY_EMPTY`
- `FORM_ACTION_SETVAR_VALUE_NOT_EXPRESSION_ARRAY`
- `FORM_ACTION_SETVAR_LIST_FIELD_TARGET_UNSUPPORTED_HOST`
- `FORM_ACTION_SETVAR_LIST_FIELD_TARGET_UNRESOLVED`
- `FORM_ACTION_SETVAR_CONDITION_NOT_EXPRESSION_ARRAY`
- `FORM_ACTION_SETVAR_CONTINUE_NOT_BOOLEAN`
- `APPROVAL_FORM_START_ANOTHER_ACTION_UNRESOLVED`
- `APPROVAL_FORM_FIELD_CHANGE_ACTION_UNRESOLVED`
- `APPROVAL_DYNAMIC_DISPLAY_CONTROL_ID_MISMATCH`
- `APPROVAL_DYNAMIC_DISPLAY_VARIABLE_UNDECLARED`
- `SETVARIABLE_TARGET_TYPE_MISMATCH`
- `DATALIST_WORKFLOW_SETVARIABLE_RHS_FIELD_UNRESOLVED`
- `DATALIST_WORKFLOW_CURRENT_LIST_FIELD_UNRESOLVED`
- `SET_VARIABLE_PLAN_RHS_EXPRESSION_INVALID`
- `SET_VARIABLE_PLAN_LIST_FIELD_TARGET_UNSUPPORTED_HOST`
- `SET_VARIABLE_PLAN_CHAIN_TARGET_UNRESOLVED`
- existing Workflow Set Variable assignment, expression-array, declaration, and type gates
