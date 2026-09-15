# Yeeflow 1.16.3

Based on 1.16.2. Migrates four MCP registrations to yeeflow_mcp at https://api.yeeflow.com/v1/mcp. Keeps the technical plugin ID, official branding, all 27 Skills and domain permission rules. Web builds now require one actual unified App mapping and reject the retired four-App layout.

## Validation

- Authenticated unified MCP initialize/tools discovery succeeded: 106 tools.
- Compared against the retained four-service inventory (30 App Builder, 34 Operations, 31 Admin, 11 Service Portal): no missing or additional tool names and no inputSchema, outputSchema or annotation changes. All tools declare readOnlyHint, destructiveHint and openWorldHint. This comparison used metadata only.
- Source/distribution MCP integration, unified-reference audit, incremental capability registry, operation/ledger regressions, relative skill references and installed-layout schema/workflow entrypoint tests passed.
- Codex/Web archive tests passed: 27 skills in each, shared payload byte parity, one unified App mapping and rejection of legacy four-App mappings.
- Review-account smoke passed after fresh OAuth: expected non-system-admin identity, one workspace, synthetic business record read (unchanged RowVersion 3), CRM administrator component list (20), departments read (2 including root), and Visitor structure access rejected (generic isError, not an explicit 403). No business writes were performed.
- Candidate installed through the Codex plugin installer. All 1,863 installed files matched the release payload byte-for-byte. Installed-cache MCP integration, unified-reference and schema/workflow entrypoint checks passed.
- Service Portal metadata coverage matches the prior service; no dedicated review Portal fixture exists, so live Portal operations are not claimed as verified. ChatGPT Cloud must register/rebind its unified App separately; Codex OAuth and old Cloud proof do not migrate that workspace registration automatically.
- No public OpenAI review submission is authorized by this release.
