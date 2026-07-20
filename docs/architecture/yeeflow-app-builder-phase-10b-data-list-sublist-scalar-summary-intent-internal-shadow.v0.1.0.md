# Phase 10B Data List Sublist Scalar Summary Intent Internal Shadow

## Decision

The internal-only scalar summary intent shadow passed. The exact Legacy parity boundary is `normalizePlannedSubListSummary`: one direct invocation plus one JSON-array callback invocation. Its approved static outputs are matched for total, average, minimum, maximum, and count.

The test-only host lowerer is required to compare the Core intent with fresh Legacy-shaped static summary metadata. It returns only `{ field, type, display, binding: null }`; it does not allocate, discover, bind, or mutate temporary variables.

## Boundaries

Core accepts an explicit summary key/reference and scalar source column semantics. It returns frozen JSON-safe intent, descriptor, and findings. Temporary-variable references, runtime expressions, non-scalar source types, and invalid references fail closed. No public distribution readiness is accepted in this phase; Phase 10C requires a separately authorized public-distribution readiness audit.

No production materializer, adapter, public API, distribution contract, artifact, Plugin dist, active installation, historical ZIP, protected duplicate, Git, or release state changed.

`SUBLIST_SCALAR_SUMMARY_INTENT_CORE_SHADOW_IMPLEMENTED`

`SUBLIST_SCALAR_SUMMARY_INTENT_HOST_LOWERING_SHADOW_IMPLEMENTED`

`SUBLIST_SCALAR_SUMMARY_INTENT_DIFFERENTIAL_PARITY_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_SERIALIZATION_PARITY_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_CORE_IMMUTABILITY_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_DETERMINISM_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_REFERENCE_VALIDATION_GATES_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_TEMP_VARIABLE_EXCLUSION_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_LEGACY_UNCHANGED`
