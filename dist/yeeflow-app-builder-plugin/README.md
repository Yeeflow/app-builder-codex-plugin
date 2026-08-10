# App Builder Codex Plugin

Official Yeeflow App Builder Codex plugin repository.

This repository is the clean successor to `Yeeflow/yeeflow-codex-plugins`. It preserves the useful scripts, schemas, validators, studies, generated skills, and plugin distribution assets while using a new non-colliding Codex plugin identity.

## Identity

- Marketplace: Yeeflow
- Marketplace ID: `yeeflow`
- Plugin: Yeeflow App Builder
- Plugin ID: `yeeflow-app-builder`
- Version: `1.10.6`
- Active dist path: `dist/yeeflow-app-builder-plugin`

Version `1.10.6` removes stale OAuth/REST references from the bundled skills and adds an OpenAI plugin submission packet. Live Yeeflow work uses the four scoped hosted MCP services, with server-negotiated authentication and no bundled credentials. Configuration readback remains separate from Designer/runtime proof.

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
Version: 1.10.6
```

Verify metadata from a checkout:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 1.10.6
```

## What Is Included

- `.agents/plugins/marketplace.json` for Codex marketplace installation.
- `dist/yeeflow-app-builder-plugin` with bundled skills, plugin metadata, and `.mcp.json` hosted MCP configuration.
- `skills/` and `generated-skills/` source mirrors for ongoing development.
- `scripts/` and root development helpers for YAP/YAPK/YDL/YWF generation, inspection, validation, and package automation dry-runs.
- `schemas/yap-schema.json`, `schemas/yapk-schema.json`, and `schemas/yapk-schema-codex.json`.
- Sanitized docs, studies, standards, templates, examples, and historical notes.
- Hosted scoped MCP configuration; no standalone OAuth, REST/API, or credential-handling helpers.

## Key Workflows

Use the plugin to plan, incrementally build, generate, inspect, validate, and harden Yeeflow applications and packages. A normal requirement-to-live-application request defaults to the confirmation-gated MCP incremental path; package generation is an explicit delivery choice. The current package preserves support for:

- Browser OAuth login, status, refresh, logout, and OAuth/API auth wrapper helpers.
- Hosted Yeeflow MCP tools through the scoped App Builder (`/v1/mcp/app-builder`), Operations (`/v1/mcp/operations`), Admin (`/v1/mcp/admin`), and Service Portal (`/v1/mcp/service-portal`) endpoints, with OAuth negotiated by Codex and no credentials embedded in the Plugin.
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

## Yeeflow Access

All live Yeeflow operations use the four hosted MCP services declared in the plugin. Authentication is negotiated by the service; the plugin has no local OAuth flow, REST CLI, API-key configuration, or workspace environment variables. Use `workspace_list` to inspect workspaces and the matching scoped MCP tool for every read or confirmed write. Do not paste credentials, tokens, cookies, or passwords into chat.

## Development Assets

The new repo intentionally keeps more than the minimal plugin distribution:

- root-level generation and inspection scripts restored from the legacy repo
- sanitized runtime study docs and normalized references
- plugin release hygiene and legacy release notes under `docs/legacy/`
- managed app connector design and `.app.example.json`
- safe examples and generated-folder guidance

Generated runtime packages and raw proof payloads remain excluded.

Release packaging and cache smoke must use tracked files as the source of truth. Do not package the raw working tree with ad hoc `zip dist/...` commands; use `git ls-files`-based packaging or an equivalent tracked-file manifest so untracked local artifacts cannot enter a release. Run `node scripts/test-repo-root-hygiene.mjs` before release packaging; it fails on tracked or untracked Finder/copy-style duplicates such as `name 2.md`, `name 3.json`, `name 4.mjs`, or `SKILL 2.md`.

## Migration Note

The legacy repository used marketplace `yeeflow-internal`, plugin `yeeflow-builder`, and dist path `dist/yeeflow-builder-plugin`. That identity has repeatedly materialized stale Codex App cache entries such as `0.5.8`. This repository intentionally uses `yeeflow` / `yeeflow-app-builder` and `dist/yeeflow-app-builder-plugin`.

Do not use the legacy repo or legacy identity for current installs unless explicitly testing migration behavior.
