# Environment Configuration

Normal OAuth and workspace discovery do not require `.env.local`; the file may be absent or empty. If a local `.env.local` exists, it must stay gitignored and must never be committed.

## API Base And Tenant URL

The plugin provides the shared API base for API calls. Do not put API base URLs, API keys, tenant URLs, tenant IDs, or workspace IDs in normal `.env.local` setup. Raw tokens and full decoded token payloads are never printed. Do not use a tenant URL as the API base. Treat `YEEFLOW_BASE_URL` as a legacy API-base alias only.

## Normal OAuth And Workspace Discovery

Recommended `.env.local`:

```env
# No required values for normal OAuth + workspace discovery.
```

This is enough for OAuth login/refresh, normal API use, and read-only workspace discovery. Use `node scripts/yeeflow-workspace-list.mjs --all` to check both documented categories, or `--category flowcraft` for the current app/package workspace category. The helper calls only documented OAuth read-only `GET /workspaces/settings` and `GET /workspaces/flowcraft`, and prints only count, title or user-facing fallback name, category, status, status provenance, and redacted workspace ID previews. It does not print tenant URLs, tenant IDs, full workspace IDs, tokens, Authorization headers, raw API responses, or raw workspace objects.

## OAuth Setup

Browser OAuth is the standard path for user-facing API work. The plugin provides fixed OAuth defaults; override them only for development/testing.

OAuth login and refresh use Authorization Code with PKCE S256. The plugin creates the `code_verifier`, sends the matching `code_challenge`, and exchanges/refreshes tokens without a client secret:

```env
# No required values for normal OAuth + workspace discovery.
```

No OAuth client secret is required for normal login/refresh. Do not commit `.env.local`, OAuth tokens, authorization codes, PKCE verifiers, or private tenant/workspace values.

Commands:

```sh
node scripts/yeeflow-oauth-login.mjs
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-oauth-refresh.mjs
node scripts/yeeflow-oauth-logout.mjs
```

## Multi-Tenant Profiles

Where scripts support profiles, `YEEFLOW_PROFILE` can still select one local profile for legacy/internal workflows. Do not use profile API keys, tenant URLs, tenant IDs, or workspace IDs for normal OAuth plus workspace discovery.

## Package Automation

Package upload/import/install/upgrade helpers default to dry-run behavior and require explicit confirmation for live operations. Package import/install/upgrade operations still require an explicit target workspace and workspace confirmation, but local `YEEFLOW_WORKSPACE_ID` is ignored for package write target selection.

Target workspace resolution order:

1. OAuth workspace discovery with `node scripts/yeeflow-workspace-list.mjs --category flowcraft`
2. explicit user-selected workspace passed with `--selected-workspace-id <id>`
3. documented user-selected `--workspace-id <id>` when it represents the same API-discovered choice
4. if no workspace is selected, stop before request shaping

For non-interactive package install/import/upgrade, do not guess and do not fall back to environment workspace IDs. If multiple `flowcraft` workspaces exist, ask the user to choose. If one workspace exists, report it as a suggestion with a redacted ID preview and still require target confirmation before any package write.

Workspace mutation APIs such as add, edit, delete, and sort are not used automatically. If they are ever implemented, they require explicit admin confirmation and are out of scope for package automation.

## Legacy API Key Fallback

Normal API calls use OAuth. If no valid OAuth token exists, ask the current user to run OAuth login first. `YEEFLOW_API_KEY` is not required for normal OAuth/API calls and is treated only as a legacy/deprecated fallback for older internal workflows if existing code still supports it. It must never be printed or committed.

## Security Reminders

Never print or commit API keys, OAuth tokens, client secrets, authorization codes, cookies, private tenant URLs, raw API responses, decoded package payloads, generated runtime packages, cert/key files, or local cache folders.
