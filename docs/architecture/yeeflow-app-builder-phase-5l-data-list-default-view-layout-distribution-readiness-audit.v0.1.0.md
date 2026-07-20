# Phase 5L Data List Default-View LayoutView Distribution Readiness Audit

## Decision

`DATA_LIST_DEFAULT_VIEW_LAYOUT_DISTRIBUTION_READINESS_REJECTED`

The Phase 5K internal Core shadow remains deterministic and bounded, but it is
not ready for public API or Plugin distribution promotion. A complete LayoutView
result requires the existing Local Runtime fixed-filter lowering boundary.
`lowerFixedFilterProjectionAtHost` is currently a private workspace export with
no separately versioned, Plugin-resolvable distribution contract. Promoting the
Core projection first would leave installed Plugin consumers without a verified
allocation, lowering, and findings-append companion contract.

This rejection preserves the architecture boundary. Core must not absorb host
key allocation or caller-owned findings mutation to make promotion convenient.

## Revalidated Phase 5K Boundary

The 12-case internal differential corpus and export guard remain the evidence
for the following guarantees:

- Title-first selection, fallback selection, de-duplication, twelve-column
  limiting, supplied FieldID propagation, static query descriptors, fixed-filter
  request ordering, and findings ordering retain Legacy parity.
- Inputs, template snapshots, result fragments, fixed-filter intents, key
  requests, and findings are fresh immutable JSON-serializable values.
- Core does not create UUIDs, host IDs, filter keys, resource records, package
  output, or caller-owned findings mutation.
- Local Runtime remains the only lowering and findings-append boundary.

## Prospective Public Materializer Core API

The following public API is defined for future review only. It is not exported,
distributed, or callable in this phase.

| Surface | Prospective contract |
| --- | --- |
| Runtime function | `projectDataListDefaultViewLayout` |
| Input DTOs | `DataListDefaultViewLayoutProjectionInput`, `DataListDefaultViewFieldInput`, `DataListDefaultViewIntent`, `DataListDefaultViewTemplateSnapshot`, `DataListStaticQueryField` |
| Output DTOs | `DataListDefaultViewLayoutProjectionResult`, `DataListDefaultViewLayoutProjection`, `DataListLayoutColumnProjection`, `DataListQueryFieldProjection`, `LayoutViewProjectionFinding`, `FixedFilterProjectionResult` |
| Serialization | JSON-serializable only. The Core fragment has no allocated filter keys and an empty filter until host lowering. |
| Immutability | Inputs are never mutated; results and nested DTO values are fresh and runtime-frozen. |
| Errors | Legacy `TypeError` class for malformed or omitted fields; immutable planned-filter findings for unparseable text; allocation errors remain host-only. |
| Versioning | A future additive release may use Materializer Core 0.1.x only after a compatible Local Runtime contract is versioned. Incompatible DTO changes require a new contract version and complete parity proof. |

The following remain explicitly internal: the current
`projectDataListDefaultViewLayoutInternal` implementation and all field-list
normalization helpers. The prospective public boundary excludes Legacy
LayoutView records, mutable templates, caller-owned findings arrays, host key
maps, ListID, LayoutID, generated resources, package handles, and host/runtime
state.

## Local Runtime Distribution Decision

Before public promotion, Local Runtime requires a separately versioned
host-lowering compatibility contract for `lowerFixedFilterProjectionAtHost`.
It must define:

- `keysByRequestId` allocation response shape and allocation namespace;
- `FIXED_FILTER_KEY_ALLOCATION_MISSING`,
  `FIXED_FILTER_KEY_ALLOCATION_INVALID`, and
  `FIXED_FILTER_KEY_ALLOCATION_COLLISION` behavior;
- immutable lowered filter and finding result shapes;
- explicit caller-owned findings append semantics;
- Core-to-Local-Runtime version compatibility; and
- Plugin-installed resolution, either through a verified Local Runtime artifact
  or a separately versioned host adapter contract.

The current private workspace package is insufficient as installed-Plugin
evidence. This is a contract availability blocker, not permission to copy the
host lowerer into Core.

## Required Evidence Before Any Future Route

1. Promote and compile the approved Core API only after the Local Runtime
   companion decision passes.
2. Prove public export-list and manifest/checksum parity for compiled source,
   official Plugin dist, temporary official ZIP extraction, and simulated
   installed Plugin layout.
3. Reject workspace, repository source, `node_modules`, and source-map leakage
   from every distributed surface.
4. Run all 12 LayoutView cases with deterministic host-supplied allocations.
5. Add exactly one Materializer adapter export after public artifacts resolve.
6. Prove an actual default and additional Data List view integration fixture in
   source, archive, and installed layouts, including deterministic decoded
   output and a temporary-copy-only Legacy rollback.

## Non-Goals

This audit does not add an index export, Local Runtime distribution export,
artifact, distribution contract entry, materializer adapter export, production
route, active installation change, or release action.

## Phase 5M Follow-Up

Phase 5M accepted the prospective Local Runtime lowering contract while leaving
it private and undistributed. The contract retains explicit host findings append
and defines the future self-contained Plugin artifact, compatibility manifest,
leakage rules, and source/archive/installed proof. LayoutView public promotion
remains deferred until that future artifact is built and proven.

## Phase 5O Follow-Up

The historical Phase 5L rejection remains valid evidence for its original
workspace-only Runtime state. Phase 5N later proved the required Local Runtime
artifact, and Phase 5O consequently accepted readiness for a future public API
promotion. No public export or artifact change occurred in Phase 5O.

## Phase 5P Follow-Up

Phase 5P completed the previously deferred Materializer Core public export and
four-surface distribution proof after the Local Runtime artifact became
available. This historical readiness audit remains unchanged evidence of why
the promotion could not happen earlier.
