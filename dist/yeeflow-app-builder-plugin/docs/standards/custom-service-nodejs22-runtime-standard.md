# Custom Service Node.js 22 Runtime Standard

## Scope

This standard covers Yeeflow **Custom Service** scripts exported as `.ycs`.

Custom Service is a backend service surface. It is different from both existing Yeeflow custom-code surfaces:

| Surface | Runtime host | Required entrypoint |
| --- | --- | --- |
| Custom Code control | Page/form control tree | `render(context, fieldsValues, readonly)` |
| Form Action Custom Code step | Form action step | `execute(context, fieldsValues)` |
| Custom Service | Backend service sandbox | `main({ connections, params, modules }: ServiceContext)` |

Do not apply Custom Code control `render(...)` rules or Form Action Custom Code step `execute(...)` rules to Custom Service scripts.

## Export Shape

The studied `.ycs` files use this top-level structure:

```json
{
  "Name": "Service name",
  "Description": "Service description",
  "ImplType": 0,
  "DraftCode": "export async function main(...) { ... }",
  "DraftConfig": "{\"params\":[],\"connections\":[],\"outputs\":[]}",
  "ExtData": null
}
```

Rules:

- `DraftCode` is a TypeScript/JavaScript string.
- `DraftCode` must export `async function main(...)` or a compatible `function main(...)`.
- `DraftConfig` is a JSON string, not an object, and contains `params`, `connections`, and `outputs`.
- `ExtData` may be `null`.
- Preserve large numeric IDs as strings when a service references Yeeflow resources.

## Runtime Contract

The product-team runtime specification identifies:

- Language/runtime: Node.js 22 LTS style syntax.
- Execution environment: isolated ClearScript V8 sandbox.
- Primary business logic entrypoint: `main`.
- Context argument shape: `{ connections, params, modules }`.

Preferred generated entrypoint:

```ts
export async function main({ connections, params, modules }: ServiceContext) {
  return {};
}
```

Rules:

- If current code is empty or `main` is missing, create `export async function main({ connections, params, modules }: ServiceContext) { return {}; }` first.
- Put the primary business flow directly in `main` or in helpers called by `main`.
- Return an object whose keys match configured output IDs.
- Validate `params` before use.
- Use optional chaining and safe defaults for nested values.
- Throw clear `Error` messages for blocking validation failures.

## Sandbox And Security Rules

Generated Custom Service code must not use Node.js built-ins or global Node-only objects:

- no `require(...)`
- no `import ...` for Node standard libraries such as `fs`, `path`, or `crypto`
- no `process`
- no `global`
- no `__dirname` or `__filename`
- no `setTimeout` or `setInterval` unless explicitly provided in `ServiceContext`

Credential and network rules:

- Never hardcode credentials, API keys, bearer tokens, passwords, or client secrets.
- If an external HTTP request requires authorization, use `connections[connectionId]` and pass it to `modules.fetch(..., { connection })`.
- Do not hardcode private/internal URLs or fallback addresses.
- Block internal network / SSRF hazards such as `localhost`, `127.0.0.1`, `::1`, `169.254.169.254`, RFC1918 private ranges, `.local`, and `.internal`.

## System Interaction Rules

All Yeeflow system interactions must go through `modules.yeeSDKClient`.

If SDK method names, parameter names, or response shapes are not fully proven, use `getYeeSDKAPIDetails` where the authoring environment exposes it, or mark the implementation as blocked. Do not guess mutation APIs.

Export-backed examples show:

- `modules.yeeSDKClient.files.getContent(fileId)` for reading file parameters.
- `modules.yeeSDKClient.files.upload({ fileName, file })` for generated file outputs.
- `modules.yeeSDKClient.lists.getFields(listId)` for list metadata.
- `modules.yeeSDKClient.lists.createItemsBatch({ listId, items })` for batch list creation.
- `modules.yeeSDKClient.lists.queryItems({ listId, fields, filters, sorts, pageIndex, pageSize })` for list queries.

