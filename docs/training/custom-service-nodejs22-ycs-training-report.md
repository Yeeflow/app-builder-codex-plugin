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

## Proof Boundary

This training is:

- export-proven for `.ycs` file shape;
- product-spec-backed for runtime context and sandbox constraints;
- validator-backed after focused gates pass.

This training is not yet runtime-proven for:

- Form Action invocation;
- Workflow Action invocation;
- AI Agent invocation;
- Copilot invocation;
- external connection execution;
- generated app package materialization.

