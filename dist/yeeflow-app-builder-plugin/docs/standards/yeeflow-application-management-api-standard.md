# Yeeflow Application Management API Standard

## Scope

This standard covers two product APIs:

- List applications under one workspace.
- Delete one application by ID.

They belong beside workspace discovery and package install/import/upgrade APIs in the Yeeflow API operator capability map, but they have different safety classes.

## API Contracts

### Workspace application list

```text
GET /workspaces/{category}/{id}/applications?appID={30|41}
```

- `category`: documented workspace category, normally `flowcraft` for app/package work.
- `id`: selected workspace ID.
- `appID`: only `30` or `41`; default `41`.
- Classification: read-only.
- Authentication: OAuth in normal plugin operation.

### Delete application

```text
DELETE /applications/{id}?appID={30|41}
```

- `id`: exact application ID.
- `appID`: only `30` or `41`; default `41`.
- Classification: destructive write.
- Confirmation level: strong.

## Read Contract

Workspace application listing must:

1. Use `workspaces.applications.list` from the capability map.
2. Use the shared OAuth resolver and refresh an expired access token when a refresh token is available.
3. Reject undocumented `appID` values before authentication or request shaping.
4. Return application count and safe summaries only.
5. Redact full workspace and application IDs.
6. Never print or save the raw API response.

## Delete Contract

Application deletion must not be available through the generic read-only capability caller. A dedicated helper must be used and must default to dry run.

Before a live DELETE request, all gates are mandatory:

1. `--execute` is present.
2. Workspace ID, application ID, and exact expected title are present.
3. The strong confirmation exactly equals `DELETE APPLICATION: <Exact Application Title>`.
4. A live workspace-scoped application list query succeeds.
5. Exactly one returned application has the requested ID.
6. That record's title exactly matches the expected title.
7. OAuth authentication is active.

The helper must stop before authentication if required scope or strong confirmation is missing.

## Proof Boundary

- Dry run proves request gating only.
- Read-only live smoke proves endpoint/auth/response compatibility only.
- DELETE HTTP/API success proves API acceptance only.
- Final deletion proof requires a subsequent read-only workspace application list showing the application is absent.

No real application may be deleted merely to test this capability.

## Commands

```bash
node scripts/yeeflow-workspace-applications.mjs --workspace-id <workspace-id> --category flowcraft --app-id 41
node scripts/yeeflow-application-delete.mjs --expected-title "Exact Application Title"
node scripts/test-yeeflow-application-management.mjs
node scripts/test-yeeflow-api-capabilities.mjs
```
