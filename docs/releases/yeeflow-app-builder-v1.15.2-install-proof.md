# 1.15.2 release and installation proof

Candidate `435f4895d84ec511c8955c9a63cb67720ed0c337` was installed from the private Yeeflow Git Marketplace, branch `codex/release-1.15.2`, with sparse paths `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin`. No RC tag was used.

- Installed manifest: 1.15.2. All 1,828 files matched the distribution byte for byte with no additional files.
- Codex app-server discovered 27 plugin skills with zero plugin skill errors.
- Source and distribution focused schema, loop, list-expression, product-contract, workflow materialization, publish-readiness, Set Variable, MCP, skill-reference and approval-layout checks passed. The Set Variable suite passed 48 checks after its missing layout declarations were mirrored.
- Installed schema, Designer readback, list-variable, product-contract, Set Variable, MCP and skill-reference suites passed.
- Typecheck and 21 workspace skeleton checks passed; 530 JavaScript files passed syntax checking. JSON parsing, archive integrity, extracted product-module checks and 71 product distribution mirrors passed. The archive contains 1,828 files.
- Release safety scan reported zero blocking findings and zero historical findings.

This record adds no executable or distribution changes to the install-tested candidate. Final tag/stable promotion follows the successful installation. The Marketplace is restored to stable afterward. No additional tenant-runtime acceptance is claimed beyond the bounded tests described in the release notes.
