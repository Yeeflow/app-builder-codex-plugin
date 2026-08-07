# Yeeflow App Builder v1.6.0

## Summary

This release candidate corrects the MCP Application bootstrap contract found during a real Procurement Request Management application create. The observed MCP route rejected Application create without a caller ID and accepted the same request with an ID issued by `utils_generate_ids`.

## Bootstrap Contract

- Default to `mcp-generated-before-create`: bind exactly one numeric ID issued by live `mcp.utils_generate_ids` to the planned Application create.
- Allow `server-allocated-on-create` only after current runtime contract discovery explicitly proves it; it is not a retry fallback.
- Require a valid FontAwesome `IconUrl` JSON object with `b`, `i`, and `c`. Procurement uses `{"b":"#0F766E","i":"fa-solid fa-cart-shopping","c":"#FFFFFF"}` as a valid example.
- Omit `Themes` until the accepted live create shape and a non-destructive Application update/correction path have been verified.
- After save, compare exact persisted ID, workspace, title, icon, and theme state before unblocking dependent resources.

## Validation Scope

The release adds local ledger and operation-planner regressions for both permitted identity strategies, invalid provenance, invalid icon values, and source/distribution skill parity. These checks prove only static validation and planning behavior. They do not prove a tenant create, persisted application state, Designer rendering, or runtime behavior.

## Release Status

Not yet release-candidate accepted. Final packaging, Marketplace install smoke, fresh-task MCP discovery/readback, tag, and stable promotion must run only after the repository hygiene gate passes.
