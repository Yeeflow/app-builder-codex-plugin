# Workspace Discovery And Selection

Yeeflow workspace targeting is optional for normal OAuth and read-only API use. A local `.env.local` may be absent or empty for normal OAuth plus workspace discovery. OAuth login is required before API access; do not use API keys for normal workspace discovery.

## Read-Only Discovery

Use the documented workspace API:

```text
GET /workspaces/settings
GET /workspaces/flowcraft
```

The helper:

```bash
node scripts/yeeflow-workspace-list.mjs --all
node scripts/yeeflow-workspace-list.mjs --category settings
node scripts/yeeflow-workspace-list.mjs --category flowcraft
```

prints only a safe summary: workspace count, title or user-facing fallback name, category, status, status provenance, and a redacted ID preview. It must not print tenant URLs, tenant IDs, full workspace IDs, tokens, raw workspace objects, Authorization headers, raw API responses, or private values.

Documented categories are `settings` and `flowcraft`. When a user asks for all current workspaces, check both categories with `--all` and return a combined redacted summary. For current Yeeflow app install/import/package workflows, `flowcraft` is the relevant workspace category unless product/API docs later say otherwise.

Workspace status summary:

| Status | Meaning | Provenance |
| --- | --- | --- |
| `0` | normal user-created/editable workspace | product knowledge |
| `1` | tenant default/shared workspace, editable but not deletable | product knowledge |

If the API title is blank and `Status: 1`, display the user-facing fallback name `Shared Workspace`.

## Capability Map

The Apifox workspace capability set is mapped as:

| Capability | Method and path | Classification |
| --- | --- | --- |
| `workspaces.listByCategory` | `GET /workspaces/{category}` | read-only |
| `workspaces.get` | `GET /workspaces/{category}/{id}` | read-only |
| `workspaces.add` | `POST /workspaces/{category}` | write, confirmation required |
| `workspaces.edit` | `PUT /workspaces/{category}/{id}` | write, confirmation required |
| `workspaces.delete` | `DELETE /workspaces/{category}/{id}` | destructive write, strong confirmation required |
| `workspaces.sort` | `POST /workspaces/{category}/sort` | write, confirmation required |

Only the read-only `GET` capabilities are eligible for the generic read-only helper. Workspace add, edit, delete, and sort are mapped so Codex knows they exist and can block them by default; they are not automatic package workflow steps.

## Package Target Resolution

Package install/import/upgrade remains a write path. The helper must resolve a target workspace from OAuth workspace discovery before request shaping and must still require explicit execution confirmation before any API write. Local `YEEFLOW_WORKSPACE_ID` and profile workspace variables are ignored for package write target selection.

Resolution order:

1. discover app/package workspaces with `node scripts/yeeflow-workspace-list.mjs --category flowcraft`
2. explicit user-selected workspace from the redacted `flowcraft` workspace discovery result
3. pass that selected target with `--selected-workspace-id <id>` or documented user-selected `--workspace-id <id>`
4. stop with `workspace_selection_required` before request shaping if no workspace is selected

For non-interactive package install/import/upgrade, do not guess and do not use local environment workspace IDs. If multiple `flowcraft` workspaces are available, ask the user to choose. If exactly one `flowcraft` workspace is available, it may be suggested with a redacted ID preview, but the target workspace must still be confirmed before live package operations.

## Workspace Mutation Boundary

Workspace add, edit, delete, and sort APIs are mutation APIs. They are not used automatically by the plugin, are blocked by generic read-only helpers, and require explicit admin confirmation if ever implemented in a dedicated guarded workflow. Delete is destructive and requires strong destructive-action confirmation.
