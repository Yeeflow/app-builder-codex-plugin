# Yeeflow App Builder 1.16.1

Patch release from stable 1.16.0 for host packaging and validator compatibility.

- Codex retains all four direct hosted MCP services. ChatGPT Web builds use four explicit registered App mappings, validated for service coverage, ID grammar and uniqueness, with direct MCP autodiscovery removed.
- All 27 skills and shared resources remain bundled. Skill guidance distinguishes skill-local resource readers from plugin-root shared files and resolves the active host mount without hardcoded developer paths.
- Application validator entrypoints now resolve the canonical validator and its shared dependencies from source or installed layouts, including invocation from temporary working directories.
- Marketplace folders and archives receive the same shared repairs. CI builds/extracts both host profiles, checks payload parity and invalid mappings, and runs field/schema/workflow positive and negative fixtures.

Private Web Review compatibility testing previously verified installation, skill and reference reads, script launch, synthetic regression, and a read-only workspace call. This does not claim exhaustive testing of every skill/tool, remote writes, production Designer rendering or public ChatGPT marketplace approval. Registered App IDs are deployment inputs, not embedded review-tenant defaults.

See [host build profiles](../standards/plugin-host-build-profiles.md). Installation verification is recorded separately before stable promotion.
