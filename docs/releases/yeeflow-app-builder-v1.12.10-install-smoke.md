# Yeeflow App Builder Plugin v1.12.10 Marketplace Install Smoke

## Install Source

- Git source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Ref: `stable`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`
- Marketplace: `yeeflow`
- Plugin: `yeeflow-app-builder@yeeflow`

## Result

- Removed the prior local `yeeflow` Marketplace snapshot and added the `stable` snapshot again.
- Installed version: `1.12.10`.
- Installed-cache plugin validation passed.
- Installed-cache Approval Form control-closure regression passed.
- Installed-cache MCP integration passed with the four expected Yeeflow MCP servers and no embedded credentials.

## Evidence Boundary

This smoke proves Marketplace retrieval, installed-cache integrity, bundled-skill discovery, and MCP metadata. It does not prove Designer rendering, request submission, workflow routing, or browser task-action runtime behavior.
