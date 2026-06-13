# Yeeflow REST API Capability Map

## Purpose

The Yeeflow REST API capability map gives Codex a documented routing table for live API work. It answers:

- when a Yeeflow REST API can be used
- which documented endpoint or helper maps to the task
- whether the operation is read-only or mutating
- which parameters must be known before a call
- whether explicit user confirmation is required

The map lives in `scripts/lib/yeeflow-api-capabilities.mjs`. It is dependency-free and uses the public Yeeflow OpenAPI document as the source of truth for normal REST endpoints. Package automation capabilities are included only where the repository already documents guarded package upload/import/install/upgrade helpers.

## Source Of Truth

Use documented endpoints only:

- Yeeflow API docs: `https://developer.yeeflow.com/api/`
- OpenAPI YAML: `https://cdn.yungalaxy.com/yeeflow/developer/v1/yeeflow_en.yaml`
- Package automation docs in this repository for the package upload/import/install/upgrade helper endpoints
- Product-team Apifox/OpenAPI workspace docs for `GET /workspaces/{category}` and related workspace metadata endpoints

If an endpoint is not documented in one of those sources, do not add it as an implemented capability and do not guess the path.

## Capability Shape

Each capability includes:

```js
{
  name: "locations.list",
  method: "GET",
  path: "/locations",
  summary: "Get all locations",
  readOnly: true,
  requiresConfirmation: false,
  auth: "oauth-or-api-key",
  requiredParams: [],
  optionalParams: [],
  source: "OpenAPI",
  notes: "Safe read-only OAuth smoke endpoint."
}
```

Capability names are stable dotted identifiers such as `locations.list`, `items.query`, `users.search`, `workflows.start`, `workspaces.listByCategory`, and `packages.installYapk`.

## Safety Classification

Default rules:

- `GET` capabilities are read-only unless the documentation clearly says otherwise.
- `POST`, `PUT`, `PATCH`, and `DELETE` capabilities are mutating by default.
- Mutating capabilities set `readOnly: false` and `requiresConfirmation: true`.
- Documented search/query operations that use `POST`, such as `items.query` and `users.search`, are marked read-only with notes explaining the exception.
- Package upload/import/install/upgrade capabilities are high-risk write capabilities and require explicit user confirmation plus active workspace confirmation.
- Workspace discovery uses OAuth read-only `GET /workspaces/{category}` and must print only safe summaries with redacted workspace ID previews.
- Workspace add/edit/delete/sort capabilities are mutating and must remain blocked by generic read-only helpers. The mapped Apifox paths are `POST /workspaces/{category}`, `PUT /workspaces/{category}/{id}`, `DELETE /workspaces/{category}/{id}`, and `POST /workspaces/{category}/sort`; delete is destructive and requires strong confirmation.

Codex should prefer read-only capabilities for inspection and verification. Writes require an explicit user request and confirmation of the target resource, workspace, and intended effect.

## Commands

List all mapped capabilities:

```bash
node scripts/yeeflow-api-list-capabilities.mjs
```

List only read-only capabilities:

```bash
node scripts/yeeflow-api-list-capabilities.mjs --read-only
```

List write capabilities:

```bash
node scripts/yeeflow-api-list-capabilities.mjs --write
```

Filter by category, name, method, path, or summary:

```bash
node scripts/yeeflow-api-list-capabilities.mjs --filter locations
```

The list command performs no live API calls and prints only safe capability metadata.

## Optional Read-Only Call Helper

`scripts/yeeflow-api-call-capability.mjs` can execute only mapped read-only `GET` capabilities by name:

```bash
node scripts/yeeflow-api-call-capability.mjs --name locations.list
node scripts/yeeflow-api-call-capability.mjs --name locations.get --param id=<location-id>
node scripts/yeeflow-workspace-list.mjs --all
node scripts/yeeflow-workspace-list.mjs --category flowcraft
```

The helper:

- requires OAuth for normal workspace discovery
- blocks all write capabilities
- blocks non-GET read-only capabilities until a request-body contract is implemented
- does not accept arbitrary raw paths
- does not save raw API response files
- prints status, response shape, and safe keys only

Use specialized guarded helpers for package automation instead of trying to call package capabilities through the generic helper.

Use `scripts/yeeflow-workspace-list.mjs` for workspace discovery. It calls only documented OAuth read-only `GET /workspaces/settings` and `GET /workspaces/flowcraft`, and reports count, title or user-facing fallback name, category, status, status provenance, and redacted ID previews without saving raw responses. When a user asks for all current workspaces, use `--all` to check both categories. For current app/package workflows, `flowcraft` is the relevant workspace category unless product/API docs change. `workspaces.get` is mapped as `GET /workspaces/{category}/{id}` and must also avoid raw workspace records or full IDs.

## Authentication

Live capability calls use `scripts/lib/yeeflow-api-auth.mjs`.

Normal authentication order:

1. Require a valid Browser OAuth access token for user-facing API access.
2. Refresh an expired OAuth token when a refresh token is available.
3. If OAuth is unavailable, request the Yeeflow plugin login flow and preserve the original operation. If the plugin login action is unavailable in this runtime, say: `I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.`

Legacy `YEEFLOW_API_KEY` mode may remain supported by older internal helpers, but it is not part of normal plugin/API operation.

Do not print OAuth tokens, authorization codes, cookies, client secrets, API keys, Authorization headers, private tenant URLs, or raw responses.

## Adding Capabilities

Before adding a capability:

1. Confirm the endpoint exists in the OpenAPI YAML or in reviewed repository package automation docs.
2. Copy the documented method and path exactly.
3. Use stable dotted names.
4. Add all required path, query, and body parameters to `requiredParams`.
5. Add documented optional parameters to `optionalParams`.
6. Mark `GET` as read-only unless documented otherwise.
7. Mark write methods as requiring confirmation.
8. Add a note for destructive, package, password, webhook, workflow, or agent-run operations.
9. Add or update tests in `scripts/test-yeeflow-api-capabilities.mjs`.

If the endpoint is missing from docs, report missing API coverage and use a browser/manual workflow only when the user allows it.

## Proof Boundaries

The capability map is routing and safety metadata. It is not proof that a generated package imports or runs.

- Local validation is not import proof.
- API acceptance is not runtime proof.
- Runtime proof applies only to the tested scope.

Browser OAuth login enables safer local authentication, but it does not relax endpoint documentation, confirmation, redaction, or proof-boundary requirements.
