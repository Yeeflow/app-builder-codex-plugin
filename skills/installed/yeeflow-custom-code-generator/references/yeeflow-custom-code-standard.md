# Yeeflow custom code standard

## Surface selection

Yeeflow has two custom-code surfaces with different entrypoints.

| Surface | Host | Required entrypoint | Purpose |
| --- | --- | --- | --- |
| Custom Code control | Page/form control tree, `type: "codein"` | `render(context, fieldsValues, readonly)` | Render UI or page/form interaction helpers |
| Form Action Custom Code step | `formdef.actions[].steps[]` | `execute(context, fieldsValues)` | Run action-side business logic |

Classify the target surface before generating code. Do not apply Custom Code control rules to Form Action Custom Code steps.

## Custom Code control entry structure

Use this structure by default for a visible Custom Code control:

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

## Form Action Custom Code step entry structure

Use this structure for a script that runs inside a Form Action Custom Code step:

```ts
export default class CodeInApplication implements CodeInComp {
  description() { ... }
  inputParameters(): InputParameter[] { ... }
  execute(context: CodeInContext, fieldsValues: any): Promise<void> | void {
    ...
  }
}
```

Rules:

- `execute(...)` is mandatory for `form_action_step`.
- `render(...)` is not required for `form_action_step`.
- A script with only `render(...)` is invalid for a Form Action Custom Code step.
- A script with only `execute(...)` is invalid for a visible Custom Code control.
- Use helpers called by `execute(...)` for larger action-side workflows.
- Keep package materialization claims gated until the Form Action Custom Code step JSON storage shape is export-proven.

## Runtime conventions
- Target the Yeeflow custom-code runtime: React 15.6, AntDesign 2.13, and TypeScript.
- Read parameters from `context.params`.
- Pass parameter values into the React component as props.
- Read current form values from `fieldsValues` and `context.getFieldValue(...)`.
- Use `context.modules.yeeSDKClient` for list data operations.
- Use `context.modules.fetch`, `context.modules.loadScript`, and `context.modules.loadCSS` only through the runtime-provided `context.modules` object.
- When SDK method names, parameter shapes, or return values are unknown, use `getYeeSDKAPIDetails` where the authoring environment exposes it. If the SDK shape still cannot be proven, block generation or mark the script as requiring SDK confirmation. Do not guess tenant data mutation APIs.
- Inline `<style>` blocks are acceptable for self-contained outputs, but keep CSS safely inside quoted strings. Prefer `['.class{...}', '.child{...}'].join('')` over raw multiline CSS template literals when targeting Yeeflow's pasted-code resolver.
- Favor `React.Component` class components for reusable controls. Avoid `React.createRef()` and use callback refs for older Yeeflow React runtimes.
- Avoid hooks, `forwardRef`, `memo`, and modern React-only APIs unless the user's working Yeeflow example already proves support.
- Make sure the final output starts with the import/export code and includes `export class CodeInApplication implements CodeInComp`; otherwise Yeeflow may report `No exports found`.

## Input parameter conventions
Observed parameter types include:
- `string`
- `number`
- `variable`

Define only the parameters actually needed by the component. Before choosing a type, classify parameters by runtime use:
- plain text parameters: use `string`
- expression-editor parameters: usually use `variable`
- writable save/output targets: usually use `variable` and resolve as write targets
- numeric config parameters: use `number` when numeric metadata is supported; otherwise use `string` plus safe parsing
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

For Form Action Custom Code step documentation, inspect `execute(...)`, action inputs, field/variable writes, SDK calls, trigger timing, and native fallback before writing the guide.

## Validation expectations

Validators should enforce:

- Custom Code controls require `render(...)`.
- Form Action Custom Code steps require `execute(...)`.
- Missing `CodeInApplication` export fails.
- Hooks and stateful function components fail for generated reusable code unless runtime proof exists.
- Unknown SDK calls require SDK-detail proof or a blocked status.
- Unresolved placeholders fail.
- A Form Action Custom Code step without export-proven package storage shape must not be advertised as package-ready.