## File Parameters

File input values use the standard file object shape:

```json
{
  "id": "file-id",
  "name": "file-name.pdf",
  "fileSize": 1024
}
```

Rules:

- A file parameter may be a single file object or an array of file objects.
- Read content with `modules.yeeSDKClient.files.getContent(fileValue.length ? fileValue[0].id : fileValue.id)`.
- The returned `response.data` is an `ArrayBuffer`.
- Generated file outputs should be uploaded with `modules.yeeSDKClient.files.upload({ fileName, file })`.

## DraftConfig Rules

Use `DraftConfig` to declare service IO.

Observed export-backed parameter and output types include:

- `text`
- `file`
- `number`

Product runtime input definitions may use `string`, `number`, and `variable` when authoring through code interfaces. For `.ycs` export generation, preserve the `.ycs` UI/export type names observed in `DraftConfig`.

Example:

```json
{
  "params": [
    { "id": "subListJson", "type": "text", "desc": "JSON array from a Sub List." }
  ],
  "connections": [],
  "outputs": [
    { "id": "htmlTable", "type": "text", "desc": "Generated HTML table." }
  ]
}
```

Rules:

- Every value returned by `main` should correspond to an output ID.
- Every required runtime input should be declared in `params`.
- Connections required for external calls should be declared in `connections` and read from `connections[connectionId]`.
- Do not treat output IDs as ordinary input values.

## Invocation Surface Rules

Custom Service can be invoked by Yeeflow actions. The exported examples prove these invocation shapes:

### Form Action Step

Approval submission forms and custom data list forms use a form action step:

```json
{
  "type": "invokeservice",
  "attrs": {
    "serviceId": "2072624440809492481",
    "params": [],
    "outputs": []
  }
}
```

Rules:

- `attrs.serviceId` is the Custom Service ID.
- `attrs.params[]` entries must use parameter IDs from the Custom Service `DraftConfig.params[]`.
- `attrs.outputs[]` entries must use output IDs from `DraftConfig.outputs[]`.
- Do not rename service params or outputs at invocation time.

Approval form variable input:

```json
{
  "value": {
    "value": { "prefix": "__variables_", "value": "Expense_Details" },
    "variable": null
  }
}
```

Approval form variable output:

```json
{ "prefix": "__variables_", "value": "field_SummaryInfo" }
```

Data list custom form field input:

```json
{
  "value": {
    "value": { "prefix": "__list_", "value": "Text1" },
    "variable": null
  }
}
```

Data list custom form temp-variable output:

```json
{ "prefix": "__temp_", "value": "var_HTMLTable" }
```

Dashboard form actions use the same `invokeservice` step shape, but Dashboard pages only have temp variables in the studied product guidance. Use `__temp_` bindings for Dashboard inputs and outputs unless a future export proves another binding surface.

### Workflow Action Node

Approval workflows use an Invoke custom service workflow node:

```json
{
  "stencil": { "id": "InvokeCode" },
  "properties": {
    "serviceId": "2072624440809492481",
    "params": [],
    "outputs": []
  }
}
```

Workflow variable input:

```json
{
  "type": 1,
  "value": {
    "exprType": "variable",
    "valueType": "list",
    "id": "Expense_Details",
    "type": "expr"
  }
}
```

Workflow variable output:

```json
{ "prefix": "__variables_", "value": "EmailHTMLItems" }
```

Data list workflows and Scheduled workflows use the same Invoke custom service workflow action shape by platform rule, but this study only had an Approval workflow export. Keep those surfaces product-rule-backed until a focused export or runtime test proves them.

## Execution Semantics

Custom Service is executed on the server side. Calling it from a form action or workflow action sends a request to the server and the service is processed through backend queue execution. If a page or form needs immediate client-side behavior, such as instant arithmetic, instant UI state changes, or low-latency validation, prefer:

