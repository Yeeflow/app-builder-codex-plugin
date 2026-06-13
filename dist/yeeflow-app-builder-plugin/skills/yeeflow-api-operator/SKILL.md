---
name: yeeflow-api-operator
description: Safely use Yeeflow REST APIs from Codex when local credentials are available. Use for read-only Yeeflow organization and reference-data lookups, API connectivity checks, directory/master-data discovery, users, departments, locations, positions, groups, assignment-routing API coverage, or when app planning/runtime tests need authorized org data without exposing secrets.
---

# Yeeflow API Operator

## Canonical Schema Files

Package validation helpers use stable packaged schema paths: YAPK validation uses `schemas/yapk-schema.json`, and YAP validation uses `schemas/yap-schema.json`. Do not hardcode versioned schema filenames in runtime logic. To update a product schema standard later, replace the canonical file contents while keeping these filenames unchanged. Keep YAP and YAPK schema standards separate when shaping install or upgrade preflight checks.

## Public Tenant Safety

- Never hardcode a tenant-specific Yeeflow URL. Use `https://<yourdomain>.yeeflow.com` in docs and examples.
- Before Yeeflow API work, run `node scripts/yeeflow-oauth-status.mjs` or `node scripts/yeeflow-api-auth-smoke.mjs` to check local auth status.
- Before choosing an endpoint, inspect the REST API capability map with `node scripts/yeeflow-api-list-capabilities.mjs` or `scripts/lib/yeeflow-api-capabilities.mjs`.
- Use only documented capabilities from the map. Do not guess endpoint paths, do not expose arbitrary raw API calls, and report missing API coverage when no mapped capability exists.
- Use Browser OAuth-backed API calls for normal user-facing usage. If OAuth is not authenticated, request the Yeeflow plugin login flow and preserve the original operation; never ask for a Yeeflow password. If the plugin login action is unavailable in this runtime, say: `I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.`
- Prefer read-only capabilities for inspection and verification. Require explicit user confirmation for write capabilities and stronger confirmation for package install/import/upgrade/delete operations.
- Keep legacy/deprecated `YEEFLOW_API_KEY` mode only as an older internal fallback where existing code still supports it; do not use it for normal plugin/API operation and do not ask users to paste API keys, OAuth tokens, auth codes, cookies, Authorization headers, or client secrets into chat.
- Derive tenant/app link context from OAuth access token claim `tenant` when available. Do not require `YEEFLOW_TENANT_URL` for normal OAuth plus workspace discovery. Never use a tenant URL as the API base.
- Treat `YEEFLOW_BASE_URL` as a legacy API base URL alias only, not as a tenant URL.
- Support `YEEFLOW_PROFILE` where scripts support profiles for legacy/internal workflows. Normal OAuth plus workspace discovery should not require profile API keys, tenant URLs, tenant IDs, or workspace IDs. Package automation must not use `YEEFLOW_<PROFILE>_WORKSPACE_ID` as a package write target; profile workspace values are ignored unless the user explicitly selects an API-discovered workspace and passes it as `--selected-workspace-id` or documented user-selected `--workspace-id`.
- Validate and redact environment variables before API calls and never print API keys, OAuth access tokens, refresh tokens, ID tokens, auth codes, cookies, Authorization headers, raw API responses, tenant IDs, private URLs, raw `Resource`, raw `Sign`, decoded payloads, or generated runtime packages.
- Keep generated examples tenant-neutral unless the user explicitly requests a target-tenant-specific package and provides safe mappings.

## Purpose

Use this skill when Codex needs safe, credential-aware Yeeflow REST API access. The v1 boundary is the documented capability map in `scripts/lib/yeeflow-api-capabilities.mjs`, with read-only directory/master-data access preferred for users, departments, locations, positions, user groups, group members, and position assignments.

This skill is separate from package generation. It can support planning, validation, and runtime-test setup. Directory/master-data calls remain read-only by default.

Package import/install/upgrade APIs are a separate, explicitly mutating path. Use them only when the user asks to automate package import, install, or upgrade, local package validation has passed, the active workspace is confirmed, and the user explicitly approves execution. Never run package automation as part of normal lookup. Local validation is not import proof, API acceptance is not runtime proof, and runtime proof applies only to the tested scope.

YAPK signing is also a separate proof gate. When a generated package is being prepared for upload-ready handoff and credentials are available, use only the documented package signing endpoints `POST /utils/apppackage/setsign` and `POST /utils/apppackage/verifysign`; never guess signing paths or print raw responses, `Resource`, `Sign`, tokens, tenant URLs, or workspace IDs. Use plugin defaults for the API base, prefer OAuth over legacy API key fallback, and resolve a target workspace only when install/import/upgrade automation is explicitly approved.

