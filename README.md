# App Builder Codex Plugin

Official Yeeflow App Builder Codex plugin repository.

This repository is the clean successor to `Yeeflow/yeeflow-codex-plugins`. It preserves the useful scripts, schemas, validators, studies, generated skills, and plugin distribution assets while using a new non-colliding Codex plugin identity.

## Identity

- Marketplace: Yeeflow
- Marketplace ID: `yeeflow`
- Plugin: Yeeflow App Builder
- Plugin ID: `yeeflow-app-builder`
- Version: `0.8.110`
- Active dist path: `dist/yeeflow-app-builder-plugin`

Current release `0.8.110` supports consolidated App Plan Data List schema tables for full-app materialization: explicit List / Field label / Internal field / Field type / Purpose rows now preserve planned storage slots, Text-backed identity-picker/lookup/file-upload controls, Service Tickets filters, custom form hosts, and seed artifact contracts.

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
Version: 0.8.110
```

Verify metadata from a checkout:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.8.110
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
- Generated-final YAPK hard gates for API-issued ID provenance, complete navigation runtime metadata, and App Plan resource completeness.
- Dashboard grid-table Collection hard gate for dashboard record-list wrapper structure, detail links, title/header metadata, and runtime/designer proof boundaries.
- UI/Summary/KPI runtime hard gates for page-by-page UI contracts, export-proven style shapes, Summary metadata, visible KPI evidence or labeled fallback, grid-table quality, and upgrade ListSetID/app identity stability.
- Supplier runtime/design fidelity gates and validation-layer proof gates for installed `ListSetID` runtime URL proof, design section/KPI/page chrome mapping, real Data Filter and Collection bindings, analytics/progress/Summary/KPI fidelity, canonical one-PNG-per-page design artifacts, and separated proof layers from schema validation through runtime browser proof and pixel comparison.
- Managed app connector design notes and safe example metadata.

## Safety Boundaries

Never commit tenant credentials, OAuth tokens, API keys, private tenant URLs, raw Yeeflow exports, decoded package payloads, generated runtime packages, screenshots, cert/key files, or local cache folders.

API work must use documented Yeeflow endpoints only. Do not guess paths, do not make arbitrary raw API calls, and do not run mutating/package operations without explicit confirmation. Stronger confirmation is required for package upload, import, install, upgrade, create, update, and delete operations.

Proof boundaries remain separate:

- Local validation is not import proof.
- API acceptance is not runtime proof.
- Runtime proof applies only to the exact tested scope.

## Local Environment

Normal user-facing API work is OAuth-based. `.env.local` may be absent or empty for OAuth login, API access, and workspace discovery. Fixed API/OAuth defaults are bundled by the plugin, and legacy API-key mode remains available only as a deprecated fallback for older internal workflows.

```env
# No required values for normal OAuth + workspace discovery.
```

OAuth login is required before API access. Package import/install/upgrade automation still requires an explicit target workspace, but local `YEEFLOW_WORKSPACE_ID` is ignored for package write target selection. Discover app/package workspaces with `node scripts/yeeflow-workspace-list.mjs --category flowcraft`, ask the current user to choose from the redacted API-discovered list, then pass `--selected-workspace-id` or `--workspace-id` only as that explicit user-selected target. The documented workspace categories are `settings` and `flowcraft`; current app/package workflows use `flowcraft` unless product/API docs change. The plugin uses Authorization Code with PKCE S256 and generates the `code_verifier`; no OAuth client secret is required for normal login/refresh. Raw tokens, full decoded token payloads, tenant IDs, tenant URLs, raw workspace responses, and full workspace IDs are never printed. Do not use `YEEFLOW_API_KEY` for normal API calls; it is legacy/deprecated fallback only.

Do not paste secrets, authorization codes, cookies, bearer tokens, or passwords into chat.

## Useful Commands

```sh
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-oauth-refresh.mjs
node scripts/yeeflow-api-list-capabilities.mjs --read-only
node scripts/yeeflow-api-call-capability.mjs --name locations.list
node scripts/yeeflow-workspace-list.mjs --all
node scripts/yeeflow-workspace-list.mjs --category flowcraft
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
