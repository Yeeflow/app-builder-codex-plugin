# Unified MCP migration — 1.16.3

The production endpoint is https://api.yeeflow.com/v1/mcp, registered as yeeflow_mcp in Codex. It replaces the previous four configured servers; their domain tools remain subject to their original permissions. All 27 Skills and shared resources remain bundled.

## Web mapping

Register and authorize the unified endpoint, then pass {"apps":{"yeeflow":{"id":"<actual registered App ID>"}}} to the Web archive builder. Never reuse an old scoped App ID or ship a fixture ID. Confirm the target App URL in ChatGPT; ID syntax alone cannot prove the binding. Retire the old connections after the replacement is installed and its reads pass. Public submission uses the unified remote HTTPS server plus the complete skill bundle, not private workspace App IDs.

## Verification

Compare authenticated tools/list inventories by exact name, input schema and annotations. Record missing/changed tools; do not assume counts alone prove equivalence. Check OAuth and current identity, then representative read operations in all available domains. Explicitly record unavailable test fixtures. A transport change does not grant Editor/Visitor users structure-editing or organization-administration permissions. Do not perform destructive calls just to exercise every tool.

Check archive extraction, every skill/resource dependency, shared payload parity, one connection, no legacy auto-discovery, installed cache and host tool registration. Old release notes and audit evidence are historical, not current connection instructions. New endpoint validation does not inherit the previous four connections' Cloud proof.
