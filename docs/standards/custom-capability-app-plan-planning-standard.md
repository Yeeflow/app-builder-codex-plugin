# Custom Code and Custom Service App Plan Planning Standard

This standard defines when Yeeflow App Builder may include Custom Code or Custom Service in an application plan and generated package.

## Planning Requirement

Custom Code and Custom Service are advanced capabilities. They must be explicitly planned before generation.

The App Plan must include:

- a native-capability decision explaining why standard Yeeflow controls, expressions, form actions, workflow actions, Summary/Data Analytics, data-list operations, or CSS are enough or insufficient;
- the selected capability: none, Custom Code control, Form Action Custom Code step, or Custom Service;
- the host surface and exact business placement;
- input parameters, fields, variables, temp variables, connection variables, and output targets;
- security, privacy, tenant-specific configuration, and maintenance notes;
- runtime proof requirements.

Do not add Custom Code or Custom Service during materialization as an unplanned shortcut.

## When To Use Custom Code

Use a Custom Code control when the requirement needs client-side UI behavior or immediate client-side calculation that native Yeeflow controls and expressions cannot provide.

Use a Form Action Custom Code step when the requirement needs custom client-side action logic inside a form action and can be implemented with `execute(context, fieldsValues)`.

Do not use Custom Code for backend integrations, long-running server-side work, secret-bearing operations, or heavy file processing. Use Custom Service instead.

## When To Use Custom Service

Use Custom Service when the requirement needs backend execution, Node.js 22 logic, third-party integration through configured connection variables, server-side Yeeflow SDK operations, file processing, HTML generation, Excel parsing, or system-to-system synchronization.

Custom Service execution is server-side and queue-based. If the user needs immediate client-side response, the plan must either use Custom Code or include a waiting/progress/fallback UX.

## Surface Contracts

| Capability | Host | Required Entry Point / Shape |
| --- | --- | --- |
| Custom Code control | Page/form control tree | `render(context, fieldsValues, readonly)` |
| Form Action Custom Code step | `formdef.actions[].steps[]` | `execute(context, fieldsValues)` |
| Custom Service | `.ycs` backend service | `main({ connections, params, modules })` |
| Custom Service form action invocation | Approval form, data list custom form, dashboard form action | `type: "invokeservice"` |
| Custom Service workflow invocation | Approval/Data list/Scheduled workflow | `stencil.id = "InvokeCode"` |

## Binding Rules

- Approval form action Custom Service bindings use `__variables_`.
- Data list custom form action Custom Service inputs may use `__list_` or `__temp_`; outputs use `__temp_` unless a focused export proves another target.
- Dashboard form action Custom Service bindings use `__temp_`.
- Data list workflow Custom Service invocation may use `exprType: "list_field"` for current item fields and workflow variables for outputs.
- External integration Custom Service must use connection variables. Do not hardcode credentials, bearer tokens, client secrets, tenant-specific URLs, or private/internal URLs.
- Preserve Yeeflow 19-digit IDs as strings.

## Placeholder Rule

Rows marked `Not planned`, `N/A`, `None`, or `Not applicable` are planning placeholders only. They must not materialize into resources, action steps, workflow nodes, navigation items, variables, or package artifacts.

## Proof Boundary

Local package validation, signing, install/import/upgrade acceptance, and browser render proof do not prove Custom Code or Custom Service execution.

Runtime proof must demonstrate:

- parameter binding works;
- the code/service executes;
- outputs are written to the planned target;
- downstream refresh/update behavior works;
- failures produce clear errors or configured fallback behavior.
