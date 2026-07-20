# Phase 6C Data List Lookup-Resolution Dual Public-Distribution Readiness

## Decision

`DATA_LIST_LOOKUP_RESOLUTION_DUAL_DISTRIBUTION_READINESS_VALID`

Both prospective APIs are safe for a future coordinated public promotion. This audit did not promote either one.

## Prospective Materializer Core API

`projectDataListLookupResolutionIntent` may expose only frozen JSON-serializable Lookup intent, deterministic candidate-key request, and finding DTOs. It must not expose a ListID, FieldID, target ListID, target map, host context, Legacy Rules string, Legacy field record, mutable template, caller findings array, generated resource, or runtime state.

## Prospective Local Runtime API

`lowerDataListLookupResolutionAtHost` may receive only the immutable Core intent plus explicit readonly target-map and source relationship context. It owns validation and fresh Rules lowering for all six stable errors. It must not allocate IDs, discover fallback targets, perform API lookup, mutate templates/resources, or use a Legacy fallback.

## Phase 6D Promotion Proof

Phase 6D must promote the two APIs together only through the official builder, then prove the fifteen-case corpus and exact export, manifest, path, version, checksum, and leakage parity in compiled source, Plugin dist, temporary official ZIP, and simulated installed Plugin layouts.

## Phase 6E Routing Proof

A later Phase 6E may add thin adapters and route Data List Lookup fields only in the audited `buildFieldRecord` boundary. It requires actual-materializer source, ZIP, and installed parity; deterministic output; all six error gates; lossless 19-digit ID checks; strict non-Lookup scope gates; and temporary-copy-only Legacy rollback.

## Non-Goals

No public package index, distribution contract, artifact, adapter, Plugin dist, Legacy materializer, production route, active installation, historical ZIP, protected duplicate, or release state changed.
