# Custom Capability App Plan Planning Training Report

## Scope

This focused training covers when Yeeflow App Builder should plan and generate:

- Custom Code controls;
- Form Action Custom Code steps;
- Custom Services;
- Custom Service invocation from form actions and workflow actions.

It does not change the runtime code standards for each surface. Those remain governed by:

- `docs/standards/custom-code-form-action-step-runtime-standard.md`;
- `docs/standards/custom-service-nodejs22-runtime-standard.md`.

## Training Outcome

Custom Code and Custom Service are now treated as planned advanced capabilities, not generation-time shortcuts.

The canonical App Plan template now includes `Custom Code and Custom Service Planning` under Plugin Capability and Standards Compliance. The section requires:

- a native capability decision matrix;
- a Custom Code plan;
- a Custom Service plan;
- a Custom Service invocation plan;
- runtime proof planning.

## Planning Rules

Use native Yeeflow capabilities first when they satisfy the business requirement.

Use Custom Code when the requirement needs immediate client-side behavior or a client-side calculation that cannot be safely expressed with native controls, expressions, or form actions.

Use Custom Service when the requirement needs backend execution, third-party integration through connection variables, server-side Yeeflow SDK operations, file processing, Excel processing, HTML generation, or system-to-system synchronization.

Custom Service is server-side and queue-based. If immediate feedback is required, the plan must select Custom Code or include an explicit waiting/progress/fallback UX.

## Non-Materialization Rule

Rows marked `Not planned`, `N/A`, `None`, or `Not applicable` are planning placeholders only. They must not materialize into:

- Custom Code controls;
- form action custom-code steps;
- Custom Service resources;
- `invokeservice` action steps;
- `InvokeCode` workflow nodes;
- variables or temp variables;
- navigation items;
- package artifacts.

## Surface Rules

| Capability | Host | Required Runtime Shape |
| --- | --- | --- |
| Custom Code control | Page/form control tree | `render(context, fieldsValues, readonly)` |
| Form Action Custom Code step | Form action step | `execute(context, fieldsValues)` |
| Custom Service | Backend `.ycs` service | `main({ connections, params, modules })` |
| Custom Service form action invocation | Approval/data-list/dashboard form action | `type: "invokeservice"` |
| Custom Service workflow invocation | Approval/data-list/scheduled workflow | `stencil.id = "InvokeCode"` |

## Binding Rules

- Approval form action invocation uses `__variables_`.
- Custom data list form action invocation may use `__list_` or `__temp_` inputs and `__temp_` outputs.
- Dashboard form action invocation uses `__temp_`.
- Data list workflow invocation may use `exprType: "list_field"` and should write service outputs to workflow variables before downstream `ContentList` updates.
- Connection variables must be used for HTTP API/OAuth 2.0 integrations. Credentials and private endpoint literals are forbidden.

## Hard Gate Added

`scripts/test-custom-capability-app-plan-gates.mjs` verifies:

- the canonical App Plan template contains the Custom Code and Custom Service planning section;
- the planning standard describes Custom Code, Custom Service, invocation shapes, bindings, queued execution, and placeholder non-materialization;
- Custom Code, Custom Service, and Feature Learning skills point to the planning standard;
- source and dist cache artifacts include the gate and standard through `test-yapk-hard-gate-cache-artifacts.mjs`.

## Proof Boundary

Package validation, signing, install/import/upgrade acceptance, and browser page render do not prove Custom Code or Custom Service execution.

Runtime proof must show:

- input binding works;
- the code or service executes;
- outputs are written to planned targets;
- downstream refresh/update behavior works;
- failure handling or fallback behavior is visible.
