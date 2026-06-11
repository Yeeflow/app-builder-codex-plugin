# Yeeflow Form Actions Phase 1 Study

Source export studied read-only: `<downloads>/Expression Sublist Summary Workflow Test v1.yap`.

Focus form: `Expression Sublist Summary Workflow Test v1`.

Focus submission page: `Submit Purchase Line Items`.

## Summary

The manual export adds a first export-backed form action pattern on an approval form submission page. The page stores action definitions directly on `page.formdef.actions`, page-load wiring at `page.formdef.formAction.onLoad`, temp variable references at `variables.tempVars`, and button action wiring at `action_button.attrs.control_action`.

This is Phase 1 coverage only. It proves the exported structures for action buttons, page-load actions, temp variable references, `setvar` steps, and `confirm` steps. It also contains one `listitem` action step, but that step should be treated as out of scope for Phase 1 generation until a dedicated list-item form action test is run.

## Button Style Patterns

All studied button controls use:

- control type: `action_button`
- inline width: `attrs.common.positioning.widthtype = [null, "2"]`
- label text at `label`
- style code at `attrs["button-style"]`
- optional icon at `attrs.icon`
- optional icon type at `attrs["icon-type"]`
- optional icon position at `attrs["icon-posi"]`

Observed style codes:

| Pattern | Label Example | Button Style | Notes |
| --- | --- | --- | --- |
| Primary | `Start`, `Click button action` | `"2"` | Use for primary command or main action button. |
| Soft secondary | `On hold`, `Set default request title` | `"3"` | Use for secondary action with filled but softer treatment. |
| Outline primary | `Save` | `"4"` | Use for save/confirm-like action where outline is preferred. |
| Neutral outline | `Verify` | `"5"` | Use for verification/check commands. |
| Dashed/utility | `Import`, `New item`, `Next` | `"6"` | Use for import/add/next utility commands; add icons when helpful. |

Observed icon buttons:

- `New item`: `attrs.icon = "fa-regular fa-plus"`, `attrs["icon-type"] = "3"`, `attrs["icon-posi"] = "1"`
- `Next`: `attrs.icon = "fa-regular fa-arrow-right"`, `attrs["icon-type"] = "3"`, `attrs["icon-posi"] = "2"`

Generation rules:

- Use inline width by default for form action buttons.
- Use business-readable labels.
- Add meaningful `nv_label` names even when the studied export omitted them.
- Only add `attrs.control_action` when the referenced form action exists.

## Button Click Action Trigger

Button click wiring is direct:

```json
{
  "type": "action_button",
  "attrs": {
    "control_action": "05bc684c-e435-44a5-818e-b1a953175385"
  }
}
```

The target action is a sibling entry in `page.formdef.actions[]` with the same `id`.

Observed button-triggered actions:

| Button Label | Action Name | Action ID | Main Step Type |
| --- | --- | --- | --- |
| `Click button action` | `change value1` | `05bc684c-e435-44a5-818e-b1a953175385` | `setvar` |
| `Set default request title` | `Change request title` | `34df076d-d801-4159-840c-48cb1e7533f7` | `setvar` |
| `Save` | `Show confirmation dialog` | `c988aa6a-7505-4bb5-b405-b24e955e6e15` | `confirm` |
| `New item` | `Add new data list item` | `51aec2a8-3d41-4c64-a47e-c231626e7184` | `listitem` |

## Page Load Action Trigger

Page-load wiring is stored on the page form definition:

```json
{
  "formAction": {
    "onLoad": "28687bbc-31cc-443c-8285-b0ac7dfbbfc0"
  }
}
```

The target action exists in `page.formdef.actions[]`.

Observed use case:

- action name: `Page Load Action`
- step name: `Set default values`
- step type: `setvar`
- sets multiple workflow variables using `attrs.setvar_multi = true` and `attrs.setvar_array[]`

Generation rules:

- Use page-load actions for safe initialization only.
- Common cases: set default title, initialize status text, prefill notes, initialize temp variables, or prefill current-user information.
- Do not use page-load actions for persisted business side effects unless a later export proves that behavior safe.

## Temp Variables