## When To Use

Use this skill for prompts such as:

- "Test my Yeeflow API connection."
- "Check if Codex can read Yeeflow users."
- "List available Yeeflow departments safely."
- "Use Yeeflow API to find department IDs for app generation."
- "Read locations and positions for approval routing setup."
- "Check whether an Assignment Task user group or job position reference resolves to users."

Use the API only when local credentials are available and the user has asked for API-backed lookup or when a Yeeflow workflow would otherwise require real org/reference data.

## When Not To Use

- Do not use this skill for normal Yeeflow package generation when no real org data is needed.
- Do not ask the user to paste API keys into chat.
- Do not run write APIs unless the user explicitly asks for package import/install/upgrade automation and you use the guarded package helper with `--execute`.
- Do not commit `.env.local`, raw API responses, credentials, tokens, users, emails, phone numbers, tenant IDs, or private identifiers.
- Do not add write operations until they are separately studied, safety-reviewed, and runtime-proven.

## Environment Model

The plugin bundles non-secret fixed defaults for the Yeeflow API base, OAuth client id, OAuth authorization URL, OAuth token URL, and OAuth scopes. Do not add those defaults to normal `.env.local`.

Normal local setup for OAuth login/refresh, API use, and workspace discovery:

```env
# No required values for normal OAuth + workspace discovery.
```

OAuth token exchange/refresh uses Authorization Code with PKCE S256. The plugin generates the `code_verifier`; no OAuth client secret is required for normal login/refresh.

Rules:

- OAuth token storage is local and ignored; use `node scripts/yeeflow-oauth-logout.mjs` to clear it. Local HTTPS callback cert/key files must stay ignored and uncommitted.
- Live user-facing API helpers require a valid OAuth access token and refresh it when expired and possible. If OAuth is unavailable, request the Yeeflow plugin login flow before continuing the original operation. Legacy `YEEFLOW_API_KEY` remains only for older internal fallback paths where existing code still supports it.
- Load the API base from plugin defaults. Do not put `YEEFLOW_API_BASE_URL` in normal `.env.local`; `YEEFLOW_BASE_URL` is supported only as a legacy API base URL alias.
- Do not configure `YEEFLOW_OAUTH_CLIENT_SECRET` for normal OAuth login/refresh. The plugin does not bundle secrets.
- Load the legacy/deprecated key fallback from `YEEFLOW_API_KEY` or, when `YEEFLOW_PROFILE` is set, from `YEEFLOW_<PROFILE>_API_KEY` only for older internal workflows.
- Load tenant/app links from OAuth token claim `tenant` after authorization. Package automation ignores local `YEEFLOW_WORKSPACE_ID` and active profile workspace variables for package write target selection; discover `flowcraft` workspaces through OAuth first, ask the user to choose from the redacted list, then pass `--selected-workspace-id` or documented user-selected `--workspace-id`.
- Never print the key, OAuth tokens, Authorization header, or client secret or include them in logs, docs, commits, or final answers. Never print workspace IDs either; report only present or missing.
- Ensure `.env.local` is gitignored before running API checks.
- If OAuth is not authenticated, request the Yeeflow plugin login flow and preserve the original operation; do not ask for passwords, tokens, client secrets, or API keys in chat. If the plugin login action is unavailable in this runtime, say: `I need Yeeflow login before I can continue, but the plugin login action is not available in this runtime. Please open the Yeeflow plugin login flow in Codex, then ask me to retry this operation.`

Use the plugin default API base for live API calls. Use OAuth token claim `tenant` or optional `YEEFLOW_TENANT_URL` fallback only for tenant/app links such as `https://<yourdomain>.yeeflow.com`. Do not use a tenant URL as the API base. `YEEFLOW_PROFILE` is a local script selector, not a Yeeflow server-side setting; it activates exactly one profile for a run.

## Capability Map

Check the capability map before every Yeeflow REST API task:

```bash
node scripts/yeeflow-api-list-capabilities.mjs
node scripts/yeeflow-api-list-capabilities.mjs --read-only
node scripts/yeeflow-api-list-capabilities.mjs --write
node scripts/yeeflow-api-list-capabilities.mjs --filter locations
```

The map records documented method, path, summary, required/optional parameters, read-only/write classification, confirmation requirements, source, and safety notes. It is the routing source for deciding whether to use an API, which helper to use, and whether user confirmation is required.

Use `node scripts/yeeflow-api-call-capability.mjs --name <capability>` only for mapped read-only `GET` capabilities. It does not support arbitrary raw paths and blocks write capabilities.

