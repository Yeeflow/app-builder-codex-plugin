# Yeeflow Directory API Connectivity

## Purpose

`scripts/yeeflow-directory-connectivity-test.mjs` is a legacy read-only API-key smoke test for Yeeflow REST API access to basic directory and reference data. New normal read-only API work should use the OAuth/API auth wrapper and mapped capability helper.

The helper is also packaged as part of the `yeeflow-api-operator` skill, which is the preferred trigger when Codex/plugin users ask to use Yeeflow APIs for safe organization/reference-data lookup.

## Environment

The current OAuth/API wrapper uses plugin defaults for the API base and prefers OAuth tokens. For normal read-only OAuth/API calls through the mapped capability helper, `YEEFLOW_API_KEY` is not required.

`.env.local` should contain only tenant/workspace values when needed:

- `YEEFLOW_WORKSPACE_ID` when package workspace operations are needed
- `YEEFLOW_TENANT_URL` only when tenant/app links are needed
- `YEEFLOW_OAUTH_CLIENT_SECRET` only if Yeeflow rejects PKCE/no-secret login or refresh and confidential-client fallback is needed locally

This legacy connectivity helper still requires a legacy API key if you choose to run it. The key must only be loaded through `process.env.YEEFLOW_API_KEY` or the active profile key. Scripts report only whether the key is present.

## How To Run

From the repository root:

```bash
node scripts/yeeflow-directory-connectivity-test.mjs
```

The script also parses `.env.local` itself when values are not already present in `process.env`.

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

- Do not print the full API key.
- Do not write raw API responses to disk.
- Do not commit `.env.local`.
- Do not commit raw response payloads, user data, credentials, tokens, tenant IDs, or private IDs.
- Redact user names, emails, phones, addresses, IDs, manager references, tenant fields, audit user fields, photos, job titles, and similar private fields in samples.
- Report endpoint status, counts, response keys, and redacted sample shapes only.

## API Base URL Behavior

The current helper uses the plugin default shared API endpoint, normally `https://api.yeeflow.com/v1`, unless `YEEFLOW_API_BASE_URL` is explicitly overridden for development/testing. `YEEFLOW_TENANT_URL` is separate and is used only for tenant/app links such as `https://<yourdomain>.yeeflow.com`. `YEEFLOW_BASE_URL` is a legacy API base URL alias only and should not be used to mean tenant URL.

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
