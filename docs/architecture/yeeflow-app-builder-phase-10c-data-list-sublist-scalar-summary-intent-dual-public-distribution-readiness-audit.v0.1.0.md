# Phase 10C Data List Sublist Scalar Summary Intent Dual Public-Distribution Readiness

## Decision

Both prospective public APIs are accepted for a separately authorized promotion proof only.

`SUBLIST_SCALAR_SUMMARY_INTENT_CORE_PUBLIC_API_READINESS_ACCEPTED`

`SUBLIST_SCALAR_SUMMARY_INTENT_LOCAL_RUNTIME_PUBLIC_API_READINESS_ACCEPTED`

`SUBLIST_SCALAR_SUMMARY_INTENT_DUAL_DISTRIBUTION_READINESS_VALID`

No public index, artifact, distribution contract, adapter, Plugin dist file, or production materializer route changed in this audit.

## Core Boundary

`projectDataListSublistScalarSummaryIntent` may accept only immutable static scalar-summary input: an explicit key and reference, the `data-list-sublist` scope, an immutable scalar source-column descriptor, one of `total`, `average`, `minimum`, `maximum`, or `count`, and deterministic display/format intent. It may return only frozen JSON-safe intent, descriptor, and finding DTOs.

It excludes temporary variables, runtime expressions, templates, resources, field records, controls, host context, package state, and mutable host objects. A temporary-variable reference is a fail-closed exclusion, not a fallback trigger.

## Local Runtime Boundary

`lowerDataListSublistScalarSummaryIntentAtHost` may accept immutable Core intent and return a fresh frozen static Legacy-shaped value only:

```json
{ "field": "source-column name", "type": "aggregate operation", "display": true, "binding": null }
```

It cannot allocate, discover, scope-validate, mutate, bind, write back, or serialize temporary variables. It cannot evaluate runtime expressions or bind Rules, controls, templates, resources, or package output. Any non-null `binding` is invalid.

The explicit stable reference and temporary-variable error set remains unchanged from Phase 10A. The 16-case Phase 10B corpus covers all five operations, scalar compatibility, deterministic display/format intent, reference failures, temporary-variable and runtime-expression exclusions, and excluded Lookup, identity, and binary shapes.

## Required Future Proof

Phase 10D must promote exactly these two APIs through the official builder and prove source, Plugin dist, temporary official ZIP extraction, and simulated installed Plugin parity. It must prove exact export/contract/manifest/checksum alignment, serialization, deep immutability, leakage gates, and a temporary-copy-only Legacy rollback.

Phase 10E may then be considered separately for static scalar-summary routing only. It must prove actual-materializer source/ZIP/installed parity, binding-null-only output, double-run determinism, scope gates, and rollback. Temporary-variable lifecycle, runtime evaluation, bindings, mutation, nested controls, Lookup, identity/binary fields, actions, graph/template mutation, and package output remain outside that future route.

## Baseline

The production materializer remains SHA-256 `dc3d01979ca4532dde039bfb9e68b89add85b9227cec98e4f153166c09e80761`. The Materializer Core and Local Runtime artifacts remain `d598a1c66a1b2f34de4bc4ac3f2d901a7d835c391ef9366c175d2906035ed7ad` and `1b7725b863a6acabc8cfdccef71a63db660e8479fb5d12cf70109e1289d6b2e5`. The protected historical ZIP remains `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.
