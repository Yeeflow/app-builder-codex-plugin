# Quick Start

Install Yeeflow App Builder in Codex App using:

- Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Git ref: stable
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`

After installation, ask Codex which Yeeflow App Builder version is active. The expected version is `0.6.21-api-map.0`.

For local validation, run:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.21-api-map.0
```

Expected identity: marketplace `yeeflow`, plugin `yeeflow-app-builder`, display `Yeeflow App Builder`.
