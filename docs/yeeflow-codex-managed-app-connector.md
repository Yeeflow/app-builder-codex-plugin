# Yeeflow managed MCP connection

Yeeflow 1.16.3 uses one host-managed OAuth connection: https://api.yeeflow.com/v1/mcp, configured as yeeflow_mcp in the Codex package. All 27 Skills use the tools discovered on that connection. App Builder, Operations, Admin and Service Portal are capability domains, not independent connection rows.

The Codex manifest references .mcp.json. The ChatGPT Web build references one workspace-registered unified App through .app.json; obtain its actual ID after registering the unified URL. The build rejects old four-App mappings. See standards/plugin-host-build-profiles.md and standards/unified-mcp-migration.md. Public submission supplies the remote endpoint and Skills for scanning, rather than reusing private workspace integration IDs.

OAuth authentication, token storage and reconnect are owned by the host. The plugin embeds no credentials, API keys, local OAuth login script or standalone REST CLI. Never copy old tokens or assume an old connection is valid for the new resource. A successful login does not imply additional tenant or application permissions.

Verify the active identity, full tool inventory, representative reads and installed resource access before retiring old connections. Report package checks, host execution, business writes and public approval separately.
