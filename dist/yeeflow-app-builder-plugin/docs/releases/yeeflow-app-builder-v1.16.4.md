# Yeeflow 1.16.4 release candidate

Based on the official 1.16.3 release. This patch prepares a single layout-preserving OpenAI Skills bundle instead of flattened individual Skill ZIPs, retaining shared `docs/`, `scripts/`, `schemas/`, `tools/`, and `core/` resources alongside all 27 Skills. The hosted unified MCP remains configured through the OpenAI submission flow.

The public authentication guide now directs use of host-managed OAuth for `https://api.yeeflow.com/v1/mcp`. The Business Travel repair utility requires an explicit source package and no longer writes to a developer-specific Downloads location by default. The YAPK regression script no longer assumes a developer-specific fixture path and resolves schema and validators from its own package root.

## Evidence before release

- Official v1.16.3 tag and installed cache matched for all 1,863 release files; only a local `.DS_Store` was extra.
- The 27 historical local standalone ZIPs were recovered. The Dashboard archive lacks required shared resources and its isolated test fails with ENOENT.
- The corrected 1.16.4 candidate contains 27 Skills plus the shared resource tree. Local archive structure, integrity and source-byte checks passed; 17 representative synthetic script tests passed after isolated extraction.
- Portal ingestion, OpenAI security scan, ChatGPT/Codex Cloud execution, and live Yeeflow permission tests for this candidate remain pending. Version 1.16.3 is still in OpenAI review and was not modified.

Do not create a final release tag or claim public acceptance until private install smoke and future-draft review evidence are complete.
