# App Builder Codex Plugin

Official Yeeflow App Builder Codex plugin repository.

This repository is the clean successor to `Yeeflow/yeeflow-codex-plugins`. It preserves the useful scripts, schemas, validators, studies, generated skills, and plugin distribution assets while using a new non-colliding Codex plugin identity.

## Identity

- Marketplace: Yeeflow
- Marketplace ID: `yeeflow`
- Plugin: Yeeflow App Builder
- Plugin ID: `yeeflow-app-builder`
- Version: `0.6.28`
- Active dist path: `dist/yeeflow-app-builder-plugin`

## Install In Codex App

```text
Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
Git ref: stable
Sparse paths:
  .agents/plugins/marketplace.json
  dist/yeeflow-app-builder-plugin
```

Expected installed identity:

```text
Marketplace: Yeeflow
Plugin: Yeeflow App Builder
Version: 0.6.28
```

Verify metadata from a checkout:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.28
```

## What Is Included

- `.agents/plugins/marketplace.json` for Codex marketplace installation.
- `dist/yeeflow-app-builder-plugin` with bundled skills and plugin metadata.
- `skills/` and `generated-skills/` source mirrors for ongoing development.
- `scripts/` and root development helpers for YAP/YAPK/YDL/YWF generation, inspection, validation, and package automation dry-runs.
- `schemas/yap-schema.json`, `schemas/yapk-schema.json`, and `schemas/yapk-schema-codex.json`.
- Sanitized docs, studies, standards, templates, examples, and historical notes.
- OAuth helpers and the documented Yeeflow REST API capability map.

## Key Workflows

Use the plugin to plan, generate, inspect, validate, and harden Yeeflow application packages. The current package preserves support for:

- Browser OAuth login, status, refresh, logout, and OAuth/API auth wrapper helpers.
- Legacy API-key fallback for internal/package automation scenarios.
- Documented REST API capability listing and guarded read-only capability calls.
- Package API automation with dry-run defaults and explicit confirmation gates.
- YAP/YAPK/YDL/YWF validators and wrapper helpers.
- Application plan conformance, navigation checks, runtime-binding lessons, and release hygiene.
- Generated-final YAPK hard gates for API-issued ID provenance and complete navigation runtime metadata.
- Dashboard grid-table Collection hard gate for dashboard record-list wrapper structure, detail links, title/header metadata, and runtime/designer proof boundaries.
- Managed app connector design notes and safe example metadata.

## Safety Boundaries

Never commit tenant credentials, OAuth tokens, API keys, private tenant URLs, raw Yeeflow exports, decoded package payloads, generated runtime packages, screenshots, cert/key files, or local cache folders.

API work must use documented Yeeflow endpoints only. Do not guess paths, do not make arbitrary raw API calls, and do not run mutating/package operations without explicit confirmation. Stronger confirmation is required for package upload, import, install, upgrade, create, update, and delete operations.

Proof boundaries remain separate:

- Local validation is not import proof.
- API acceptance is not runtime proof.
- Runtime proof applies only to the exact tested scope.

## Local Environment

Use a gitignored `.env.local` for local tenant/workspace settings only. Browser OAuth is preferred for user-facing API work. Fixed API/OAuth defaults are bundled by the plugin, and legacy API-key mode remains available only as a deprecated fallback.

```env
# No required values for normal OAuth + workspace discovery.

# Optional default/override for package import/install/upgrade target selection:
# YEEFLOW_WORKSPACE_ID=<optional default workspace id>
# Optional manual override for tenant UI/browser links before OAuth token context is available:
# YEEFLOW_TENANT_URL=https://<yourdomain>.yeeflow.com
```

This form is enough for OAuth login/refresh, normal API use, and read-only workspace discovery. Package import/install/upgrade automation still requires an explicit target workspace, resolved in this order: `--workspace-id`, optional `YEEFLOW_WORKSPACE_ID`, then an explicit user-selected workspace discovered with `node scripts/yeeflow-workspace-list.mjs --category <category>`. The plugin uses Authorization Code with PKCE S256 and generates the `code_verifier`; no OAuth client secret is required for normal login/refresh. The plugin derives tenant/user context from OAuth access token claims `tenantid`, `tenant`, and `accountid`; `YEEFLOW_TENANT_URL` is only an optional manual override for tenant UI/browser links before token context is available. Raw tokens, full decoded token payloads, raw workspace responses, and full workspace IDs are never printed. The plugin provides defaults for `YEEFLOW_API_BASE_URL`, `YEEFLOW_OAUTH_CLIENT_ID`, `YEEFLOW_OAUTH_AUTH_URL`, `YEEFLOW_OAUTH_TOKEN_URL`, and `YEEFLOW_OAUTH_SCOPES`; override them only for development/testing. Do not use `YEEFLOW_API_KEY` for normal API calls; it is legacy/deprecated fallback only.

Do not paste secrets, authorization codes, cookies, bearer tokens, or passwords into chat.

## Useful Commands

```sh
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-oauth-refresh.mjs
node scripts/yeeflow-api-list-capabilities.mjs --read-only
node scripts/yeeflow-api-call-capability.mjs --name locations.list
node scripts/yeeflow-workspace-list.mjs --category <category>
node scripts/test-yeeflow-oauth-auth.mjs
node scripts/test-yeeflow-api-capabilities.mjs
node scripts/test-package-api-dry-run-env.mjs
```

The read-only capability helper executes only mapped read-only `GET` capabilities and never accepts arbitrary raw paths.

## Development Assets

The new repo intentionally keeps more than the minimal plugin distribution:

- root-level generation and inspection scripts restored from the legacy repo
- sanitized runtime study docs and normalized references
- plugin release hygiene and legacy release notes under `docs/legacy/`
- managed app connector design and `.app.example.json`
- safe examples and generated-folder guidance

Generated runtime packages and raw proof payloads remain excluded.

## Migration Note

The legacy repository used marketplace `yeeflow-internal`, plugin `yeeflow-builder`, and dist path `dist/yeeflow-builder-plugin`. That identity has repeatedly materialized stale Codex App cache entries such as `0.5.8`. This repository intentionally uses `yeeflow` / `yeeflow-app-builder` and `dist/yeeflow-app-builder-plugin`.

Do not use the legacy repo or legacy identity for current installs unless explicitly testing migration behavior.
