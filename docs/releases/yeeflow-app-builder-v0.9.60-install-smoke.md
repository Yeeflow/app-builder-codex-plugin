# Yeeflow App Builder v0.9.60 Install Smoke

## Release Candidate

- RC tag: `yeeflow-app-builder-plugin-v0.9.60-rc1`
- Git commit: `3b36b955bde6f1b86f3bf77103f676250c3b9bff`
- Marketplace/plugin: `Yeeflow` / `Yeeflow App Builder`
- Active version: `0.9.60`
- Installed cache: `/Users/rengerhu/.codex/plugins/cache/yeeflow/yeeflow-app-builder/0.9.60`

## Cache Smoke

- Approval Form field and control-type regression: pass, 29 cases
- Dashboard Collection presentation regression: pass, 80 cases
- page-scope template dependency closure: pass
- full-app materialization entrypoint regression: pass, 38 cases
- YAPK hard-gate cache artifacts: pass
- installed-cache root-path alignment: pass
- marketplace snapshot and RC tag commit parity: pass

## Proof Boundary

This proves RC installation, versioned-cache materialization, focused generator and validator regression, and pre-signing gate closure. It does not claim live application install, workflow execution, or browser runtime behavior for a generated business application.

Final release status: accepted for final tag and `stable` promotion.
