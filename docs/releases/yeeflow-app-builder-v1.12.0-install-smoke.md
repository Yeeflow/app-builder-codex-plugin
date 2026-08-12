# Yeeflow App Builder v1.12.0 RC1 Install Smoke

- RC tag: `yeeflow-app-builder-plugin-v1.12.0-rc1`
- Marketplace source: Yeeflow private Git Marketplace, sparse paths `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`
- Plugin: `yeeflow-app-builder@yeeflow`, version `1.12.0`
- Installed cache: local v1.12.0 cache confirmed with the Knowledge Source Operator Skill and binding validator present.
- Smoke checks passed:
  - `scripts/test-knowledge-source-bindings.mjs`
  - `scripts/test-plugin-mcp-integration.mjs`
  - manifest version and four scoped hosted MCP server metadata
- Scope: this proves private Marketplace installation and bundled configuration/test discovery. It does not prove active-task tool injection, Designer UI behavior, or live Knowledge retrieval quality.

The final v1.12.0 tag may be created after the stable branch contains this RC-tested release.
