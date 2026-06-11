# Yeeflow Directory API Connectivity

## Purpose

`scripts/yeeflow-directory-connectivity-test.mjs` is a read-only smoke test for Yeeflow REST API access to basic directory and reference data. It verifies that Codex can load local credentials from `.env.local` and call the documented Yeeflow developer API without printing secrets or persisting raw responses.

The helper is also packaged as part of the `yeeflow-api-operator` skill, which is the preferred trigger when Codex/plugin users ask to use Yeeflow APIs for safe organization/reference-data lookup.

## Required Environment

The script expects these variables in `.env.local`:

- `YEEFLOW_API_KEY`
- `YEEFLOW_BASE_URL`

The API key must only be loaded through `process.env.YEEFLOW_API_KEY`. The script reports only whether the key is present.

## How To Run

From the repository root:

```bash
set -a
source .env.local
set +a
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

## Base URL Behavior

The configured `YEEFLOW_BASE_URL` may be an app or site base URL rather than the developer API base. In the latest local test, the configured value and the configured value plus `/v1` both returned `404` for the directory endpoints. The official Yeeflow developer API base was required for these directory endpoint tests.

The script does not print the configured base URL. It reports base variants only as:

- `env`
- `env-plus-v1`
- `documented-default`

## Latest Result Summary

Latest read-only connectivity result:

- `POST /users/search`: succeeded.
- `GET /departments?parentId=0`: succeeded.
- `GET /locations`: succeeded.
- `GET /positions`: succeeded.

The script output included HTTP status, API status, counts, response keys, and redacted sample shapes. No raw responses were written.
