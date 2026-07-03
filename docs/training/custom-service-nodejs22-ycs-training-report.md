# Custom Service Node.js 22 `.ycs` Training Report

## Training Scope

This training introduces Yeeflow **Custom Service** as a distinct backend code surface.

Custom Service is not the same as:

- Custom Code control, which uses `render(...)`;
- Form Action Custom Code step, which uses `execute(...)`.

Custom Service uses a backend service entrypoint:

```ts
export async function main({ connections, params, modules }: ServiceContext) {
  return {};
}
```

## Inputs Studied

Product-team Custom Service specification:

- Node.js 22 LTS language target.
- Isolated ClearScript V8 sandbox.
- Primary business logic entrypoint is `main`.
- Context contains `connections`, `params`, and `modules`.
- Yeeflow system interactions go through `modules.yeeSDKClient`.
- External authorized HTTP calls go through `modules.fetch(..., { connection })`.
- No Node built-ins, no credentials, and no private/internal network targets.

Exported `.ycs` examples:

1. `Insert Excel Data to Data List.ycs`
2. `Sub List to HTML Table.ycs`

## Export Shape Learned

Both `.ycs` files use the same top-level shape:

```json
{
  "Name": "...",
  "Description": "...",
  "ImplType": 0,
  "DraftCode": "...",
  "DraftConfig": "{\"params\":[],\"connections\":[],\"outputs\":[]}",
  "ExtData": null
}
```

Important detail: `DraftConfig` is a JSON string, not a nested JSON object.

## Example Patterns

### Insert Excel Data to Data List

This export proves a backend service can:

- read a file input from `params`;
- fetch file bytes through `modules.yeeSDKClient.files.getContent(fileId)`;
- load an external script through `modules.loadScript(...)`;
- inspect target list fields through `modules.yeeSDKClient.lists.getFields(listId)`;
- create records through `modules.yeeSDKClient.lists.createItemsBatch({ listId, items })`;
- return a numeric output key matching `DraftConfig.outputs[]`.

### Sub List to HTML Table

This export proves a backend service can:

- read JSON text or array input from `params`;
- safely parse and normalize rows;
- escape HTML;
- return a text output key matching `DraftConfig.outputs[]`.

## Generator Rules

The plugin must generate Custom Service scripts with these rules:

- Generate `main(...)`; do not generate `render(...)` or `execute(...)` for this surface.
- If current code is empty or lacks `main`, initialize `export async function main({ connections, params, modules }: ServiceContext) { return {}; }`.
- Put primary business flow in `main`.
- Validate `params` before use.
- Return an object whose keys exactly match configured outputs.
- Use `modules.yeeSDKClient` for Yeeflow data/file/list/workflow interactions.
- Use `connections[connectionId]` for authorized external requests.
- Never hardcode credentials.
- Never use Node built-ins or Node-only globals.
- Block private/internal URL targets.

## Validator Rules

New hard gates should check:

- `.ycs` has `Name`, `Description`, `ImplType`, `DraftCode`, `DraftConfig`, and `ExtData`.
- `DraftConfig` parses as JSON and has array `params`, `connections`, and `outputs`.
- `DraftCode` includes `main`.
- `DraftCode` does not require `render` or `execute`.
- Returned output keys can be matched to `DraftConfig.outputs[]` where statically visible.
- No `require`, Node standard imports, `process`, `global`, `__dirname`, `__filename`, `setTimeout`, or `setInterval`.
- No hardcoded credentials or private/internal URL targets.

## Skill Update

Create a new `yeeflow-custom-service-generator` skill with:

- Custom Service generation rules.
- `.ycs` documentation-from-export mode.
- security and sandbox rules.
- DraftConfig authoring guidance.
- invocation proof boundaries for Form Action, Workflow Action, AI Agent, and Copilot.

## Invocation Training Addendum

Follow-up exports added focused evidence for invoking Custom Service from Yeeflow actions.

Studied exports:

- an Approval form `.ywf` containing a Submission form Form Action `Invoke custom service` step and an Approval workflow `Invoke custom service` action node;
- a Data list `.ydl` containing a custom data list form Form Action `Invoke custom service` step.

### Form Action Invocation

Form action invocation uses:

```json
{
  "type": "invokeservice",
  "attrs": {
    "serviceId": "<custom service id>",
    "params": [],
    "outputs": []
  }
}
```

