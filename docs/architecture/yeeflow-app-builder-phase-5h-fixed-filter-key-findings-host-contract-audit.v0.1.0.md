# Phase 5H Fixed-Filter Key and Findings Host Contract Audit

## Result

`FIXED_FILTER_KEY_FINDINGS_HOST_CONTRACT_VALID`

The audit establishes a deterministic Core-to-host boundary for fixed-filter
keys and findings lowering. It does not implement a Core parser, host lowering,
adapter, artifact, or production route.

## Exact Legacy Boundaries

| Function | Caller count | Current responsibility |
| --- | ---: | --- |
| `parseDataViewFixedFilterConditions` | 1 | Normalizes filter text, preserves parsed part order, and invokes the condition parser. |
| `parseDataViewFixedFilterConditionPart` | 1 | Produces non-empty, date-now, and direct-comparison conditions. Each successful condition receives `crypto.randomUUID()` as `key`. |
| `buildDataListViewLayoutViewChecked` | 2 | Returns the `LayoutView` fragment and appends `DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED` to the caller-owned findings array when non-empty planned filter text produces no conditions. |

The two checked callers serialize the result into the default and additional
Data List `LayoutView` records. A filter key is externally observable because
it is persisted within decoded and packaged `LayoutView.filter[]` JSON. The
current materializer does not read a generated filter key again before package
output.

## Immutable Core and Host Contracts

| Boundary | Contract |
| --- | --- |
| Core input | `FixedFilterIntentInput { viewScope, fields, filterText }` |
| Core intent | `FixedFilterConditionIntent { requestId, ordinal, pre, left, op, right, showCus? }` |
| Core request | `FixedFilterKeyRequest { requestId, viewScope, ordinal, conditionFingerprint }` |
| Host allocation | `FixedFilterKeyAllocationResponse { keysByRequestId }` |
| Core findings | `FixedFilterProjectionFinding { code, message, context }` |
| Core result | Fresh immutable `FixedFilterProjectionResult` and allocated filter result only. |
| Host lowering | The host validates allocation responses and appends converted immutable findings to the caller-owned array in order. |

Core is explicitly prohibited from UUID generation, ID allocation, mutation of
caller-owned values, filesystem/API/environment/runtime access, archive work,
and package output.

## Identity and Ordering Semantics

`requestId` is deterministic: `viewScope:fixed-filter:ordinal`. The host uses
`viewScope` plus `requestId` as the allocation namespace. Duplicate semantic
conditions remain separate because their original ordinals differ; every
successful condition must receive a distinct, non-empty opaque host key.

Missing keys emit `FIXED_FILTER_KEY_ALLOCATION_MISSING`. Empty or malformed
keys emit `FIXED_FILTER_KEY_ALLOCATION_INVALID`. Colliding keys emit
`FIXED_FILTER_KEY_ALLOCATION_COLLISION`. Every accepted condition and finding
retains parsed ordinal order. Core performs no findings deduplication; host
lowering appends all findings in order for compatibility with the existing
array behavior.

## Fixture Matrix

The versioned matrix contains ten contract cases:

1. No filter.
2. One parseable filter.
3. Multiple filters.
4. Duplicate filters with distinct ordinals.
5. Malformed non-empty filter text.
6. Valid supplied allocation map.
7. Missing allocation.
8. Colliding allocation.
9. Finding ordering.
10. Legacy caller-owned findings mutation.

## Revised LayoutView Shadow Readiness

Phase 5I implements the parser and host lowering as a non-routed shadow. The
future proof must compare unnormalized filter ordering, supplied keys, values,
errors, and ordered findings across source, temporary official ZIP, and
simulated installed Plugin layouts before any distribution or routing decision.
A temporary-copy-only rollback must restore the retained Legacy parser and
lowering without a production fallback flag.

No current production behavior is changed by this contract.
