# Custom Code Form Action Step Runtime Standard

## Scope

This standard covers Yeeflow **Form Action Custom Code steps**. It is separate from Yeeflow **Custom Code controls**.

Use this standard when custom TypeScript is executed as a step inside a form action. Do not apply Custom Code control rules blindly to this surface.

Current proof boundary:

- Runtime script contract: product-team specification.
- Package storage shape for a Custom Code action step: not yet export-proven by a decoded `.yap` / `.yapk` sample.
- Until the package storage shape is export-proven, generators may write the runtime script and planning guidance, but must not claim final package materialization support for Custom Code action steps.

## Surface Split

| Surface | Host | Primary entrypoint | Required output |
| --- | --- | --- | --- |
| Custom Code control | Page/form control tree, `type: "codein"` | `render(context, fieldsValues, readonly)` | UI/control rendering |
| Form Action Custom Code step | `formdef.actions[].steps[]` | `execute(context, fieldsValues)` | Action-side business execution |

Rules:

- A Custom Code control must include `render(...)`.
- A Form Action Custom Code step must include `execute(...)`.
- A Form Action Custom Code step must not be rejected merely because it does not include `render(...)`.
- A Custom Code control must not be generated with only `execute(...)`.
- If both entrypoints are missing, fail validation.

## Runtime Stack

Use the Yeeflow runtime assumptions from the product specification:

- React 15.6
- AntDesign 2.13
- TypeScript

When helper components are needed, use class components. Do not use React hooks, function components as stateful components, `forwardRef`, `memo`, or other modern React APIs unless a working Yeeflow runtime export proves support.

Only AntDesign 2.13 is built in. Third-party CSS must be loaded through `context.modules.loadCSS(...)` or implemented as scoped local styles.

## Entrypoint Contract

Preferred generated shape:

```ts
import * as React from "react";

export default class CodeInApplication implements CodeInComp {
  description() {
    return "Run a focused form action custom code step.";
  }

  inputParameters(): InputParameter[] {
    return [];
  }

  execute(context: CodeInContext, fieldsValues: any): Promise<void> | void {
    // Business logic goes here.
  }
}
```

Compatible named-export shape:

```ts
export class CodeInApplication implements CodeInComp {
  execute(context: CodeInContext, fieldsValues: any): Promise<void> | void {
    // Business logic goes here.
  }
}
```

Rules:

- Put the main action-side business flow in `execute(...)` or in helpers called by `execute(...)`.
- `execute(...)` may return `void` or `Promise<void>`.
- `render(...)` is not required for this surface.
- Keep generated scripts readable and editable.
- Avoid side effects outside the declared form action purpose.

## Context API

Use only runtime APIs that are available through `context`.

Expected context areas include:

- `context.modules.fetch`
- `context.modules.loadScript`
- `context.modules.loadCSS`
- `context.modules.yeeSDKClient`
- field read/write helpers such as `getFieldValue(...)`, `setFieldValue(...)`, and `setFieldsValue(...)` when available
- filter variables
- temp variables
- `formContext`
- `params`
- `connections`

All Yeeflow system interactions must go through `context.modules.yeeSDKClient`.

If SDK method names, parameters, or return shapes are unknown, use `getYeeSDKAPIDetails` when the authoring environment exposes it. If the SDK shape still cannot be proven, block generation or mark the implementation as requiring SDK confirmation. Do not guess tenant data mutation APIs.

## Input Parameters

Supported parameter types in this runtime contract:

- `string`
- `number`
- `variable`

Rules:

- Use `string` for static copy and static ids.
- Use `number` for numeric configuration when Yeeflow parameter metadata supports it.
- Use `variable` for field, temp variable, filter variable, or expression-editor inputs.
- Normalize runtime parameter values before using them. Variable parameters may resolve to primitives, arrays, objects, expression wrappers, or current variable values.
- For writable targets, resolve the target key separately from the current runtime value.

## Action-Side Safety Rules

Before generating a Custom Code action step, prefer native Yeeflow mechanisms:

1. standard field configuration
2. expressions
3. native form action steps
4. query data steps
5. submit steps
6. workflow actions
7. Custom Code action step

Do not use a Custom Code action step for approval routing, critical financial calculations, persistence, security, permission logic, or tenant-wide data mutation unless the requirement explicitly approves it and no native workflow or server-side action can satisfy the requirement.

When generated:

- Keep writes scoped to declared target fields or variables.
- Do not mutate readonly task data unless explicitly required.
- Avoid infinite loops or actions that retrigger themselves.
- Handle empty, null, and missing values safely.
- Keep external calls disabled unless the requirement explicitly allows them.
- Use diagnostics when the Yeeflow editor/tooling exposes diagnostics.

## Planning Requirements

App Plans that include Form Action Custom Code steps must state:

- `Custom Code Surface: form_action_step`
- host form/page
- host form action name
- trigger path
- custom code step purpose
- input parameters
- fields/variables read
- fields/variables written
- SDK calls required
- native fallback considered
- runtime proof required

If the App Plan only needs a visible custom UI component, use `Custom Code Surface: control` instead.

## Validator Requirements

Generators and validators must enforce:

- Control scripts require `render(...)`.
- Form Action Custom Code step scripts require `execute(...)`.
- A Form Action Custom Code step with only `render(...)` fails.
- A Custom Code control with only `execute(...)` fails.
- Missing `CodeInApplication` export fails.
- React hooks and stateful function components fail for generated reusable scripts unless runtime proof exists.
- Unknown SDK calls require explicit SDK-detail proof.
- Unresolved placeholders fail.
- Package materialization for action-step custom code stays gated until the form action step JSON storage shape is export-proven.