Approval form variable bindings use the `__variables_` prefix for both input and output bindings.

Custom data list form input bindings can point at data list fields with `__list_`, while outputs can write to temp variables with `__temp_`.

Dashboard form actions use the same `invokeservice` step shape, but Dashboard pages only have temp variables in the current product guidance. Use `__temp_` for Dashboard Custom Service inputs and outputs until a Dashboard export proves another binding surface.

### Workflow Invocation

Workflow invocation uses an action node with:

```json
{
  "stencil": { "id": "InvokeCode" },
  "properties": {
    "serviceId": "<custom service id>",
    "params": [],
    "outputs": []
  }
}
```

Workflow variable inputs use expression-wrapper values such as:

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

Workflow variable outputs use the `__variables_` prefix.

Data list workflow and Scheduled workflow invocation should use the same `InvokeCode` node shape by platform rule, but this training only had an Approval workflow export.

### Runtime Placement Guidance

Custom Service runs on the server side. The caller sends a request to the server, and execution is handled by a backend queue. When an action must provide immediate client-side feedback or simple low-latency calculation, the plugin should prefer a Custom Code control or a Form Action Execute custom code step instead of Custom Service.

## Connection Variable And Data List Workflow Addendum

A SharePoint integration export added evidence for Custom Service connection variables and Data list workflow invocation.

Studied exports:

- `Add SharePoint Supplier List Item.ycs`
- `Supplier List.ydl`

### Connection Variables

Custom Service connection variables are declared separately from params and outputs:

```json
{
  "id": "sharePointConnection",
  "type": "http",
  "desc": "SharePoint OAuth connection used to authenticate and access the specified SharePoint site and list."
}
```

The service code reads the runtime connection by ID:

```ts
const sharePointConnection = connections?.sharePointConnection;
if (!sharePointConnection) {
  throw new Error("Required connection missing: sharePointConnection");
}
```

Third-party calls then pass the connection object to `modules.fetch`:

```ts
await modules.fetch(graphEndpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
  connection: sharePointConnection
});
```

The SharePoint sample proves this pattern for Microsoft Graph site resolution and item creation. The generator must not hardcode OAuth tokens or credentials.

### Data List Workflow Invocation

The `Supplier List.ydl` export proves a Data list workflow stored in `Data.Forms[]` with `WorkflowType = 1` and linked through `FlowMappings[]`.

The workflow is triggered for new items:

```json
{
  "Setting": "{\"NewTrigger\":true}",
  "Title": "Save new supplier to SharePoint",
  "DefKey": "SSTSP",
  "FieldName": "Text24"
}
```

The workflow `InvokeCode` node includes `properties.connections[]`:

```json
{
  "id": "sharePointConnection",
  "type": "http",
  "value": {
    "connectionid": "2056384963824988160",
    "userconnectionid": "0"
  }
}
```

It also proves three parameter-binding shapes:

- static string parameter: `{ "type": 2, "value": [{ "type": "str", "value": "..." }] }`
- current item field parameter: `{ "type": 1, "value": { "exprType": "list_field", "prop": "Title", "id": "Title", "type": "expr" } }`
- optional unbound parameter: `value: null`

The service output `itemId` is saved to a workflow variable:

```json
{ "prefix": "__variables_", "value": "Supplier_ID" }
```

Then a downstream Set Data List / `ContentList` workflow action writes a SharePoint display link into the current list item by concatenating a static URL prefix with the returned workflow variable.

### Variable Types

Custom Service supports zero to many variables in each category:

- connection variables for configured HTTP API / OAuth 2.0 connections;
- input variables with Text, Number, Boolean, Date/Time, File, Image, and Rich text value types;
- output variables with Text, Number, Boolean, Date/Time, File, Image, and Rich text value types.

## Proof Boundary

This training is:

- export-proven for `.ycs` file shape;
- product-spec-backed for runtime context and sandbox constraints;
- export-proven for selected Form Action and Workflow Action invocation schemas;
- export-proven for Custom Service connection variables and Data list workflow invocation with `properties.connections[]`;
- validator-backed after focused gates pass.

This training is not yet runtime-proven for:

- backend queue timing or throughput;
- AI Agent invocation;
- Copilot invocation;
- external connection execution;
- generated app package materialization.
