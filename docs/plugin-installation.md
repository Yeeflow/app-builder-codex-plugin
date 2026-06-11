# Yeeflow App Builder Plugin Installation

## Current Identity

- Marketplace: Yeeflow
- Marketplace ID: yeeflow
- Plugin: Yeeflow App Builder
- Plugin ID: yeeflow-app-builder
- Version: 0.6.21-api-map.0
- Dist path: dist/yeeflow-app-builder-plugin

## Codex App Install Source

Source: https://github.com/Yeeflow/app-builder-codex-plugin.git

Git ref: stable

Sparse paths:

```text
.agents/plugins/marketplace.json
dist/yeeflow-app-builder-plugin
```

## Validate Metadata

Run from the repository root:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.21-api-map.0
```

Expected result: marketplace `yeeflow`, plugin `yeeflow-app-builder`, display `Yeeflow App Builder`, version `0.6.21-api-map.0`.

## Migration Note

The legacy repository used marketplace `yeeflow-internal` and plugin `yeeflow-builder`. That identity may resolve stale local/server cache materializations such as `0.5.8` in Codex App. This repository intentionally uses the new `yeeflow` / `yeeflow-app-builder` identity. Do not retire the legacy repository until this new identity passes Codex App install/cache smoke testing.
