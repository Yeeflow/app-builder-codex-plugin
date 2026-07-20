# Phase 5K Data List Default-View LayoutView Internal Shadow

## Scope and Decision

`DATA_LIST_DEFAULT_VIEW_LAYOUT_INTERNAL_SHADOW_IMPLEMENTED`

Phase 5K implements only a workspace-internal Materializer Core shadow for the
Data List default-view LayoutView projection. The module is compiled for the
focused workspace test harness, but is deliberately absent from the public
Materializer Core index, public API contract, official distribution contract,
and Plugin `dist` artifact. It is neither adapted nor routed into production.

The retained Legacy boundary is unchanged:

```text
buildDataListViewLayoutViewChecked (two production calls)
  -> buildDataListViewLayoutView (one local call)
```

The two checked callers remain the default and additional Data List view
record paths. They continue to own generated-resource integration.

## Internal Contract

| DTO | Responsibility |
| --- | --- |
| `DataListDefaultViewLayoutProjectionInput` | Explicit view scope, supplied field records and FieldIDs, immutable view intent, supplied static template snapshot, and list evidence. |
| `DataListDefaultViewIntent` | Display fields, query fields, fixed-filter text, and view name. It contains no mutable resource record. |
| `DataListDefaultViewTemplateSnapshot` | Only static query-field descriptors. It is an input snapshot, not a template loader or template graph. |
| `DataListDefaultViewLayoutProjection` | Fresh immutable layout, empty pre-host filter, query, sort, and row-color fragment. |
| `DataListDefaultViewLayoutProjectionResult` | Immutable fragment, Phase 5I fixed-filter intent projection, and immutable findings. |

All FieldIDs are caller supplied. The Core shadow accepts no ListID or LayoutID
and allocates no UUID, filter key, host ID, or generated-resource identity.

## Preserved Legacy Projection Semantics

- The exact `Title` field is moved first, including when it was not requested.
- Explicit display and query requests resolve by display name, field name, or
  internal name; unresolved requests fall back to the first eight fields.
- Duplicate layout and query field names are removed with Legacy ordering.
- The layout retains at most twelve columns.
- Query output retains the five supplied static Legacy query descriptors after
  deduplicated field query entries.
- Layout columns retain supplied FieldID, field name, display name, type,
  ordinal order, `Mobile: 2`, and `Show: true`.
- Malformed or omitted `fields` retains the observed Legacy `TypeError` class.

## Fixed-Filter and Findings Boundary

The Core shadow delegates parsing to the existing public Phase 5I contract:
`projectFixedFilterIntents`. It returns deterministic
`viewScope:fixed-filter:ordinal` requests and immutable finding data.

The test harness alone calls Local Runtime
`lowerFixedFilterProjectionAtHost`. Local Runtime validates supplied
`keysByRequestId`, lowers the Legacy-shaped filter array, and appends converted
findings to the explicit host-owned array. It is the only layer in this proof
that mutates findings. Missing, invalid, and colliding allocation responses
remain Local Runtime failures with their existing stable allocation codes.

Legacy UUID generation is controlled by a VM-injected sequential
`crypto.randomUUID` fixture. The same opaque UUID values are supplied to Local
Runtime as host keys, so no normalization hides externally observable filter
keys.

## Differential Matrix

The versioned corpus has 12 cases:

| Coverage | Cases |
| --- | ---: |
| Title-first, fallback, duplicate, supplied FieldID, static query, and twelve-column layout selection | 5 |
| No filter, one filter, multiple filters, duplicate filters, and malformed-filter finding | 5 |
| Omitted view intent and malformed or omitted fields | 2 |

The focused test passed 12 Legacy/Core error and normalized-fragment parity
cases, 10 JSON-serialization and Local Runtime host-lowering cases, and 12
Core input/template/finding immutability cases.

## Guarded Non-Goals

The public export guard rejects a UUID reference, caller findings push, template
mutation, Local Runtime host-lowering reference, public index exposure, public
API-contract exposure, and distribution-contract exposure. This phase does not
change the Legacy materializer, compatibility adapter, official Plugin dist,
distribution contract, active installation, archive, or production routing.

## Future Authorization Boundary

Any later public API, distribution, adapter, source/archive/installed proof, or
production-routing decision requires separate authorization. The future route
must remain Data List default-view only and must retain host-owned key
allocation, findings append, final resource insertion, and rollback proof.

## Phase 5O Follow-Up

Phase 5O accepted public-API readiness after Phase 5N proved the separately
distributed Local Runtime lowering artifact. This internal module remains
unexported and absent from Plugin dist until the distinct Phase 5P promotion
proof passes.

## Phase 5P Follow-Up

The approved public facade now exports only the projection function and DTOs.
The implementation helpers remain internal, and the original shadow corpus
continues to prove the underlying deterministic behavior.

## Phase 5L Distribution Readiness

Phase 5L rejected public promotion until Local Runtime fixed-filter lowering
has a separately versioned, Plugin-resolvable host contract. The Phase 5K
module remains internal, absent from public exports and Plugin dist, and has no
adapter or production route. See
`yeeflow-app-builder-phase-5l-data-list-default-view-layout-distribution-readiness-audit.v0.1.0.md`.
