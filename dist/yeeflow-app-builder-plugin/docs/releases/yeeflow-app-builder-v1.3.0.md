# Yeeflow App Builder v1.3.0

## Release Summary

Yeeflow App Builder v1.3.0 adds the hosted Yeeflow App Builder MCP connection to the existing Skills-based Plugin distribution. Codex can now discover the Plugin workflows and the OAuth-backed Yeeflow platform tools from one installed Plugin package.

## Version Decision

- Previous final version: `1.2.0`
- New version: `1.3.0`
- Change type: minor
- Reason: the Plugin gains a meaningful new hosted MCP capability and MCP-first API routing.

## Main Changes

- Adds `dist/yeeflow-app-builder-plugin/.mcp.json` with the single hosted endpoint `https://api.yeeflow.com/v1/mcp`.
- Declares `mcpServers: "./.mcp.json"` in the Plugin manifest.
- Advertises `Skills`, `Interactive`, and `Write` capabilities.
- Updates `yeeflow-api-operator` to prefer the Plugin-bundled MCP route and use local REST scripts only as a compatibility fallback.
- Preserves explicit confirmation for writes, strong exact-target confirmation for destructive deletes and package operations, and separate API-acceptance/runtime-proof boundaries.
- Adds a focused integration gate that rejects embedded credentials, non-HTTPS endpoints, manifest drift, source/distribution Skill drift, and missing MCP safety guidance.

## Security Boundary

The Plugin contains no OAuth token, authorization header, API key, password, cookie, client secret, tenant identifier, or private tenant URL. OAuth is negotiated by Codex with the hosted MCP server. The Plugin package contains only the public MCP endpoint and declarative tool connection metadata.

## Validation

- Plugin manifest and companion MCP validation: passed
- API Operator source/distribution Skill validation: passed
- MCP integration and credential-absence gate: passed
- Standalone resource release gates: passed, 29 focused cases across four resource types
- Archive integrity and MCP-content inspection: passed
- Packaged syntax and data parsing: passed for 487 JS/MJS files and 539 JSON files
- Plugin structure: passed for 25 bundled Skills
- RC tag `yeeflow-app-builder-plugin-v1.3.0-rc1` pushed and installed from the private `yeeflow` Marketplace: registry/cache checks passed for version `1.3.0`
- First new-task read-only smoke (`019fd0b3-82a1-7551-8a7e-1d11e24ed32e`): 28 MCP tools discovered; GUID, component types, OAuth workspace list, and App Builder application list passed, but a same-named standalone global MCP route made runtime provenance ambiguous
- Standalone global Yeeflow MCP route removed after confirming the Plugin contains the same public endpoint
- Second new-task provenance smoke (`019fd0b7-127b-73f3-9f5e-4134495b8011`): Plugin registry, cache, MCP declaration, credential absence, and no-global-duplicate checks passed; runtime MCP discovery remained blocked because the running Codex process still injected the stale `1.2.0` Skill catalog and reported the Plugin MCP server as not ready
- Fresh-process Skill catalog check: passed with all Plugin Skill paths routed to the installed `1.3.0` cache
- Final explicitly activated Plugin smoke (`019fd2cd-940f-75f1-a4d9-e12dff1b515c`): passed; 28/28 MCP tools carried `Yeeflow App Builder` Plugin provenance, GUID and 11 component-type calls passed, OAuth returned seven workspace titles, and the first accessible workspace returned nine application titles
- RC2 `yeeflow-app-builder-plugin-v1.3.0-rc2` published at commit `11db65434225ec195da49604b8530e14a6a819ba`; repository hygiene was corrected to allow the required Plugin-root `.mcp.json`, and the full local release gates passed
- RC2 reinstall: the remote tag and peeled commit were verified from `origin`; GitHub pack download repeatedly disconnected on the active network, so Codex installed the same exact checkout through the local `yeeflow` Marketplace source and verified the installed cache byte-for-byte against `dist/yeeflow-app-builder-plugin`
- RC2 post-install task (`019fd2df-f605-7e33-8475-d7acea75bfd8`): passed; all 28 tools had Plugin provenance, GUID and 11 component-type calls passed, OAuth returned eight workspaces including one untitled workspace, and the first accessible workspace returned nine application titles

## Known Limitations

- MCP API acceptance does not prove Yeeflow Designer editability, package materialization, installed application runtime behavior, workflow execution, or visible UI correctness.
- The previously configured standalone Yeeflow MCP route was removed to prevent duplicate namespaces; the Plugin-bundled route is now the intended connection.
- `.app.json` managed-connector registration remains a future public/shared connection path and is not included in v1.3.0.

## Release Status

RC2 is committed, pushed, installed, and accepted by the Marketplace smoke gate. After a full Codex restart, the Skill catalog routed to `1.3.0`; explicitly activated new tasks discovered all 28 Plugin-provided MCP tools and passed the stateless, OAuth workspace, and App Builder application read-only calls. The RC2 post-install task reconfirmed those results against an installed cache that was byte-identical to the published RC2 checkout. The release is eligible for the final `yeeflow-app-builder-plugin-v1.3.0` annotated tag. The GitHub clone transport degradation is recorded separately from Plugin correctness. These results prove Plugin loading and the tested MCP read paths, not Designer, materialization, workflow execution, installed-application runtime, or visible UI behavior.