If no capability exists for a task, report the missing API coverage and use a browser/manual workflow only if the user allows it.

## Supported Read-Only Operations

Initial supported endpoints:

- Capability listing and routing from `scripts/lib/yeeflow-api-capabilities.mjs`.
- Test OAuth/API authentication and plugin-default API base resolution.
- Test Yeeflow API connectivity.
- `POST /users/search`
- `GET /users/{id}`
- `GET /departments?parentId=0`
- `GET /locations`
- `GET /locations/{id}`
- `GET /positions`
- `GET /positions/{id}/users`
- `GET /positions/{id}/users?bindingType=2&targetID={departmentId}`
- `GET /positions/{id}/users?bindingType=3&targetID={locationId}`
- `GET /groups`
- `GET /groups/{id}/users`
- `GET /workspaces/settings` and `GET /workspaces/flowcraft` through `node scripts/yeeflow-workspace-list.mjs --all` or `--category flowcraft`
- `GET /workspaces/{category}/{id}` when a narrow read-only lookup is explicitly needed

Report only:

- env-var presence, never values
- HTTP status
- API status
- counts
- endpoint success/failure
- response keys
- redacted sample schema/shape
- workspace count/title or user-facing fallback name/category/status/status provenance and redacted workspace ID previews

For user/person data, show counts and redacted field shapes by default. Do not show full names, emails, phone numbers, or broad identity dumps. Return IDs only when explicitly needed for app generation or runtime testing, and keep scope narrow.

## Package Automation Operations

The product team published package automation APIs on 2026-05-29:

- `POST /files/upload`
- `POST /listset/package/import`
- `POST /listset/package/install`
- `POST /listset/package/upgrade`

Use the shared helper from the repository root:

```bash
node scripts/yeeflow-package-api-automation.mjs --operation import-yap --package <file.yap>
node scripts/yeeflow-package-api-automation.mjs --operation install-yapk --package <file.yapk>
node scripts/yeeflow-package-api-automation.mjs --operation upgrade-yapk --package <file.yapk>
```

WorkspaceID is required for import/install/upgrade payloads, but it is not required for normal OAuth setup and must not come from local environment configuration. For current app package workflows, discover `flowcraft` workspaces with `node scripts/yeeflow-workspace-list.mjs --category flowcraft`, ask the user to choose from the redacted API-discovered list, then pass `--selected-workspace-id` or documented user-selected `--workspace-id`. If only local `YEEFLOW_WORKSPACE_ID` or active profile workspace variables are present, the helper must stop before request shaping with `workspace_selection_required`, `source: environment-default-ignored`, and no live package write. The helper defaults to dry run. Add `--execute` only after explicit user approval and target workspace confirmation. Dry-run operations must load `.env.local` through `scripts/yeeflow-env-utils.mjs`; do not shell-source secrets. Dry-run `upload`, `install-yapk`, `upgrade-check-yapk`, and `upgrade-apply-yapk` must confirm only redacted environment presence, workspace source, request shape or blocked status, endpoint, and `UpgradeCheck` mode. Runtime proof found that `POST /files/upload` may return `text/plain` containing JSON metadata fields; parse that JSON when possible, pass only redacted `PackageFile` metadata into install/upgrade, and never print uploaded file IDs. It prints env-var presence, package name/size, request summary or blocked summary, HTTP/API status, response keys, and redacted data shape only. It must not print API keys, workspace IDs, raw API responses, raw package `Resource`, raw `Sign`, decoded payloads, private URLs, tenant IDs, or uploaded file IDs.

After a successful live `install-yapk` or `import-yap`, include the selected workspace display name/category/redacted ID preview, result status, safe installed/imported `ListSetID` when present, and application access link if safely resolvable. Build links only from OAuth/session tenant context plus ListSetID using `<tenant-url>/#/list-set/41/<listset-id>`. Do not use `.env.local` or `YEEFLOW_TENANT_URL` for the tenant URL. If unavailable, report `Application link: unavailable; ListSetID or tenant URL was not safely resolved.` API install/import success is not browser runtime proof; tell the user to open the link and verify navigation, dashboards, lists, forms, and workflows.

Workspace mutation APIs are mapped only as write-classified metadata: `POST /workspaces/{category}`, `PUT /workspaces/{category}/{id}`, `DELETE /workspaces/{category}/{id}`, and `POST /workspaces/{category}/sort`. Do not run them from generic helpers. Delete is destructive and requires strong confirmation if a dedicated guarded workflow is ever requested and implemented.

