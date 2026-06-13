# Yeeflow App Builder Plugin Installation

## Current Identity

- Marketplace: Yeeflow
- Marketplace ID: `yeeflow`
- Plugin: Yeeflow App Builder
- Plugin ID: `yeeflow-app-builder`
- Version: `0.6.36`
- Dist path: `dist/yeeflow-app-builder-plugin`

## Codex App Install Source

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
Version: 0.6.36
```

## Verify Installation

Run from a checkout of this repository:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs --root . --expect-version 0.6.36
```

Expected metadata:

- marketplace ID: `yeeflow`
- marketplace display: `Yeeflow`
- plugin ID: `yeeflow-app-builder`
- plugin display: `Yeeflow App Builder`
- plugin version: `0.6.36`

## Smoke Checks

Safe local checks:

```sh
node scripts/test-yeeflow-oauth-auth.mjs
node scripts/test-yeeflow-api-capabilities.mjs
node scripts/test-yeeflow-env-utils.mjs
node scripts/test-package-api-dry-run-env.mjs
node scripts/test-package-api-workspace-config.mjs
node scripts/test-package-api-upload-response-parsing.mjs
```

Optional read-only OAuth smoke, only when local OAuth is configured and authenticated:

```sh
node scripts/yeeflow-oauth-status.mjs
node scripts/yeeflow-api-list-capabilities.mjs --read-only
node scripts/yeeflow-api-call-capability.mjs --name locations.list
```

The call helper executes only mapped read-only `GET` capabilities.

## Troubleshooting

If Codex App shows an unexpected old version, confirm the marketplace source, Git ref, sparse paths, cache path, and installed plugin version. The expected cache identity is:

```text
yeeflow/yeeflow-app-builder/0.6.36
```

If Codex references an older cache path such as `yeeflow/yeeflow-app-builder/0.6.32` in answers or login guidance, refresh or reinstall the plugin from Git ref `stable` with the sparse paths above. Do not follow stale cache-path commands.

It should not resolve to:

```text
yeeflow-internal/yeeflow-builder/0.5.8
```

On macOS, Codex marketplace installs require a working `git` command. If Git prompts for Apple Command Line Tools, run:

```sh
xcode-select --install
git --version
```

## Migration Note

The legacy repository used marketplace `yeeflow-internal`, plugin `yeeflow-builder`, and dist path `dist/yeeflow-builder-plugin`. That identity can materialize stale Codex App cache entries such as `0.5.8`. Use this repository and the new identity for current installs.
