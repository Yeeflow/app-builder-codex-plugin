# App Builder Codex Plugin

Fresh Yeeflow App Builder Codex plugin repository with a non-colliding Codex marketplace identity.

## Identity

- Marketplace ID: yeeflow
- Marketplace display: Yeeflow
- Plugin ID: yeeflow-app-builder
- Plugin display: Yeeflow App Builder
- Version: 0.6.21-api-map.0
- Dist path: dist/yeeflow-app-builder-plugin

## Install In Codex App

Source: https://github.com/Yeeflow/app-builder-codex-plugin.git

Git ref: stable

Sparse paths:

```text
.agents/plugins/marketplace.json
dist/yeeflow-app-builder-plugin
```

## What Is Included

This repository carries the tested Yeeflow App Builder plugin bundle from the stable OAuth/API capability-map baseline. It includes local Browser OAuth helpers, OAuth status/refresh/logout helpers, the OAuth/API auth wrapper, legacy API-key fallback, the Yeeflow REST API capability map, read-only capability-list/call helpers, package automation dry-run safety, validators, release hygiene guidance, and proof-boundary documentation.

## Safety Boundaries

Use only documented Yeeflow REST API capabilities. Do not guess endpoint paths. Read-only and write capabilities remain classified separately. Write operations and package install/import/upgrade/delete flows require explicit confirmation, and package operations require stronger confirmation. Helpers must not print secrets, tokens, private tenant URLs, raw API responses, or decoded private payloads.

## Validate

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.21-api-map.0
node scripts/test-yeeflow-oauth-auth.mjs
node scripts/test-yeeflow-api-capabilities.mjs
node scripts/test-yeeflow-env-utils.mjs
node scripts/test-package-api-dry-run-env.mjs
node scripts/test-package-api-workspace-config.mjs
node scripts/test-package-api-upload-response-parsing.mjs
```

These tests are local/synthetic and must not run live Yeeflow API writes.

## Migration Note

The legacy repository and identity remain available for now. This clean repository avoids the old `yeeflow-internal` / `yeeflow-builder` cache identity, which has been observed resolving stale materializations in Codex App.
