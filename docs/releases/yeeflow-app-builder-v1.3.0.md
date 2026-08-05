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
- Private Marketplace install smoke: pending RC installation

## Known Limitations

- MCP API acceptance does not prove Yeeflow Designer editability, package materialization, installed application runtime behavior, workflow execution, or visible UI correctness.
- A separately configured standalone Yeeflow MCP may produce duplicate tool namespaces after the Plugin-bundled MCP is installed; do not use both routes for writes.
- `.app.json` managed-connector registration remains a future public/shared connection path and is not included in v1.3.0.

## Release Status

Release candidate ready for private Marketplace install smoke. The final `yeeflow-app-builder-plugin-v1.3.0` tag must not be created until the RC installation, discovery, OAuth, and read-only MCP smoke tests pass and are recorded.
