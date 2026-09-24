# Yeeflow 1.16.4

Based on the official 1.16.3 release. This patch prepares a single layout-preserving OpenAI Skills bundle instead of flattened individual Skill ZIPs, retaining shared `docs/`, `scripts/`, `schemas/`, `tools/`, and `core/` resources alongside all 27 Skills. The hosted unified MCP remains configured through the OpenAI submission flow.

The public authentication guide now directs use of host-managed OAuth for `https://api.yeeflow.com/v1/mcp`. The Business Travel repair utility requires an explicit source package and no longer writes to a developer-specific Downloads location by default. The YAPK regression script no longer assumes a developer-specific fixture path and resolves schema and validators from its own package root.

## Validation and release scope

- Official v1.16.3 tag and installed cache matched for all 1,863 release files; only a local `.DS_Store` was extra.
- The 27 historical local standalone ZIPs were recovered. The Dashboard archive lacks required shared resources and its isolated test fails with ENOENT.
- The corrected 1.16.4 candidate contains 27 Skills plus the shared resource tree. Local archive structure, integrity and source-byte checks passed; 17 representative synthetic script tests passed after isolated extraction and from an unrelated working directory.
- RC2 was installed through a temporary private Codex marketplace. All 27 Skills were visible, 1,864 installed files matched the source byte-for-byte, and the 17 synthetic tests passed from the installed cache. The temporary smoke install was removed without replacing the official 1.16.3 plugin.
- After OAuth reauthorization and a host restart, the unified MCP returned `openai-review@yeeflow.com` with `IsAdmin=false`. Read-only calls succeeded for the dedicated tenant, a Supplier Management synthetic record, Projects Center business data, CRM application structure and departments. Supplier Management and Projects Center structure calls returned generic errors consistent with the configured lower-role boundary; the errors did not provide an explicit authorization code. These calls exercised the live service through the installed 1.16.3 connection, not RC2 Skill execution.
- OpenAI portal ingestion and security scan, ChatGPT/Codex Cloud execution of this candidate, and public-content editorial review remain pending. The OpenAI 1.16.3 submission is still under review and was not modified. Codex release validation does not establish OpenAI review acceptance.

The private Codex installation smoke gate has passed for RC2. A final Codex release tag can follow completed release checks; it must not be described as public OpenAI acceptance.
