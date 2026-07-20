# Phase 10E Selective Data List Sublist Static Scalar Summary Production Routing Proof

## Decision

The route is accepted. Exactly one static summary projection and one Local Runtime lowering occur at `buildDataListFormSubListControl -> normalizeDataListSubListSummaries`, before `ensureDataListSubListSummaryTempVars` scans the completed resource.

`SUBLIST_SCALAR_SUMMARY_INTENT_ADAPTER_ROUTING_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_SOURCE_ROUTING_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_ARCHIVE_ROUTING_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_INSTALLED_ROUTING_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_MATERIALIZER_INTEGRATION_PARITY_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_MATERIALIZER_DETERMINISM_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_TEMP_VARIABLE_NONINTERFERENCE_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_ROUTING_SCOPE_GATES_PASSED`

`SUBLIST_SCALAR_SUMMARY_INTENT_LEGACY_ROLLBACK_PASSED`

## Scope

Only static scalar `total`, `average`, `minimum`, `maximum`, and `count` metadata is routed. The public Core API returns immutable intent; Local Runtime returns fresh `{ field, type, display, binding: null }`. The Legacy materializer continues to own temporary-variable lifecycle, runtime expressions, bindings, template/resource mutation, and package output.

## Evidence

The 12-case actual-materializer corpus passed source, a temporary official ZIP extraction, a simulated installed Plugin, double-run determinism, and a temporary-copy-only Legacy rollback. Complete normalized decoded output, static summary metadata, and the Legacy-created `leaveTotalTemp` value are identical on all parity surfaces.

Core artifacts are unchanged from Phase 10D. The historical ZIP checksum remains `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`. No active installation, release, protected duplicate, or out-of-scope behavior changed.
