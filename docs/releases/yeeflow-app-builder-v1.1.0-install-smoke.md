# Yeeflow App Builder v1.1.0 Post-Release Install Smoke

## Release Decision

On 2026-08-03, the release owner explicitly directed publication of the final
stable version before private Marketplace installation testing. This decision
overrides the normal RC-first smoke sequence for this release only. It does not
represent a passed install smoke test.

## Candidate Accepted For Stable Publication

- RC tag: `yeeflow-app-builder-plugin-v1.1.0-rc1`
- Release code commit: `95cf8c033aff6b43c14d6af291dae834b4344297`
- RC provenance commit: `ea5a7f5719e34553ced4f0a8d0163a7a913c3dde`
- Marketplace: `Yeeflow`
- Plugin: `Yeeflow App Builder`
- Static release gates: passed
- Private Marketplace install result: pending
- Final release status: explicitly accepted for publication with post-release
  smoke verification required

## Stable Validation Source

```text
Source:
https://github.com/Yeeflow/app-builder-codex-plugin.git

Git ref:
stable

Sparse paths:
.agents/plugins/marketplace.json
dist/yeeflow-app-builder-plugin
```

## Post-Release Smoke Prompts

- Use Yeeflow App Builder to summarize the application-builder lifecycle.
- Use the Dashboard Generator to explain standalone YDP build and validation.
- Generate a standalone Dashboard Page YDP and report the prewrite and
  round-trip gates used.

## Pending Evidence

Record the installed version, discovery result, prompts tested, UI/cache/icon
behavior, and final pass or failure after stable installation. Until then, no
installed-cache, Designer, tenant import, or runtime proof is claimed.