New app delivery is YAPK-first. Generate/import YAP only when the user explicitly requests YAP or a fallback/debug task is specifically about YAP. Before executing package automation, validate the package locally with the relevant `.yap` or `.yapk` validators, confirm the target workspace is disposable or approved, and record the proof boundary. The helper classifies results as `upgrade_check_passed`, `upgrade_applied`, `already_installed`, `api_rejected`, or `http_rejected` for upgrade paths; never classify `UpgradeCheck:true` as applied success. Use `already_installed` to recommend upgrade flow, manual test cleanup, or a renamed/new-version package. YAPK upload plus install is runtime-proven at API-acceptance level; browser app rendering remains a separate runtime proof. YAP import remains not proven when the API returns non-zero status. A successful API response is not a substitute for visible runtime verification of the imported/installed/upgraded app.

## Safety And Redaction

Redact by default:

- names
- emails
- phone numbers
- user IDs
- department/location/position IDs when shown as samples
- tenant IDs
- manager fields
- audit-user fields
- addresses
- account codes
- employee numbers
- photos
- job titles
- private identifiers

Never write raw API responses to tracked files. If a temporary response capture is explicitly needed for debugging, keep it under ignored `tmp/`, redact it before sharing, and do not commit it.

## Connectivity Smoke Test

Prefer the skill-local helper when this skill is installed in a plugin:

```bash
node generated-skills/yeeflow-api-operator/scripts/yeeflow-directory-connectivity-test.mjs
```

From the repository root, the shared workspace helper is also available:

```bash
node scripts/yeeflow-directory-connectivity-test.mjs
```

The helper parses `.env.local` into `process.env` only when values are not already set. It prints only presence, statuses, counts, response keys, and redacted sample shapes.

For Assignment Task routing API coverage, use:

```bash
node scripts/yeeflow-assignment-routing-api-coverage-test.mjs "/path/to/export.yap"
```

This helper decodes the export in memory, extracts assignment references, and tests only documented read-only coverage endpoints. It reports counts, status, redacted schema shapes, and reference-category counts only.

For detailed behavior and latest proven results, read `references/yeeflow-directory-api-connectivity.md`.
For assignment-routing coverage, read `docs/studies/yeeflow-api-operator-assignment-routing-coverage.md` in the source repository when available.

## Failure Handling

- Missing `.env.local`: explain that no local values are required for normal OAuth plus workspace discovery; local `YEEFLOW_WORKSPACE_ID` is ignored for package writes.
- Missing OAuth auth: return `auth_required` / `login_flow_required`, request the Yeeflow plugin login flow, preserve the original operation, and do not ask the user to paste secrets, set API keys, create `.env.local`, or run local Node login commands as the normal user path. If PKCE/no-secret login or refresh fails, report the safe error class and recommend product/OAuth server configuration follow-up.
- Missing target workspace for package automation: ask the user to run `node scripts/yeeflow-workspace-list.mjs --category flowcraft`, choose from the redacted API-discovered list, and pass `--selected-workspace-id` or documented user-selected `--workspace-id`; do not use or print local environment workspace IDs.
- Authentication/authorization failure: report HTTP/API status and likely causes such as expired OAuth token, wrong account, insufficient permission, or wrong base; do not echo credentials.
- `404` on the configured API base: verify the plugin default API base or development override is `https://api.yeeflow.com/v1`; do not substitute the tenant URL as the API base.
- Non-JSON or unexpected responses: report status and response shape only; do not dump body content.

## Coordination With App Work

When app planning or generation needs real users, departments, locations, or positions, use this skill only if credentials are locally available and API lookup is authorized. Do not invent org data when lookup is available and authorized. Do not require API access for normal package generation.

For approval workflow assignment task assignee generation, use read-only lookup only when real users, departments, locations, or positions are explicitly needed and authorized. Report only counts, status, and redacted shapes; never save or commit raw API responses.

For export-learning work, you may build memory-only or ignored-temp reference sets to classify redacted assignment task references as user, department, location, or position categories. Do not commit raw ID maps, names, emails, tenant IDs, or raw records. API category confirmation supports schema interpretation only; it does not prove workflow runtime routing.

User-group lookup is now supported through documented read-only `GET /groups` and `GET /groups/{id}/users`. Use it only to confirm category/member-count/readability for authorized runtime setup; do not dump group members or commit user/group data.

The public OpenAPI docs do not currently expose a `GET /departments/{id}`, `GET /positions/{id}`, or combined department+location position-assignment endpoint. Do not invent those calls; use the documented list/tree and position-assignment endpoints instead.

Keep generated packages free of private user data unless the user explicitly requires it, the data is safe to include, and the scope is narrow. Prefer placeholders, empty groups, requester/current-user expressions, or post-import configuration when that is safer.
