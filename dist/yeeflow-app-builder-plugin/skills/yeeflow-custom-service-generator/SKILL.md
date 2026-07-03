---
name: yeeflow-custom-service-generator
description: generate, inspect, validate, document, and debug Yeeflow Custom Service scripts exported as .ycs. Use when the user asks for backend Custom Service code, Node.js 22 service logic, .ycs analysis, service parameter/output configuration, or Custom Service skill/training.
---

# Yeeflow Custom Service Generator

## Overview

Yeeflow Custom Service is a backend code surface that runs in a sandboxed Node.js 22 style environment.

It is distinct from existing custom-code surfaces:

| Surface | Host | Required entrypoint |
| --- | --- | --- |
| Custom Code control | Page/form control tree | `render(context, fieldsValues, readonly)` |
| Form Action Custom Code step | Form action step | `execute(context, fieldsValues)` |
| Custom Service | Backend service sandbox / `.ycs` export | `main({ connections, params, modules })` |

Use this skill for Custom Service generation and `.ycs` study. Use `yeeflow-custom-code-generator` for Custom Code controls and Form Action Custom Code steps.

## Required References

Before generating or validating Custom Service code, read:

- `../../../docs/standards/custom-service-nodejs22-runtime-standard.md`
- `../../../docs/reference/custom-service-ycs-examples.normalized.json`
- `../../../docs/reference/custom-service-invocation-examples.normalized.json`

For feature-learning or plugin-training work, also read:

- `../../../docs/training/custom-service-nodejs22-ycs-training-report.md`

## Supported Modes

### A. Generate Custom Service Code

Given a backend service requirement:

- generate a complete Custom Service script using `export async function main({ connections, params, modules }: ServiceContext)`;
- define the intended `DraftConfig` with `params`, `connections`, and `outputs`;
- add connection variables in `DraftConfig.connections[]` when the service integrates with a third-party system;
- validate inputs before use;
- validate required connections before use;
- return output keys matching the configured outputs;
- use `modules.yeeSDKClient` for Yeeflow data/file operations;
- use `connections[connectionId]` for authorized external calls;
- state proof boundaries when invocation or SDK behavior is not proven.

### B. Inspect Existing `.ycs`

Given an exported `.ycs`:

- parse top-level `Name`, `Description`, `ImplType`, `DraftCode`, `DraftConfig`, and `ExtData`;
- parse `DraftConfig` as a JSON string;
- list params, connections, outputs, SDK calls, file handling, external calls, and return keys;
- identify connection variable IDs, connection types, and where `connections?.<id>` is consumed in code;
- identify security hazards and unproven SDK shapes;
- produce a practical user guide or training summary.

### C. Debug Custom Service Code

When a service fails:

- check first for missing `main`;
- check malformed `DraftConfig`;
- check output keys not matching configured outputs;
- check unsafe direct access to `params`;
- check forbidden Node built-ins or globals;
- check hardcoded credentials or private/internal URLs;
- check guessed SDK calls or unhandled response shapes;
- return corrected service code quickly.

### D. Plan Or Generate Custom Service Invocation

When asked to configure a form action or workflow action that invokes Custom Service:

- use `type: "invokeservice"` for form action steps on approval forms, data list custom forms, and dashboard pages;
- use workflow node `stencil.id: "InvokeCode"` for workflow actions;
- set `serviceId` from the selected Custom Service resource;
- map required service connection variables through `properties.connections[]` on workflow nodes when invoking from workflow actions;
- copy the Custom Service parameter IDs and output IDs exactly from its `DraftConfig`;
- bind values according to the host surface, not by parameter name alone;
- avoid generating invocation bindings for a host surface that lacks the target variable or field.

Host binding rules:

| Host | Input binding | Output binding |
| --- | --- | --- |
| Approval submission/task form action | `value.value.prefix = "__variables_"` | `prefix = "__variables_"` |
| Approval/Data list/Scheduled workflow action | `properties.params[].value = { type: 1, value: { exprType: "variable", ... } }` | `prefix = "__variables_"` |
| Custom data list form action | `value.value.prefix = "__list_"` for data-list fields, or `__temp_` for temp variables | `prefix = "__temp_"` for temp variables |
| Dashboard form action | `value.value.prefix = "__temp_"` | `prefix = "__temp_"` |

Dashboard pages do not have data-list field variables; use temp variables for Dashboard Custom Service invocation unless a future export proves another surface.

Data list workflow invocation can also bind current item fields with `exprType: "list_field"` and static string values with `type: 2` token arrays. If the Custom Service returns an external-system ID, write it to a workflow variable first and then use a downstream Set Data List / `ContentList` workflow action to update the current item field.

## Core Rules

- The primary entrypoint is `main`.
- If code is empty or missing `main`, initialize:

```ts
export async function main({ connections, params, modules }: ServiceContext) {
  return {};
}
```

