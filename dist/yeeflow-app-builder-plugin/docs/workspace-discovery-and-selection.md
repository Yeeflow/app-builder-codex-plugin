# Workspace Discovery And Selection

Yeeflow workspace targeting is optional for normal OAuth and read-only API use. A local `.env.local` may be empty for the normal OAuth plus workspace discovery path.

Optional default:

```env
YEEFLOW_WORKSPACE_ID=<optional default workspace id>
```

## Read-Only Discovery

Use the documented workspace API:

```text
GET /workspaces/{category}
```

The helper:

```bash
node scripts/yeeflow-workspace-list.mjs --category <category>
```

prints only a safe summary: workspace count, title, category, status, and a redacted ID preview. It must not print tenant URLs, tenant IDs, full workspace IDs, tokens, raw workspace objects, Authorization headers, raw API responses, or private values.

No universal safe category default is documented, so the helper requires `--category` or a positional category.

## Package Target Resolution

Package install/import/upgrade remains a write path. The helper must resolve a target workspace before request shaping and must still require explicit execution confirmation before any API write.

Resolution order:

1. explicit CLI argument: `--workspace-id <id>`
2. optional environment default: `YEEFLOW_WORKSPACE_ID` or active profile workspace variable
3. explicit user-selected workspace from workspace discovery
4. stop with guidance if no workspace is selected

For non-interactive package install/import/upgrade, do not guess. If multiple workspaces are available, ask the user to choose. If exactly one workspace is available, it may be suggested with a redacted ID preview, but the target workspace must still be confirmed before live package operations.

## Workspace Mutation Boundary

Workspace add, edit, delete, and sort APIs are mutation APIs. They are not used automatically by the plugin, are blocked by generic read-only helpers, and require explicit admin confirmation if ever implemented in a dedicated guarded workflow.