- a Custom Code control; or
- a Form Action Execute custom code step.

Use Custom Service when server-side execution, Yeeflow SDK access, file processing, external connections, or reusable backend logic is the right model.

## Learned Examples

### Insert Excel Data to Data List

Export-backed capabilities:

- reads an uploaded Excel file parameter;
- loads SheetJS through `modules.loadScript(...)`;
- parses the first worksheet;
- normalizes a mapping JSON input;
- validates target fields through `lists.getFields(...)`;
- creates rows through `lists.createItemsBatch(...)`;
- returns `{ "Added Number": addedNumber }`.

Runtime-sensitive notes:

- External script loading must use an explicitly allowed public URL.
- Batch creation API shape is export-backed in the example but still should be treated cautiously for broad generation.

### Sub List to HTML Table

Export-backed capabilities:

- reads `subListJson` as either an array or a JSON string;
- detects business columns dynamically;
- escapes HTML;
- renders an email-compatible inline-style table;
- returns `{ htmlTable }`.

Runtime-sensitive notes:

- HTML generation must escape user-provided content.
- The service is display-transform only and does not mutate Yeeflow data.

## Planning Requirements

When a generated App Plan includes Custom Service, it must state:

- `Custom Service Surface: custom_service`
- service name and purpose
- caller candidates, such as form action, workflow action, AI Agent, or Copilot
- input parameters
- output parameters
- connection requirements
- Yeeflow SDK calls required
- native fallback considered
- security and data-scope notes
- proof boundary: export-proven, validator-backed, runtime-tested, or deferred

Current training scope proves the invocation schema for selected Form Action and Workflow Action surfaces, but does not prove backend queue latency, broad package materialization, AI Agent invocation, or Copilot invocation.
When App Plans include Custom Service invocation, also state:

- caller surface: Approval form action, Task form action, Data list custom form action, Dashboard form action, workflow action, AI Agent, or Copilot;
- binding source for each input: approval variable, workflow variable, data list field, or temp variable;
- binding target for each output;
- whether backend queue latency is acceptable or a client-side Custom Code surface is preferred.

## Validator Requirements

Generators and validators must enforce:

- `.ycs` top-level export fields exist.
- `DraftConfig` parses as JSON string and contains arrays for `params`, `connections`, and `outputs`.
- `DraftCode` includes `function main` or `async function main`.
- `main` returns an object or has an explicit object-return path.
- no `render(...)` or `execute(...)` entrypoint is required for Custom Service.
- no Node built-ins or forbidden globals are used.
- no hardcoded credentials or private/internal URL targets are present.
- file handling uses `modules.yeeSDKClient.files`.
- Yeeflow data interactions use `modules.yeeSDKClient`.
- form action Custom Service invocation uses `type = "invokeservice"` with `attrs.serviceId`, `attrs.params[]`, and `attrs.outputs[]`.
- workflow Custom Service invocation uses `stencil.id = "InvokeCode"` with `properties.serviceId`, `properties.params[]`, and `properties.outputs[]`.
- invocation parameter/output binding prefixes match the host surface: `__variables_`, `__list_`, or `__temp_`.

## Proof Boundary

This training is **export-proven** and **validator-backed** for `.ycs` structure and runtime script contract.

This training is **export-proven** for:

- invoking Custom Service from Approval Submission form Form Action;
- invoking Custom Service from Approval workflow action;
- invoking Custom Service from a custom data list form Form Action.

This training is **product-rule/user-guidance-backed** for:

- invoking Custom Service from Approval task forms;
- invoking Custom Service from Data list workflow actions;
- invoking Custom Service from Scheduled workflow actions;
- invoking Custom Service from Dashboard form actions with temp variables.

It is not yet runtime-proven for:

- backend queue timing or throughput under load;
- invoking Custom Service from AI Agent or Copilot;
- external connection execution;
- broad package materialization inside `.yapk` or `.yap` app generation.
