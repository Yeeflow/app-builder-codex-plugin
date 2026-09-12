# 1.15.3 private Marketplace installation evidence

Date: 2026-09-12

- Source: https://github.com/Yeeflow/app-builder-codex-plugin.git
- Ref: yeeflow-app-builder-plugin-v1.15.3-rc1 (74609d91)
- Sparse paths: .agents/plugins and dist/yeeflow-app-builder-plugin
- Marketplace: yeeflow; plugin: yeeflow-app-builder
- Official Codex plugin installer returned version 1.15.3.
- Source distribution to installed payload parity: 1,829 files, all byte-identical.
- Installed skill discovery: 27 skills; relative-reference checks passed.
- Installed workflow publish-readiness suite passed, including Completed-only Complete tasks and missing/incorrect outcome failures.
- MCP configuration integration passed for four hosted HTTP services without embedded credentials. This is configuration proof, not fresh-session OAuth/tool invocation proof.
- Source typecheck passed after installing locked workspace dependencies.
- Source workflow/layout regression, archive integrity, extracted product-schema tests, JSON/JS syntax and release safety checks passed.
- Official icon bytes were preserved; no UI icon repaint or tenant-runtime claim is made.

Archive SHA-256: `0aef34526349d8ddfd1f963834ef6606f5aa038304f63d3bb7ca4c05c9f6dbf0`

Final promotion is authorized by the release request and follows this successful installation smoke. The final documentation commit does not alter the tested plugin payload.
