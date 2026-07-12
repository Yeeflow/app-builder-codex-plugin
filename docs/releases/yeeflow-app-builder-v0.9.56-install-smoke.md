# Yeeflow App Builder v0.9.56 Install Smoke

## Release Candidate

- RC tag: `yeeflow-app-builder-plugin-v0.9.56-rc1`
- Git commit: `fbf35594b81a5a25e897271525035d2170856475`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`
- Marketplace: `Yeeflow`
- Plugin: `Yeeflow App Builder`

## Install Result

- Marketplace re-added from the RC tag: pass
- Plugin install: pass
- Active plugin version: `0.9.56`
- Installed cache path: `/Users/rengerhu/.codex/plugins/cache/yeeflow/yeeflow-app-builder/0.9.56`
- Payload manifest version: `0.9.56`

## Cache Smoke

- installed-cache root path alignment: pass
- hard-gate cache artifacts: pass
- page-scope template dependency regressions: pass
- Dashboard grid-table temp-variable materialization regression: pass
- Approval workflow publish-readiness regressions: pass
- Workflow layout golden-reference regressions: pass
- cache/release byte parity for the changed generator and validators: pass

The cache-root metadata inspector expects a marketplace checkout root containing `.agents/plugins/marketplace.json`; direct cache payload verification therefore used the payload `.codex-plugin/plugin.json` plus the dedicated installed-cache root gate.

## Proof Boundary

This proves private Git marketplace installation, plugin discovery, active version, cache materialization, and focused local regressions. It does not claim a new Yeeflow application runtime installation or business workflow execution.

Final release status: accepted for final tag and `stable` promotion.
