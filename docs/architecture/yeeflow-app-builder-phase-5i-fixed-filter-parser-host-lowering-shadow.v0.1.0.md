# Phase 5I Fixed-Filter Parser and Host-Lowering Shadow

## Scope

Phase 5I implements only the fixed-filter parser and the explicit Local Runtime
key and findings lowering boundary. It does not change the Legacy materializer,
complete `LayoutView` projection, adapter, Plugin distribution, or production
routing.

## Legacy Behavior Preserved

The Legacy parser accepts no-filter text, non-empty checks, date-now checks,
and direct comparisons. It resolves fields by display, field, or internal name;
keeps valid parsed-part order; emits one random key per valid condition; and
keeps duplicate semantic conditions as separate entries. Decimal, Bit, and
Datetime values retain their Legacy coercion behavior.

The checked Legacy `LayoutView` path appends
`DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED` only when non-empty planned
filter text yields no condition. The shadow returns that finding as immutable
Core data; Local Runtime is the sole boundary that converts and appends it to
the supplied caller-owned findings array.

## Shadow DTOs and Boundaries

Core exports:

- `FixedFilterIntentInput`
- `FixedFilterConditionIntent`
- `FixedFilterKeyRequest`
- `FixedFilterProjectionFinding`
- `FixedFilterProjectionResult`
- `projectFixedFilterIntents`

Core uses deterministic `viewScope:fixed-filter:ordinal` request IDs and never
calls UUID, random, time, filesystem, network, API, environment, process,
archive, or package capabilities. Every Core result, array, intent, request,
and finding is frozen and JSON-serializable.

Local Runtime exports `lowerFixedFilterProjectionAtHost`. It validates
`keysByRequestId`, throws the stable missing, invalid, or collision allocation
codes, lowers supplied opaque keys into the Legacy filter shape, and appends
converted immutable findings only to the explicitly supplied host array.

## Differential Corpus and UUID Control

The versioned corpus has eleven cases: the Phase 5H ten-case matrix plus a
separate invalid-allocation case. The Legacy VM harness injects a deterministic
`crypto.randomUUID` sequence supplied by each fixture. Core receives the exact
same values through `keysByRequestId`; no UUID normalization hides observable
filter-key behavior.

Seven corpus cases have direct Legacy/Core/host output parity. Three cases
exercise missing, invalid, and colliding host allocations. One synthetic
findings-ordering case verifies that Local Runtime appends immutable findings
in supplied order.

## Evidence

- `FIXED_FILTER_PARSER_CORE_SHADOW_IMPLEMENTED`
- `FIXED_FILTER_HOST_LOWERING_SHADOW_IMPLEMENTED`
- `FIXED_FILTER_PARSER_HOST_LOWERING_DIFFERENTIAL_PARITY_PASSED cases=7`
- `FIXED_FILTER_PARSER_KEY_REQUEST_DETERMINISM_PASSED cases=11`
- `FIXED_FILTER_PARSER_CORE_IMMUTABILITY_PASSED cases=11`
- `FIXED_FILTER_HOST_LOWERING_ALLOCATION_GATES_PASSED cases=3`
- `FIXED_FILTER_PARSER_LEGACY_UNCHANGED`

## Deferred Work

The complete Data List default-view `LayoutView` Core shadow remains deferred.
It requires a new scoped authorization, re-audit against this implemented
boundary, and separate distribution and production-routing decisions.