Temp variables are referenced in the top-level form variable collection:

```json
{
  "variables": {
    "tempVars": [
      { "idx": "8b87913a-c5e0-48d6-9df9-453dece7d7c9", "id": "var_Value1" },
      { "idx": "4b55c928-5621-4d37-a0b8-0672608977c5", "id": "var_StartBtnClickCount" },
      { "idx": "a32c09de-6d10-465e-bb7d-27d5adad1aa7", "id": "var_DialogResult" }
    ]
  }
}
```

Expression tokens reference them using an `__temp_` prefix:

```json
{
  "exprType": "variable",
  "valueType": "string",
  "id": "__temp_var_DialogResult",
  "type": "expr",
  "name": "var_DialogResult"
}
```

Generation rules:

- Define the logical temp variable in `variables.tempVars[]`.
- Reference it in expressions as `__temp_${id}`.
- Treat temp variables as front-end form runtime state.
- Do not rely on temp variables for persisted business data unless copied into workflow variables or persisted by an explicit action.

## Form Action Structure

Observed action shape:

```json
{
  "id": "uuid",
  "name": "Business readable action name",
  "steps": []
}
```

Steps run in array order. A step may include:

- `name`
- `condition`
- `continue`
- `attrs`

Observed Phase 1 step types:

- `setvar`
- `confirm`

Observed but deferred step type:

- `listitem`

## Set Variable Step

Single target shape:

```json
{
  "type": "setvar",
  "name": "Set request title",
  "condition": [/* expression tokens */],
  "attrs": {
    "setvar_var": { "exprType": "variable", "valueType": "text", "id": "RequestTitle", "type": "expr", "name": "Workflow Variables:Request Title" },
    "setvar_val": [/* expression tokens */]
  }
}
```

Multi target shape:

```json
{
  "type": "setvar",
  "name": "Set default values",
  "attrs": {
    "setvar_multi": true,
    "setvar_array": [
      {
        "var": { "exprType": "variable", "valueType": "number", "id": "AverageUnitPrice", "type": "expr", "name": "Workflow Variables:Average Unit Price" },
        "value": [{ "type": "num", "value": "100" }]
      }
    ]
  }
}
```

Generation rules:

- Use single-target shape for one value.
- Use `setvar_multi = true` plus `setvar_array[]` when setting multiple values on page load.
- Use expression-token arrays for values.
- Use optional `condition` expression tokens to guard a step.
- Use `continue: true` only when later steps should continue after the condition branch.

## Show Confirm Dialog Step

Observed shape:

```json
{
  "type": "confirm",
  "attrs": {
    "confirm_qs": [
      { "type": "str", "value": "This is an important operation, please confirm!" }
    ],
    "confirm_rs": {
      "exprType": "variable",
      "valueType": "string",
      "id": "__temp_var_DialogResult",
      "type": "expr",
      "name": "var_DialogResult"
    }
  }
}
```

Generation rules:

- Use `confirm_qs` for the message expression tokens.
- Use `confirm_rs` to store the result in a temp variable.
- Display the result through a Text/heading control using the learned Text control pattern and an expression in `attrs.headc.title.variable`.
- Confirm result value shape needs a focused runtime test before promising boolean vs text semantics in generated apps.

## Form Actions vs Workflow Actions

Form actions are front-end designer/runtime logic attached to form pages and controls.

Workflow actions are backend process graph nodes such as ContentList, SetVariableTask, assignment tasks, integrations, and workflow transitions.

Temp variables are form-runtime state. Workflow variables are process/form data and can be used for workflow routing and ContentList persistence.

## Validator Recommendations

Warning-level checks are safe now for:

- action button references missing form action
- page load action references missing form action
- action with empty steps
- `setvar` without target/value
- `confirm` without message or result target
- temp variable expression target missing from `variables.tempVars`
- action button triggering a form action without meaningful `nv_label`

Hard errors should wait until a generated Phase 1 runtime test proves the minimum action shape for generated packages.

## Generation Status

The export proves structure, but this pass does not yet prove a Codex-generated form-action package. Generate `Form Actions Phase 1 Test v1` next using the plan/spec created in this branch.
