# Yeeflow App Builder v0.9.62 Install Smoke

## Release Candidate

- RC tag: `yeeflow-app-builder-plugin-v0.9.62-rc1`
- Git commit: `b51b127dc5a14532442748c7d2489b650c66da7c`
- Marketplace/plugin: `Yeeflow` / `Yeeflow App Builder`
- Active version: `0.9.62`
- Installed cache: `/Users/rengerhu/.codex/plugins/cache/yeeflow/yeeflow-app-builder/0.9.62`

## Cache Smoke

- RC marketplace installation: pass
- Installed manifest identity and version: pass
- Approval Form Layouts v1.1 focused gate: pass, 26 cases
- Mixed Approval/Data List/Scheduled `Forms[]` envelope regression: pass
- Production Workflow Set Data List YAPK first-generation preflight: pass, 33 gates
- Production package signing eligibility: pass
- Source/dist validator and regression mirror parity: pass
- Archive integrity, release safety, and repository hygiene: pass

## Proof Boundary

This proves RC installation, versioned-cache materialization, the focused WorkflowType scope correction, preservation of strict Approval form checks, and signing-readiness closure for the production Workflow Set Data List package. It does not by itself prove application installation, workflow execution, record mutation, Document Library writes, or browser/runtime behavior.

The source-checkout metadata inspector still expects marketplace metadata outside an installed cache root. Installed-cache identity was therefore verified directly from `.codex-plugin/plugin.json`; this helper limitation is separate from the v0.9.62 runtime payload and validator fix.

Final release status: accepted for final tag and `stable` promotion.
