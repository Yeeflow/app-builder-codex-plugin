# Official Stable Plugin Metadata Cache Audit

## Context

The official `stable` branch was reported as installing into the local Codex cache as version `0.5.8`:

```text
/Users/Renger/.codex/plugins/cache/yeeflow-internal/yeeflow-builder/0.5.8
```

The expected official stable plugin metadata is:

- Marketplace id: `yeeflow-internal`
- Marketplace label: `Yeeflow Internal`
- Plugin id: `yeeflow-builder`
- Plugin display name: `Yeeflow Builder`
- Version: `0.6.4`

## Audit Result

The sparse-path metadata on `official/stable` resolves to `0.6.4`:

- `.agents/plugins/marketplace.json`
- `dist/yeeflow-builder-plugin/.codex-plugin/plugin.json`

The release archive metadata also resolves to `0.6.4`:

- `dist/yeeflow-builder-plugin-0.6.4.zip`
- `yeeflow-builder-plugin/.codex-plugin/plugin.json`

No active current plugin metadata file in the stable package contains version `0.5.8`.

## Root Cause

The local Codex cache path confirms an installed stale package cache for the same marketplace id and plugin id:

```text
yeeflow-internal / yeeflow-builder / 0.5.8
```

The stable branch package metadata itself is not the source of the `0.5.8` version. The likely cause is a previously installed cache or a marketplace refresh that did not fetch and materialize the current `stable` branch contents.

## Installed Sparse-Path Simulation

The helper script `scripts/inspect-codex-plugin-cache-metadata.mjs` reads the same install-visible paths that Codex uses from the sparse marketplace install:

```sh
node scripts/inspect-codex-plugin-cache-metadata.mjs \
  --root . \
  --expect-version 0.6.4
```

Expected result:

```json
{
  "marketplaceId": "yeeflow-internal",
  "marketplaceLabel": "Yeeflow Internal",
  "pluginEntryId": "yeeflow-builder",
  "pluginId": "yeeflow-builder",
  "pluginDisplayName": "Yeeflow Builder",
  "pluginVersion": "0.6.4"
}
```

## Remediation Guidance

If Codex still reports `0.5.8` after installing from `stable`, remove and re-add the `Yeeflow Internal` marketplace or clear the stale installed plugin cache for `yeeflow-internal/yeeflow-builder/0.5.8`, then reinstall using:

```text
Source:
https://github.com/Yeeflow/yeeflow-codex-plugins.git

Git ref:
stable

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-builder-plugin
```

The immutable release tag `yeeflow-builder-plugin-v0.6.4` is not moved by this audit.
