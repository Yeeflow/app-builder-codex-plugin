# Custom Code Control and Form Action Step Contract Training Report

## Training Scope

This training separates two Yeeflow custom-code surfaces that were previously easy to conflate:

1. **Custom Code control** hosted in a page/form control tree.
2. **Form Action Custom Code step** hosted inside a form action step sequence.

The goal is to prevent the plugin from applying the Custom Code control `render(...)` contract to action-step scripts that must use `execute(...)`.

## Inputs

Product-team Custom Code control runtime specification:

- React 15.6
- AntDesign 2.13
- TypeScript
- class component compatibility
- `render(context, fieldsValues, readonly)` for visible control output
- `context.modules.yeeSDKClient` for Yeeflow system interactions

Product-team Form Action Custom Code step runtime specification:

- React 15.6
- AntDesign 2.13
- TypeScript
- action-side entrypoint `execute(context, fieldsValues)`
- `execute(...)` may return `void` or `Promise<void>`
- no `render(...)` requirement for this surface
- input parameter types include `string`, `number`, and `variable`
- SDK details must be requested through `getYeeSDKAPIDetails` when unclear

## Learned Contract

| Surface | Host | Required entrypoint | Plugin behavior |
| --- | --- | --- | --- |
| Custom Code control | `type: "codein"` control in page/form JSON | `render(...)` | Generate visible UI/control behavior. |
| Form Action Custom Code step | `formdef.actions[].steps[]` | `execute(...)` | Generate action-side business logic only after native form actions are insufficient. |

Rules:

- The App Plan must declare the custom-code surface.
- A Custom Code control without `render(...)` is invalid.
- A Form Action Custom Code step without `execute(...)` is invalid.
- A Form Action Custom Code step must not fail merely because it lacks `render(...)`.
- A Custom Code control must not be generated with only `execute(...)`.
- Both surfaces must keep Yeeflow runtime compatibility: class components, no hooks, no unproven modern React APIs.
- Yeeflow system interactions must go through `context.modules.yeeSDKClient`.
- Unknown SDK call shapes require `getYeeSDKAPIDetails` or an explicit blocked status.

## Proof Boundary

This training is runtime-contract and planning-guidance backed.

The Form Action Custom Code step package storage shape is **not yet export-proven**. Until a decoded `.yap` / `.yapk` sample proves the exact action-step JSON shape:

- do not claim final package materialization support for Form Action Custom Code steps;
- do generate the runtime script and App Plan requirements;
- do keep final YAPK generation gated when a Custom Code action step is planned but package storage shape is unresolved.

## Required Plugin Updates

The plugin must maintain:

- `docs/standards/custom-code-form-action-step-runtime-standard.md`
- `docs/custom-code-control-decision-guide.md`
- `docs/yeeflow-form-action-generation-rules.md`
- `skills/installed/yeeflow-custom-code-generator/SKILL.md`
- `skills/installed/yeeflow-custom-code-generator/references/yeeflow-custom-code-standard.md`

## Recommended Hard Gates

Focused gates should verify:

- docs and skill references mention both `control` and `form_action_step`;
- Custom Code control examples require `render(context, fieldsValues, readonly)`;
- Form Action Custom Code step examples require `execute(context, fieldsValues)`;
- `React 15.6`, `AntDesign 2.13`, `number`, `yeeSDKClient`, and `getYeeSDKAPIDetails` are preserved in the runtime standard;
- action-step package materialization remains marked as export-shape gated until proven.

## Regression Scenarios

1. A visible Custom Code control script with `render(...)` passes.
2. A visible Custom Code control script with only `execute(...)` fails.
3. A Form Action Custom Code step script with `execute(...)` passes.
4. A Form Action Custom Code step script with only `render(...)` fails.
5. A script with neither `render(...)` nor `execute(...)` fails.
6. A script that calls an unknown SDK mutation without SDK detail proof is blocked or flagged.

