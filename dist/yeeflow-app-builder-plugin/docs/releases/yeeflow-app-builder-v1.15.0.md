# Yeeflow App Builder 1.15.0

Adds fixed product schema discovery, bounded validation and native workflow adaptation on top of stable 1.14.0 (`566dab69`). The historical main branch is not the release baseline. Existing Custom Code Dashboard support and released Core/execution-service payloads are retained.

The catalog inventories all 289 source files (284 JSON) and projects constraints for 159 priority workflow definitions. These counts describe inventory and validation inputs, not 159 fully supported runtime capabilities. Product source stays outside the plugin; the reviewed commit is fixed at `41bdac08a55204bb033acea54cf3af8d7ca2f740`, with explicit difference review required before upgrades.

Structural checks and bounded semantic adapters cover responsive values, build requirements, dynamic value types, action dispatch, variable references, graph integrity and supported expression subsets. Unsupported context-dependent cases block. The feature-learning skill points to the catalog and its proof boundaries.

The native adapter modifies an existing input label or current-workflow text assignment, preserves unrelated fields and native IDs, and maps verified product text segments to native string segments. In the dedicated authorized validation application, MCP save and exact readback passed; the published Start -> SetVariableTask -> End workflow completed a synthetic submission and persisted the expected assigned text. See [native validation](../standards/product-schema/native-workflow-validation.md).

General product-to-native graph creation, human approval/task pages, control actions/steps and complex expressions have not passed this live batch. No automatic development-branch tracking or new full-coverage claim is introduced.

## Release validation

- Candidate commit `7789cef19af655776858a56699151513eb51aec5` was installed through the private Yeeflow Git Marketplace using `.agents/plugins/marketplace.json` and `dist/yeeflow-app-builder-plugin` sparse paths. No RC tag was created, as requested by the user.
- Installed version: 1.15.0. All 1,820 plugin files matched the candidate distribution byte for byte.
- Codex app-server `skills/list` discovered all 27 installed skills with zero plugin skill errors. This was actual discovery; no model-generated smoke answers were substituted.
- Source and installed Schema/Product suites each passed 96 tests (28 new schema/native-adapter tests plus 68 existing Product 14.5 tests). Installed Dashboard, hosted-MCP integration and relative skill-reference gates passed.
- Package validation parsed 564 JSON files, syntax-checked 524 JavaScript files, checked all 27 skill UI metadata files, and verified archive integrity and byte parity. Source/archive checks covered 71 declared mirrors, including the existing documented Custom Code skill relative-link normalization.
- Fixed snapshot catalog comparison and all six semantic-source hashes matched. The release safety audit reported zero blocking and zero historical findings. No raw upstream source, live tenant resource or synthetic test record was included in the plugin.
- Fixed the distribution check's historical hardcoded version and supplied missing incremental-builder UI metadata.
- Final promotion changes only this release record and scoped proof-status documents, their mirrors and the rebuilt archive/checksum. Tested executable payloads remain unchanged. Local Marketplace configuration returns to the stable ref after promotion.
