# Yeeflow App Builder v1.12.5

## Version decision

- Previous stable version: `1.12.4`
- New version: `1.12.5` (patch)
- Scope: Approval workflow final-layout closure, readable folded generation, and fail-closed rejection-route validation.

## Included changes

- Require the complete Approval workflow topology before node placement, connector routing, graph bounds calculation, and validation.
- Fold generated sequential workflow execution after five nodes per backbone row; row transitions receive safe explicit route vertices.
- Reject non-local `EndRejectEvent` rejected or return connectors that have no vertices.
- Validate row/column route geometry for those explicit non-local rejection routes.
- Add the final-layout closure standard, training report, and source/distribution regression coverage.

## Verification boundary

- Local source and distribution suites prove generated-final structural closure.
- API save acceptance and persisted readback do not prove Workflow Designer readability or runtime routing.
- Designer-open and disposable-request browser workflow smoke remain required for those claims.

## Final release install evidence

- Stable Marketplace source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`, ref `stable`, with sparse paths `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`.
- Stable commit: `47149943b8d856f45c50b4f88f7eea68878b3004`.
- Installed Plugin: `yeeflow-app-builder@yeeflow` version `1.12.5`.
- Installed-cache validation passed for Plugin structure, Approval workflow layout, Approval publish readiness, and bundled MCP integration.
- This verifies install/discovery and bundled local checks; it does not claim a live Workflow Designer or browser execution result.
