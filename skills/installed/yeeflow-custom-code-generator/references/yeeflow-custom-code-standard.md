# Yeeflow custom code standard

## Entry structure
Use this structure by default:

```ts
export class CodeInApplication implements CodeInComp {
  description() { ... }
  requiredFields(params?: CodeInParams) { ... }
  inputParameters(): InputParameter[] { ... }
  render(context: CodeInContext, fieldsValues: any, readonly: boolean) {
    return <Component ... />;
  }
}
```

## Runtime conventions
- Read parameters from `context.params`.
- Pass parameter values into the React component as props.
- Read current form values from `fieldsValues` and `context.getFieldValue(...)`.
- Use `context.modules.yeeSDKClient` for list data operations.
- Inline `<style>` blocks are acceptable for self-contained outputs, but keep CSS safely inside quoted strings. Prefer `['.class{...}', '.child{...}'].join('')` over raw multiline CSS template literals when targeting Yeeflow's pasted-code resolver.
- Favor `React.Component` class components for reusable controls. Avoid `React.createRef()` and use callback refs for older Yeeflow React runtimes.
- Avoid hooks, `forwardRef`, `memo`, and modern React-only APIs unless the user's working Yeeflow example already proves support.
- Make sure the final output starts with the import/export code and includes `export class CodeInApplication implements CodeInComp`; otherwise Yeeflow may report `No exports found`.

## Input parameter conventions
Observed parameter types include:
- `string`
- `variable`

Define only the parameters actually needed by the component. Before choosing a type, classify parameters by runtime use:
- plain text parameters: use `string`
- expression-editor parameters: usually use `variable`
- writable save/output targets: usually use `variable` and resolve as write targets
- numeric config parameters: usually use `string` plus safe parsing
- boolean behavior parameters: often use `variable` plus boolean normalization when dynamic behavior is useful

Use practical ids like:
- `yearFieldName`
- `monthFieldName`
- `dataListId`
- `fieldofDept`

Expression-editor parameters may return primitives, arrays, `{ value }`, `{ label }`, `{ key }`, field/variable binding objects, temp-variable binding objects, or expression wrappers. Include reusable normalization helpers when using them.

Writable target parameters such as `saveToField`, `outputField`, or `resultTarget` are not ordinary values. Resolve the writable target key/name before calling a setter, and do not assume a dropdown-selected variable behaves like a manually typed string.

## requiredFields guidance
Return only current-form field names that the component truly depends on.
Examples:
- year field
- month field
- department field

If no current-form field dependency exists, return `[]`.

For reusable templates with writable target parameters, `requiredFields(params)` can also help capture configured field/temp-variable target names before expression parameters evaluate to current runtime values. Keep this capture focused and defensive.

## Safe access pattern
Use helper methods to safely read field values.
Typical order:
1. `fieldsValues[fieldName]`
2. `context.getFieldValue(fieldName)`
3. safe fallback

For save/write behavior, check the target placement. Approval forms, data list forms, dashboard variables, and dashboard temp variables may expose different setter methods. Use target resolution and defensive setter selection when the template supports multiple placements.

## Output expectation
Default to one complete Yeeflow custom code file.
If the user explicitly asks for changed sections only, return only the changed sections.

When the user provides existing Yeeflow custom code and asks for documentation, default to guide-only output. Inspect `description()`, `inputParameters()`, `requiredFields()`, `render(...)`, data access, save/output behavior, and UI interactions before writing the guide. Do not rewrite code unless requested.
