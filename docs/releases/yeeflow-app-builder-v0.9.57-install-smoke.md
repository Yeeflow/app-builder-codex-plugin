# Yeeflow App Builder v0.9.57 Install Smoke

## Release Candidate

- RC tag: `yeeflow-app-builder-plugin-v0.9.57-rc1`
- Git commit: `19a70eafbfd77fbf83348b9c7acd8c069212ff61`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`
- Marketplace: `Yeeflow`
- Plugin: `Yeeflow App Builder`

## Install Result

- Marketplace re-added from the RC tag: pass
- Plugin install: pass
- Active plugin version: `0.9.57`
- Installed cache path: `/Users/rengerhu/.codex/plugins/cache/yeeflow/yeeflow-app-builder/0.9.57`
- Payload manifest version: `0.9.57`
- Marketplace HEAD equals release merge commit: pass

## Cache Smoke

- Set Variable focused regression: pass, 44 cases
- Approval YWF structure regressions: pass
- Dashboard page-layout regressions: pass
- Data List form-layout regressions: pass
- changed materializer/reference/test byte parity: pass
- installed manifest byte parity: pass

The cache-root metadata inspector expects a marketplace checkout root containing `.agents/plugins/marketplace.json`; direct cache payload verification therefore used the payload `.codex-plugin/plugin.json` plus cache-local focused gates.

## Proof Boundary

This proves private Git marketplace installation, plugin discovery, active version, cache materialization, and focused local regressions. It does not claim Yeeflow runtime execution of Page Load, Field Change, Set Variable, Dynamic Display, workflow mutation, or Set Data List actions.

Final release status: accepted for final tag and `stable` promotion.
