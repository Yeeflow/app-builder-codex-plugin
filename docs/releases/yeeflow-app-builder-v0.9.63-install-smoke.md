# Yeeflow App Builder v0.9.63 Install Smoke

## Release Candidate

- RC tag: `yeeflow-app-builder-plugin-v0.9.63-rc1`
- Git commit: `75b17c4fcdc7aeb86586d67ddc10aea225d44daa`
- Marketplace/plugin: `Yeeflow` / `Yeeflow App Builder`
- Install source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`
- Active version: `0.9.63`
- Installed cache: `/Users/rengerhu/.codex/plugins/cache/yeeflow/yeeflow-app-builder/0.9.63`

## Cache Smoke

- RC marketplace installation: pass
- Marketplace checkout ref and commit: pass, exact RC tag at `75b17c4`
- Installed manifest identity and version: pass
- Marketplace payload and installed cache byte parity: pass
- Form Action Set Data List focused gates: pass, 61 cases
- Approval Task Form and Document Library supplemental regressions: pass
- `Leave Management-v1.6.yapk` structural validation: pass, 15 Set Data List steps and 0 findings
- Full-app generation and materialization entrypoint gates: pass
- Installed-cache YAPK hard-gate artifact checks: pass
- Source/dist release safety, archive integrity, and repository hygiene: pass

## Proof Boundary

This proves RC installation, versioned-cache materialization, Form Action Set Data List planning/materialization/validation coverage, Approval submission/task form parity, Document Library `_Path` and required Upload File contracts, and source/dist/cache payload integrity.

It does not by itself prove live record add/update/delete execution, Document Library upload execution, Approval form submission, browser runtime behavior, or tenant-side data mutation. Those remain separate runtime-proof activities.

Final release status: accepted for final tag and `stable` promotion.
