# Yeeflow App Builder v0.9.59 Install Smoke

## Release Candidate

- RC tag: `yeeflow-app-builder-plugin-v0.9.59-rc1`
- Git commit: `b752c2633942630ef897bf4f8342a67d29d19bc6`
- Marketplace/plugin: `Yeeflow` / `Yeeflow App Builder`
- Active version: `0.9.59`
- Installed cache: `/Users/rengerhu/.codex/plugins/cache/yeeflow/yeeflow-app-builder/0.9.59`

## Cache Smoke

- upgrade-scope focused regression: pass
- Set Variable golden-reference regression: pass
- hard-gate cache artifacts: pass
- installed-cache focused materialization: pass
- numeric candidate PackageId replaced with UUID: pass
- unchanged Form Report/navigation omission: pass
- real Workflow SetVariableTask candidate export-shape and upgrade-scope gates: pass

## Proof Boundary

This proves RC installation, cache materialization, and pre-signing gate closure. Live upgrade and Workflow SetVariableTask execution remain separate steps.

Final release status: accepted for final tag and `stable` promotion.
