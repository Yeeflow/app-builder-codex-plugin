# Yeeflow App Builder v1.6.1 Install Smoke

## Candidate

- RC tag: `yeeflow-app-builder-plugin-v1.6.1-rc1`
- RC commit: `2a66bcd3be8192b9f9f037b4e6b5450f871370b7`
- Tracked-payload archive SHA-256: `cad6b704f9975af7c9f48c6093323030fc755c8deabd8dc63797729a8f9b3ce6`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`

## Isolated Marketplace Result

- A new temporary `CODEX_HOME` added the Marketplace at the exact RC1 tag.
- `yeeflow-app-builder@yeeflow` version `1.6.1` installed and enabled successfully.
- The Marketplace checkout resolved to the RC commit.
- The versioned installed cache was byte-identical to the Marketplace RC Plugin payload.
- The installed metadata reported Plugin `yeeflow-app-builder`, display name `Yeeflow App Builder`, and version `1.6.1`.

## Installed-Cache Checks

The following passed from the isolated installed cache:

- FormNewReport physical Type `32` field contract regression.
- Incremental MCP capability registry regression.
- Incremental MCP operation planner regression.
- Plugin MCP integration and hosted OAuth configuration check.
- Skill relative-reference check.

The installed MCP configuration exposes `yeeflow_app_builder_mcp` at `https://api.yeeflow.com/v1/mcp`, uses server-negotiated OAuth, and contains no embedded credentials. This smoke performed no authenticated tenant read or write.

## Acceptance Boundary

RC1 proves exact-tag Marketplace installation, cache parity, and static FormNewReport contract enforcement. It does not prove tenant FormNewReport persistence, report row population, filtering, submitted-form detail opening, or export behavior.
