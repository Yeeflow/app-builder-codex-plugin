# Phase 7C Type 1 Identity-Control Dual Public-Distribution Readiness

## Decision

`DATA_LIST_TYPE1_IDENTITY_CONTROL_PLACEMENT_DUAL_DISTRIBUTION_READINESS_VALID`

Both internal boundaries are ready for a future coordinated public promotion. This audit does not promote either API.

## Prospective Materializer Core API

`projectDataListType1IdentityControlPlacement` may expose only immutable JSON-safe placement input, descriptor, intent, finding, and result DTOs. It excludes a control ID, mutable template object, host context, Legacy control fragment, runtime expression, resource record, and package state.

## Prospective Local Runtime API

`lowerDataListType1IdentityControlPlacementAtHost` may accept immutable Core intent, an explicit template snapshot, and a host-supplied control ID. It owns all five template-reference errors and returns a fresh fragment without allocating a control identity or mutating the snapshot.

## Phase 7D Promotion Proof

Phase 7D must promote exactly these two APIs through the official builder and prove the unchanged 21-case corpus in compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts. It must verify public export, manifest, checksum, path, version, serialization, immutability, and leakage parity while preserving existing exports.

## Phase 7E Routing Proof

Phase 7E may add thin adapters and route only Data List Type 1 view/workbench non-sublist identity, user, people, and person controls. The host must continue to load templates, supply control IDs, insert controls, and integrate final resources. It requires actual-materializer source, ZIP, and installed parity; determinism; strict scope gates; and temporary-copy-only Legacy rollback.

## Closure-Proof Lineage

The Phase 5 closure baseline remains immutable. The versioned lineage record seals the exact approved Phase 6E Lookup source transition, its routing-proof manifest hash, and the current three-artifact state. Any undocumented source or artifact change, missing baseline, or lineage tampering fails deterministically without a broad path exception.

## Non-Goals

No public index, distribution contract, artifact, Plugin dist, adapter, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, or release state changed.
