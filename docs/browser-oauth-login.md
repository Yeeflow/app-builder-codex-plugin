# Hosted Yeeflow authentication

The public Yeeflow plugin connects to the single hosted MCP server at `https://api.yeeflow.com/v1/mcp`. The host manages the OAuth authorization flow and credential storage. App Builder, Operations, Admin, and Service Portal are capability domains of this connection, not separate logins.

Before a live operation, use the host-exposed MCP connection and verify the current Yeeflow account and tenant when identity matters. If authorization is missing or expired, reconnect through the host's plugin flow, then resume the requested operation. Do not use local OAuth scripts, direct REST calls, API keys, client secrets, copied tokens, or a different account as a fallback.

The connected account's tenant, application role, resource permissions, and workflow state remain authoritative. A successful OAuth connection does not grant application-administrator or organization-administrator access. Keep readback, pagination, mutation confirmation, and data minimization requirements for each operation.

Never ask a user to paste passwords, OAuth codes, tokens, cookies, authorization headers, or secrets into chat or a package. Do not print or store raw credentials in generated artifacts.

Older local `yeeflow-oauth-*` helpers and API-key environment variables in historical tests are retained only for legacy evidence and are not the public plugin authentication path. This document supersedes prior local browser-login instructions for the public plugin.