- Put primary business logic in `main` or helpers called by `main`.
- Do not generate `render(...)` for Custom Service.
- Do not generate `execute(...)` for Custom Service.
- Return an object whose keys match `DraftConfig.outputs[].id`.
- Validate every required `params` value before using it.
- Validate every required `connections` value before using it.
- Use optional chaining for nested values.
- Throw clear `Error` messages when blocked.
- Preserve 19-digit Yeeflow IDs as strings.
- Treat Custom Service invocation as a server-side queued call. If the user needs immediate client-side calculation or UI reaction, recommend a Custom Code control or a Form Action Execute custom code step instead.

## DraftConfig Rules

The `.ycs` export stores `DraftConfig` as a JSON string:

```json
{
  "params": [],
  "connections": [],
  "outputs": []
}
```

Observed `.ycs` parameter/output types include:

- `text`
- `file`
- `number`

Product-supported input/output variable categories include Text, Number, Boolean, Date/Time, File, Image, and Rich text. Preserve the export/UI type name used by the Custom Service configuration.

Connection variables are not ordinary params or outputs. Declare them in `connections`:

```json
{
  "id": "sharePointConnection",
  "type": "http",
  "desc": "SharePoint OAuth connection used to authenticate and access the specified SharePoint site and list."
}
```

Product runtime type definitions may mention `string`, `number`, and `variable`. For `.ycs` export/config generation, prefer the export/UI type names that match the service configuration being produced.

## Security Rules

Never generate:

- hardcoded credentials, API keys, bearer tokens, passwords, or client secrets;
- `require(...)`;
- Node standard-library imports such as `fs`, `path`, or `crypto`;
- `process`, `global`, `__dirname`, or `__filename`;
- `setTimeout` or `setInterval` unless explicitly provided by `ServiceContext`;
- hardcoded private/internal network targets such as `localhost`, `127.0.0.1`, `::1`, `169.254.169.254`, RFC1918 private ranges, `.local`, or `.internal`.

For authorized HTTP calls:

```ts
const conn = connections?.["CONNECTION_ID_FROM_PLAN"];
if (!conn) throw new Error("Required connection missing.");
const response = await modules.fetch(url, { method: "GET", connection: conn });
```

## Yeeflow SDK Rules

Use `modules.yeeSDKClient` for system interactions. Do not guess SDK mutation methods.

Export-backed examples include:

- `modules.yeeSDKClient.files.getContent(fileId)`
- `modules.yeeSDKClient.files.upload({ fileName, file })`
- `modules.yeeSDKClient.lists.getFields(listId)`
- `modules.yeeSDKClient.lists.createItemsBatch({ listId, items })`
- `modules.yeeSDKClient.lists.queryItems({ listId, fields, filters, sorts, pageIndex, pageSize })`
- `modules.fetch(url, { method, headers, body, connection })` for third-party OAuth/HTTP integration through a configured connection.

If a required SDK call is not proven, use `getYeeSDKAPIDetails` when available or mark the implementation as requiring SDK confirmation.

## File Handling Rules

File parameters may be a single object or an array. Standard file object shape:

```json
{ "id": "file-id", "name": "file-name.pdf", "fileSize": 1024 }
```

Read file content:

```ts
const fileValue = params?.myFile;
const fileId = Array.isArray(fileValue) ? fileValue[0]?.id : fileValue?.id;
if (!fileId) throw new Error("File parameter is missing.");
const fileResp = await modules.yeeSDKClient.files.getContent(fileId);
const fileBuffer = fileResp?.data;
```

Create a file output:

```ts
const uploadResp = await modules.yeeSDKClient.files.upload({ fileName, file });
return { generatedFile: uploadResp?.data };
```

## Output Modes

### Code-only

Use when the user asks for a script to paste/test. Return:

1. short assumptions if needed;
2. one complete Custom Service code block;
3. optional DraftConfig JSON when useful.

### Code + `.ycs` config

Use when the user asks for a complete service definition. Return:

- service name;
- description;
- DraftConfig JSON;
- full DraftCode.

### Guide-only

Use when documenting an existing `.ycs`. Describe observed behavior, configuration, parameters, outputs, SDK calls, and proof boundaries.

## Proof Boundary

Current Custom Service knowledge is:

- product-spec-backed for runtime context and sandbox rules;
- export-proven for `.ycs` top-level shape and DraftConfig layout;
- export-proven for Submission form Form Action `invokeservice`, Approval workflow `InvokeCode`, and custom data list form Form Action `invokeservice` invocation shapes;
- export-proven for Data list workflow `InvokeCode` invocation with `properties.connections[]`, list-field/static params, workflow-variable output, and downstream Set Data List update;
- product/user-understanding-backed for Task form, Scheduled workflow, and Dashboard invocation surfaces that share the same known form-action/workflow-action shapes;
- validator-backed when focused gates pass.

AI Agent or Copilot invocation is future work and must not be claimed as runtime-proven yet.
