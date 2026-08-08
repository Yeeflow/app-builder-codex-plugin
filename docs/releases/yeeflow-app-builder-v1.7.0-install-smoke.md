# Yeeflow App Builder Plugin v1.7.0 RC Install Smoke

Date: 2026-08-08

## Candidate

- RC tag: `yeeflow-app-builder-plugin-v1.7.0-rc1`
- RC commit: `196a5240cc2703598ba2a0ae8da7facdb0c52b3b`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`
- Tracked-payload RC archive: `dist/yeeflow-app-builder-plugin-1.7.0-rc1.zip`
- Archive SHA-256: `7a34626c8f405d739deabf6d375bba8fde5c4c5b0c30c2aa96844884c69ad979`

## Install and cache checks

The existing Yeeflow plugin and marketplace entry were removed, then the exact RC tag was added from the GitHub source with the two sparse paths above. The Codex Marketplace install completed successfully.

- Installed plugin: `yeeflow-app-builder@yeeflow`
- Installed version: `1.7.0`
- Enabled: `true`
- Installed cache: `/Users/Renger/.codex/plugins/cache/yeeflow/yeeflow-app-builder/1.7.0`
- Installed cache metadata: PASS (`pluginId=yeeflow-app-builder`, `pluginVersion=1.7.0`, `rootMode=installed-cache-root`)
- Installed source/dist template parity: PASS
- Duplicate-copy/root hygiene gate: PASS (`trackedDuplicateCopyCount=0`, `untrackedDuplicateCopyCount=0`)

## Bundled MCP and skill discovery

- Installed `.mcp.json`: PASS (`mcpServers` contains `yeeflow_app_builder_mcp`)
- MCP integration: PASS (`transport=http`, `authentication=server-negotiated-oauth`, `embeddedCredentials=false`)
- Fresh Codex task skill discovery: PASS. The restarted ephemeral read-only task loaded the installed Dashboard Generator skill and returned the exact marker `YEEFLOW_PLUGIN_V1_7_0_SKILL_DISCOVERY_OK`.
- No tenant writes, package import/install/upgrade, or mutating MCP/API operations were executed.

## Functional regression gates

PASS:

- Dashboard golden-reference registry validation (source and installed cache)
- Dashboard golden-reference regression suite
- Collection-control generation fixtures
- Full-app materialization entrypoint gates
- Node/JSON validation, source/dist parity, and `git diff --check`
- Release safety audit against `origin/main` and the RC archive (`blocking=0`, `historicalDebt=0`, `allowedPlaceholders=0`)
- OAuth helper tests

The API capability test's unauthenticated-negative assertion was not accepted in this environment because an existing authenticated OAuth state allowed a read-only call to proceed. Its temporary test token file was removed without inspection. This environment-conditioned limitation is recorded separately from the plugin payload checks; no API write was performed.

## Acceptance boundary

This smoke proves the exact RC can be installed into the Codex cache, exposes the bundled MCP configuration without embedded credentials, routes the new plugin skill in a fresh task, and passes the local/template release gates. It is not tenant runtime proof and does not claim that a generated application was imported, published, or exercised in a live workspace.
