# Yeeflow App Builder v1.6.2 Install Smoke

## Candidate

- RC tag: `yeeflow-app-builder-plugin-v1.6.2-rc1`
- RC commit: `c261887d54666c76dac4495a3686a1863a888231`
- Tracked-payload archive: `dist/yeeflow-app-builder-plugin-1.6.2-rc1.zip`
- Tracked-payload archive SHA-256: `9546d0993f83db1902b0b42d0396917b7a96392d55478e47b67ff819f9688876`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`

## Marketplace Reinstallation Result

- The prior Yeeflow Plugin was removed, the Marketplace was refreshed at the exact RC1 tag, and `yeeflow-app-builder@yeeflow` version `1.6.2` was installed and enabled.
- The installed cache manifest reported Plugin `yeeflow-app-builder`, display name `Yeeflow App Builder`, and version `1.6.2`.
- The cache was inspected as an installed-plugin root; it exposed the hosted `yeeflow_app_builder_mcp` configuration at `https://api.yeeflow.com/v1/mcp` with server-negotiated OAuth and no embedded credentials.

## Installed-Cache and Fresh-Task Checks

- Plugin MCP integration check passed.
- Collection generation fixtures passed.
- Dashboard dataset golden-reference regression suite passed, including responsive Table/Card structure, mobile Full width operations, non-sparse Card children, local Card display rules, Card operation z-index, and mobile operation-menu placement.
- A new ephemeral read-only Codex task loaded the installed Dashboard Generator skill and returned `YEEFLOW_PLUGIN_V1_6_2_SKILL_DISCOVERY_OK` without MCP calls, tenant access, or file changes.

## Acceptance Boundary

This smoke proves the exact RC Marketplace reinstallation, installed cache metadata, Plugin payload static contracts, and fresh-task skill discovery. It does not prove Yeeflow tenant writes, Dashboard runtime behavior on every generated application, or MCP-authenticated tenant reads/writes.
