# 1.16.1 installation verification

Date: 2026-09-14

- Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Ref tested before final promotion: `codex/release-1.16.1`, commit `08bbc86e52384a2ae04c3e4f3fd023c999dc74cc`.
- Sparse paths: `.agents/plugins/marketplace.json`, `dist/yeeflow-app-builder-plugin`.
- Marketplace: `yeeflow` (Yeeflow); plugin: `yeeflow-app-builder` (Yeeflow App Builder).
- Installed by the supported Codex Marketplace CLI. Returned version: **1.16.1**.
- Installed payload: **1,859 files, 27 skills**, complete byte parity with the release distribution and ZIP.
- Installed-cache synthetic field/schema/workflow validator regression: passed from a temporary working directory.
- Installed-cache skill-reference gates: passed, 27 skills / 10 focused reference assertions.
- Installed-cache hosted MCP configuration audit: passed, four HTTP services, server-negotiated OAuth, no embedded credentials. This is configuration proof, not a new live tool call.
- Archive SHA-256: `0474ef3ccce12ae8d1b1b82a7481f9a0cf3f2e4c5801331d16dff96e6cf212ee`.
- Source validation: dual host archives, payload parity, invalid App mapping rejection, TypeScript compilation, 545 JS and 565 JSON syntax checks, release safety scan (zero blockers), and GitHub CI archive verification all passed.

The user requested direct publication and local update; installation was tested on the release branch before final tagging. No RC publication or new OAuth grant was needed. The earlier private ChatGPT Web Review run verified representative hosted skills, shared references, script execution and read-only connectivity. This patch does not claim all skills or write tools have been exercised, public ChatGPT marketplace approval, or production Designer acceptance.

Stable-source refresh and final remote ref readback are performed after promotion; the payload is unchanged by this installation-evidence document.
