# Yeeflow App Builder 1.15.0

Adds fixed product schema discovery, bounded validation and native workflow adaptation on top of stable 1.14.0 (`566dab69`). The historical main branch is not the release baseline. Existing Custom Code Dashboard support and released Core/execution-service payloads are retained.

The catalog inventories all 289 source files (284 JSON) and projects constraints for 159 priority workflow definitions. These counts describe inventory and validation inputs, not 159 fully supported runtime capabilities. Product source stays outside the plugin; the reviewed commit is fixed at `41bdac08a55204bb033acea54cf3af8d7ca2f740`, with explicit difference review required before upgrades.

Structural checks and bounded semantic adapters cover responsive values, build requirements, dynamic value types, action dispatch, variable references, graph integrity and supported expression subsets. Unsupported context-dependent cases block. The feature-learning skill points to the catalog and its proof boundaries.

The native adapter modifies an existing input label or current-workflow text assignment, preserves unrelated fields and native IDs, and maps verified product text segments to native string segments. In the dedicated authorized validation application, MCP save and exact readback passed; the published Start -> SetVariableTask -> End workflow completed a synthetic submission and persisted the expected assigned text. See [native validation](../standards/product-schema/native-workflow-validation.md).

General product-to-native graph creation, human approval/task pages, control actions/steps and complex expressions have not passed this live batch. No automatic development-branch tracking or new full-coverage claim is introduced.

## Release validation

Candidate validation and Marketplace installation results will be recorded before stable promotion. The user requested a direct final release without RC tags; the installation gate remains required.
