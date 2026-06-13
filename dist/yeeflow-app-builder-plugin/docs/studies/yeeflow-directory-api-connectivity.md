# Yeeflow Directory API Connectivity

## Purpose

`scripts/yeeflow-directory-connectivity-test.mjs` is a read-only OAuth/API-authenticated smoke test for Yeeflow REST API access to basic directory and reference data. New normal read-only API work should use the OAuth/API auth wrapper and mapped capability helper.

The helper is also packaged as part of the `yeeflow-api-operator` skill, which is the preferred trigger when Codex/plugin users ask to use Yeeflow APIs for safe organization/reference-data lookup.

## Environment

The current OAuth/API wrapper uses plugin defaults for the API base and prefers OAuth tokens. For normal read-only OAuth/API calls through the mapped capability helper, `YEEFLOW_API_KEY` is not required.

`.env.local` may be absent or empty for normal OAuth-backed directory/API checks. Do not put API base URLs, API keys, tenant URLs, tenant IDs, OAuth defaults, or workspace IDs in normal `.env.local` setup. Optional local/manual overrides are only for special cases:

- `YEEFLOW_WORKSPACE_ID` only as legacy/local metadata; package writes ignore it and require explicit API-discovered workspace selection
- `YEEFLOW_TENANT_URL` only as an optional manual tenant UI/browser-link fallback before OAuth token context exists

OAuth login and refresh use Authorization Code with PKCE S256 and do not require an OAuth client secret for normal use.

Legacy/deprecated API-key fallback remains only where existing code supports it. Do not use or request API keys for normal read-only checks.

## How To Run

From the repository root:

```bash
node scripts/yeeflow-directory-connectivity-test.mjs
```

The script can parse `.env.local` when optional local overrides exist, but normal OAuth use does not require the file.

## Read-Only Endpoints

The helper tests only these read-only directory endpoints:

- `POST /users/search`
- `GET /departments?parentId=0`
- `GET /locations`
- `GET /positions`

Do not add create, update, delete, enable, disable, assignment, remove, or other write-operation endpoints to this helper.

For Assignment Task routing coverage, use the separate read-only helper:

```bash
node scripts/yeeflow-assignment-routing-api-coverage-test.mjs "/path/to/export.yap"
```

That helper adds documented read-only checks for user detail, location detail, groups, group members, and position assignments without expanding this basic connectivity smoke test.

## Safety Rules

- Do not print API keys, OAuth tokens, Authorization headers, tenant URLs, workspace IDs, or raw token payloads.
- Do not write raw API responses to disk.
- Do not commit `.env.local`.
- Do not commit raw response payloads, user data, credentials, tokens, tenant IDs, or private IDs.
- Redact user names, emails, phones, addresses, IDs, manager references, tenant fields, audit user fields, photos, job titles, and similar private fields in samples.
- Report endpoint status, counts, response keys, and redacted sample shapes only.

## API Base URL Behavior

The current helper uses the plugin default shared API endpoint unless `YEEFLOW_API_BASE_URL` is explicitly overridden for development/testing. `YEEFLOW_TENANT_URL` is separate and is used only as an optional manual tenant/app link fallback. `YEEFLOW_BASE_URL` is a legacy API base URL alias only and should not be used to mean tenant URL.

The script does not print the configured base URL. It reports base variants only as:

- `api-base`
- `legacy-api-base-alias`

## Latest Result Summary

Latest read-only connectivity result:

- `POST /users/search`: succeeded.
- `GET /departments?parentId=0`: succeeded.
- `GET /locations`: succeeded.
- `GET /positions`: succeeded.

The script output included HTTP status, API status, counts, response keys, and redacted sample shapes. No raw responses were written.
