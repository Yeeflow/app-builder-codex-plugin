# Phase 6D Data List Lookup-Resolution Dual Public API and Distribution Promotion

## Decision

`DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_VALID`

The only promoted APIs are `projectDataListLookupResolutionIntent` from Materializer Core and `lowerDataListLookupResolutionAtHost` from Local Runtime. This is a distribution promotion only; no adapter, Legacy materializer call, or production route changed.

## Public Boundaries

Materializer Core returns frozen JSON-serializable Lookup intent, deterministic candidate-key requests, and findings. It has no target ListID, target map, host context, Legacy Rules payload, mutable resource, or host effect. Local Runtime accepts the explicit Core intent, readonly target maps, and source relationship context, validates the six stable errors, and produces only a fresh `Rules.listid` result. It has no fallback discovery or ID allocation.

## Artifacts

- `core/yeeflow-app-builder-core-materializer.v0.1.0.mjs`: `7c160fce6cad230fa7725281e4af08329b0fcf83628851dcb2695a037907ce50`
- `core/yeeflow-app-builder-core-local-runtime.v0.1.0.mjs`: `f543427203dff9bb7f0ff841abf585cade8545a7cc1e4372b19d183920edd018`

## Four-Surface Evidence

The unchanged fifteen-case Lookup corpus passed compiled source, Plugin dist, temporary official ZIP extraction, and a simulated installed Plugin. It verifies export lists, success and error behavior, findings order, JSON serialization, frozen outputs, and lossless 19-digit target ListIDs. Eight negative gates reject export drift, public-shape leakage, omitted errors, internal export leakage, checksum drift, and workspace import leakage.

## Phase 6E Readiness

Phase 6E selective Lookup routing is accepted as a future, separately authorized proof. It must remain Data List Lookup-only in the audited `buildFieldRecord` boundary, retain host target-map ownership and final resource integration, demonstrate actual-materializer source/ZIP/installed parity and determinism, reject non-Lookup scope, and prove a temporary-copy-only Legacy rollback.

## Non-Goals

No Legacy materializer source, compatibility adapter, production routing, active installation, historical ZIP, protected duplicate, Git publication, or release action changed.
