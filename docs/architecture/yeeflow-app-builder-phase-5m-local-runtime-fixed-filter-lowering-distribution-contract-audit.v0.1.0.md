# Phase 5M Local Runtime Fixed-Filter Lowering Distribution-Contract Audit

## Decision

`LOCAL_RUNTIME_FIXED_FILTER_LOWERING_DISTRIBUTION_READINESS_ACCEPTED`

The Local Runtime fixed-filter lowering boundary has a safe prospective public
contract and distribution strategy. This is acceptance of contract readiness
only. The function remains a private workspace export; no artifact, Plugin
distribution entry, adapter route, or production behavior changes in this
phase.

## Exact Boundary

`lowerFixedFilterProjectionAtHost` consumes immutable structural Core
fixed-filter intents, key requests, and findings plus a host-supplied
`keysByRequestId` map. It returns immutable Legacy-shaped filters and lowered
findings. It has no imports and no filesystem, network, process, environment,
UUID, random, package, archive, or runtime lookup behavior.

The current direct consumers are four test-only harnesses. There are zero
production consumers.

## Mutation Ownership Decision

The contract retains an explicit optional caller-owned findings append.

| Boundary | Ownership |
| --- | --- |
| Core projection, allocation map, intents, requests, and Core findings | Never mutated by Local Runtime. |
| Returned filters and findings | Fresh, immutable, JSON-serializable data. |
| `callerFindings` when non-null | Local Runtime may append one converted finding per projection finding in order. |
| `callerFindings` when null or omitted | No external mutation; equivalent immutable lowered findings remain in the return value. |

This is the compatibility-preserving shape: Legacy checked LayoutView behavior
already appends findings at the host boundary. A thinner adapter append would
add another public operation without removing the required host side effect.
Rollback restores the retained Legacy checked LayoutView route in a temporary
copy; no hidden Local Runtime fallback is allowed.

## Prospective Public Contract

| Surface | Contract |
| --- | --- |
| Runtime function | `lowerFixedFilterProjectionAtHost` |
| Inputs | `HostFixedFilterProjection`, `HostFixedFilterIntent`, `HostFixedFilterFinding`, `HostFixedFilterAllocation`, and optional explicit caller findings target. |
| Outputs | `FixedFilterHostLoweringResult`, `LoweredFixedFilterCondition`, and immutable lowered findings. |
| Allocation | The host supplies a non-empty key for every requestId, with unique keys for distinct requestIds in a lowering call. Fallback allocation is forbidden. |
| Stable errors | `FIXED_FILTER_KEY_ALLOCATION_MISSING`, `FIXED_FILTER_KEY_ALLOCATION_INVALID`, `FIXED_FILTER_KEY_ALLOCATION_COLLISION`. |
| Compatibility | Structural compatibility with Materializer Core `projectFixedFilterIntents` 0.1.x requestId, ordinal, intent, and finding data. |
| Internal details | Request sorting, collision-map implementation, and finding conversion loop remain non-contractual. |

## Prospective Plugin-Resolvable Distribution

The future self-contained ESM artifact is:

```text
dist/yeeflow-app-builder-plugin/core/
  yeeflow-app-builder-core-local-runtime.v0.1.0.mjs
```

The future Plugin adapter resolves it relative to the Plugin `core` directory.
The artifact must remain self-contained: no workspace imports, TypeScript source,
`node_modules`, source maps, repository paths, absolute paths, or bare-package
imports. It needs no runtime import of Materializer Core; it consumes the paired
fixed-filter projection structurally. The future manifest records Materializer
Core 0.1.x and `projectFixedFilterIntents` compatibility, exact exports, source
and compiled input hashes, and artifact SHA-256.

## Required Future Evidence

Before any public promotion or routing:

1. Build the Local Runtime artifact through the official builder.
2. Prove resolution and exact export/manifest/checksum parity from compiled
   source, official Plugin dist, temporary official ZIP extraction, and a
   simulated installed Plugin.
3. Prove no leakage on each surface.
4. Promote the LayoutView Core API only after the paired Runtime artifact is
   compatible and resolvable.
5. Add one adapter export only after both artifacts pass.
6. Prove full default and additional Data List view integration, deterministic
   decoded output, and temporary-copy-only Legacy rollback.

## Non-Goals

No Local Runtime source behavior, public distribution export, Plugin dist,
Materializer Core artifact, adapter, Legacy materializer, active installation,
archive, or release action changes in this audit.

## Phase 5O Follow-Up

Phase 5N subsequently implemented this prospective artifact through the
official builder. Phase 5O revalidated that artifact as the sole host-lowering
companion required before a future Materializer Core LayoutView API promotion.
It does not change the contract or production routing.

## Phase 5P Follow-Up

Phase 5P consumed the already-proven Local Runtime artifact as the explicit
host companion for Materializer Core's public LayoutView projection. Allocation
validation, lowering, and optional findings append remain Local Runtime-only.
