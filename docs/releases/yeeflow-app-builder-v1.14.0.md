# Yeeflow App Builder 1.14.0

Adds `dashboard-page-layouts-custom-code` as a first-class Dashboard golden reference for explicitly requested Custom Code pages and complex screenshot-driven business dashboards. Existing default template selection is preserved.

Functional Specification to App Plan and standalone Dashboard plans now carry template selection, optional sections, responsive panels, functional modules, filters, temporary-variable exchanges and native Button/Form Action dependencies into generation. Two-column desktop ratios are 1fr / 2.5fr or 2.5fr / 1fr. Unused sections and module grids can be removed; empty placeholder-only output is rejected.

The normalized export removes stale business labels and unused filter records while retaining the supplied responsive structure. Source, distribution and installed-package checks cover plan routing, full-app generation, standalone wrapping, module cloning, native filter layouts and negative cases.

Release baseline: stable 1.13.1 (`b747163f`); the older main branch is not the baseline. Released Core and execution-service payloads are retained through the tracked-only archive build.

Proof boundary: export-backed structure and offline generation validation. Tenant import, Designer rendering and interactive business/data round trips have not been verified by this release.

## Marketplace installation verification

- Candidate commit: `908713d7`, tag `yeeflow-app-builder-plugin-v1.14.0-rc1`.
- Installed through Codex Marketplace from the private Yeeflow Git source with `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin` sparse paths.
- Installed version 1.14.0; all 1,800 distribution files matched the installed cache byte for byte.
- Codex app-server `skills/list` discovered all 27 installed skills with no plugin skill errors; no model calls were used.
- Installed Custom Code Dashboard, standalone YDP, Product 14.5, MCP integration and skill-reference gates passed.
- Source typecheck and seven focused/regression suites passed. Package checks parsed 558 JSON files, checked 495 JavaScript files, verified ZIP integrity and extracted-package tests. Release safety audit: zero blocking findings and zero historical findings.
- Final promotion changes only this release record and its mirror; tested executable payload is unchanged.
