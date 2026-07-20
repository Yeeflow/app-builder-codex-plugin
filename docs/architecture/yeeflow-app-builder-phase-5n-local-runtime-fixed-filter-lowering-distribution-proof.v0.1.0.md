# Phase 5N Local Runtime Fixed-Filter Lowering Distribution Proof

## Decision

`LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_VALID`

The approved Local Runtime fixed-filter lowering contract is now available as a
self-contained Plugin-resolvable ESM artifact. This distribution proof does
not promote the internal Data List LayoutView projection, add an adapter route,
or alter production materializer behavior.

## Approved Public Surface

| Surface | Runtime exports |
| --- | --- |
| Compiled Local Runtime source | `capabilityMetadata`, `lowerFixedFilterProjectionAtHost` |
| Public API contract | `capabilityMetadata`, `lowerFixedFilterProjectionAtHost` |
| Distribution contract | `capabilityMetadata`, `lowerFixedFilterProjectionAtHost` |
| Plugin artifact | `capabilityMetadata`, `lowerFixedFilterProjectionAtHost` |

The artifact is located at:

```text
dist/yeeflow-app-builder-plugin/core/
  yeeflow-app-builder-core-local-runtime.v0.1.0.mjs
```

Its SHA-256 is
`c474be829f658b9389ce6c99b5116507f23814831e7b1362b892072edfd66b3f`.

The artifact is self-contained and does not import workspace packages,
TypeScript source, `node_modules`, source maps, repository paths, absolute
paths, or bare packages. It consumes Materializer Core fixed-filter projection
data structurally; it does not import the Materializer artifact at runtime.

## Contract and Mutation Ownership

`lowerFixedFilterProjectionAtHost` consumes immutable Core-shaped fixed-filter
intents, deterministic key requests, immutable findings, a host-supplied
`keysByRequestId` allocation map, and an optional explicit `callerFindings`
target. It returns frozen, JSON-serializable Legacy-shaped filters and lowered
findings.

The only permitted host side effect is appending converted findings in order to
a non-null explicitly supplied `callerFindings` array. No fallback key is ever
allocated. The exact stable errors are:

- `FIXED_FILTER_KEY_ALLOCATION_MISSING`
- `FIXED_FILTER_KEY_ALLOCATION_INVALID`
- `FIXED_FILTER_KEY_ALLOCATION_COLLISION`

## Evidence

The eleven-case fixed-filter parser and host-lowering corpus passed against:

1. compiled Local Runtime and Materializer Core source modules;
2. the official Plugin `dist/core` artifacts;
3. a temporary official-layout ZIP extraction; and
4. a simulated complete installed Plugin layout.

Each surface proved identical filters, findings, ordering, allocation errors,
JSON serialization, frozen returned values, and explicit findings-append
behavior. Generic multi-artifact validation proved exact manifest path,
version, checksum, source/compiled provenance hashes, and export lists.

Negative gates cover missing and unexpected Local Runtime exports, API contract
mismatch, mutation-ownership mismatch, allocation-error mismatch, artifact
checksum/version/path mismatch, missing artifact, workspace/source/
`node_modules`/source-map/bare-import leakage, and generated export mismatch.

## Preserved Boundaries

The Planning artifact checksum remains
`de10000fc92ef0c65bfcc4e30ec7e9c01052bb4166a5bf4e08d86e86e5808ae0`.
The Materializer artifact checksum remains
`defe930672c1bd4c6104a7a696bb6b9f587f84bce14b637fc139fd98a0447855`.

The historical Plugin ZIP remains unchanged at SHA-256
`377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

## Deferred Work

The internal `projectDataListDefaultViewLayoutInternal` shadow remains absent
from every public Core export and every Plugin artifact. Any future LayoutView
public API promotion requires a separate readiness decision, a narrow adapter
export, full default and additional view integration parity, deterministic
decoded-resource proof, source/archive/installed resolution, and a
temporary-copy-only Legacy rollback. None of that work occurred in Phase 5N.

## Phase 5O Follow-Up

Phase 5O revalidated this artifact and its allocation/finding ownership as the
required distributed host companion for the prospective
`projectDataListDefaultViewLayout` API. The LayoutView module remains internal;
there was no public promotion, adapter route, or production behavior change.

## Phase 5P Follow-Up

Phase 5P re-used this unchanged artifact as the installed-Plugin-resolvable
host boundary while promoting the separate Materializer Core projection API.
No Local Runtime export or behavior changed.
