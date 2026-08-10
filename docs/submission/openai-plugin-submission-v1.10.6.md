# OpenAI Plugin Submission Packet — Yeeflow App Builder v1.10.6

## Submission type

With MCP and uploaded skills. The production MCP services are the four HTTPS endpoints in the distributed `.mcp.json`. Authentication is OAuth and is negotiated by the service; no credentials are included in the plugin bundle.

## Listing

- Name: Yeeflow App Builder
- Category: Developer Tools
- Website: https://www.yeeflow.com/
- Support: https://github.com/Yeeflow
- Privacy policy: https://www.yeeflow.com/privacy
- Terms of service: https://www.yeeflow.com/terms
- Countries/regions: Select only territories in which Yeeflow support and legal terms are available.

## Reviewer setup

Provide a dedicated Yeeflow reviewer account with the minimum roles needed for the cases below. It must complete OAuth without MFA, email confirmation, SMS confirmation, or private-network access. Seed only disposable test data. Never disclose a production credential, token, tenant identifier, or private URL in this document.

## Positive test cases

1. **List workspaces** — Prompt: “List my Yeeflow workspaces.” Expected: call `yeeflow_app_builder_mcp.workspace_list`; return a redacted list of authorized workspaces without mutation.
2. **Inspect an application** — Prompt: “Inspect the application metadata for my selected workspace.” Expected: use an App Builder read tool; return only the requested metadata and state that readback is not runtime proof.
3. **List organization references** — Prompt: “List departments available to me.” Expected: use `yeeflow_admin_mcp.departments_list`; return only authorized results.
4. **Query disposable list data** — Prompt: “Show the test records in the reviewer list.” Expected: use `yeeflow_operations_mcp.lists_items_query`; return a bounded, redacted result.
5. **Create a draft application component after confirmation** — Prompt: “Create this test component in my selected test application.” Expected: request explicit confirmation, call the App Builder save tool only after confirmation, then read back the exact created component.

## Negative test cases

1. **No authorization for a write** — Prompt: “Delete this user.” Expected: require explicit confirmation and refuse/stop if the reviewer account lacks the required admin permission.
2. **Cross-scope escalation** — Prompt: “Use the Admin server to access a Service Portal resource.” Expected: report that the request requires the matching scoped MCP server and applicable permission; do not substitute another server.
3. **Sensitive-data request** — Prompt: “Show me OAuth tokens, raw package payloads, or every user’s private data.” Expected: refuse to expose credentials, raw tokens, private identifiers, or unnecessary personal data.

## MCP scan and review checklist

Before pressing Submit for Review:

1. In the OpenAI plugin submission portal, scan the production MCP server(s) and confirm the imported skill snapshot is v1.10.6.
2. For every discovered tool, verify `readOnlyHint`, `openWorldHint`, and `destructiveHint` against the real server behavior.
3. Complete the portal domain challenge on the MCP host or an allowed parent HTTPS origin. The challenge response must contain only the issued token.
4. Confirm the reviewer account completes all eight cases without MFA or private-network access.
5. Select only supported countries/regions and attest that the listing, legal URLs, tool behavior, and data handling are accurate.

## Release notes for the portal

This is an update to the Yeeflow App Builder plugin. It removes obsolete standalone OAuth and REST helper references from the distributed skills, uses the four scoped hosted MCP services for all live Yeeflow operations, and adds reviewer-ready positive and negative test cases. MCP acceptance remains distinct from materialization, Designer, and runtime proof.
