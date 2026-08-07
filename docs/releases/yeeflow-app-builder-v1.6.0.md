# Yeeflow App Builder v1.6.0

## Summary

This release candidate corrects the MCP Application bootstrap contract found during a real Procurement Request Management application create. The observed MCP route rejected Application create without a caller ID and accepted the same request with an ID issued by `utils_generate_ids`.

## Bootstrap Contract

- Default to `mcp-generated-before-create`: bind exactly one numeric ID issued by live `mcp.utils_generate_ids` to the planned Application create.
- Allow `server-allocated-on-create` only after current runtime contract discovery explicitly proves it; it is not a retry fallback.
- Require a valid FontAwesome `IconUrl` JSON object with `b`, `i`, and `c`. Procurement uses `{"b":"#0F766E","i":"fa-solid fa-cart-shopping","c":"#FFFFFF"}` as a valid example.
- Omit `Themes` until the accepted live create shape and a non-destructive Application update/correction path have been verified.
- After save, compare exact persisted ID, workspace, title, icon, and theme state before unblocking dependent resources.

## Application Upsert Contract

The observed workspace Application endpoint creates with a new ID and non-destructively updates an existing Application with its existing ID. The Plugin now records this as “Creates or non-destructively updates an App Builder application. An existing ID updates that application.”

- An update first reads and binds the exact existing application/workspace; it never allocates a replacement ID.
- The update ledger declares only intended fields and preserves `ID`, `WorkspaceID`, and Title unless Title is intended.
- `replaceMissing` must be `false`; delete or replacement semantics are rejected.
- Every write requires exact-target explicit confirmation followed by `appbuilder_application_get` persisted readback. API acceptance and persisted-readback verification remain separate.

## Validation Scope

The release adds local ledger and operation-planner regressions for both permitted identity strategies, invalid provenance, invalid icon values, and source/distribution skill parity. These checks prove only static validation and planning behavior. They do not prove a tenant create, persisted application state, Designer rendering, or runtime behavior.

## Private Marketplace Install Smoke

- Accepted RC tag: `yeeflow-app-builder-plugin-v1.6.0-rc1`
- RC commit: `e6329ca7f9ca832c57a366a53cc2aa5607a0a166`
- RC archive SHA-256: `31e8c5ece521a510f12d29330f555863af149563761add5a388dbaf040c9fc6a`
- Source: `https://github.com/Yeeflow/app-builder-codex-plugin.git`
- Sparse paths: `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`
- Install result: version `1.6.0` installed and enabled in an isolated temporary `CODEX_HOME`.
- Provenance result: the Marketplace checkout resolved to the RC commit and the installed versioned cache was byte-identical to the exact RC Plugin payload.
- Installed tests: MCP integration, incremental build ledger, incremental operation planner, capability registry, and Skill relative-reference gates passed from the installed cache.
- Hosted MCP configuration: the installed Plugin exposes `yeeflow_app_builder_mcp` at `https://api.yeeflow.com/v1/mcp`, uses server-negotiated OAuth, and contains no embedded credentials.
- Tenant behavior: no authenticated tenant read or write was performed by this smoke.

## Release Status

RC1 passed the local release gates, tracked-payload archive integrity, exact-tag Marketplace installation, installed-cache byte parity, and installed-cache regressions. It is accepted for the final `yeeflow-app-builder-plugin-v1.6.0` tag and stable promotion. This acceptance proves packaging and the tested static bootstrap/upsert contract; it does not prove application creation, resource persistence, Designer behavior, or runtime behavior in a tenant.
