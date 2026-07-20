# Phase 5G Data List Default-View LayoutView Projection Shadow Audit

## Result

`NO_SAFE_DATA_LIST_DEFAULT_VIEW_LAYOUT_PROJECTION_SHADOW`

No Core shadow implementation was added. A fresh TypeScript AST re-audit found
that the exact approved Legacy boundary is not deterministic or immutable as
previously classified.

## Exact Legacy Boundary

`buildDataListViewLayoutView({ fields, viewRecord })` is called once by
`buildDataListViewLayoutViewChecked`, which is called twice in the Data List
resource assembly: once for the default view and once for each additional Data
View.

The function:

- selects up to twelve layout fields, forcing `Title` first when present;
- resolves planned display and query fields by display, field, or internal
  name, falling back to the first eight supplied fields;
- emits `layout`, `filter`, `query`, `sort`, and `rowColor` objects;
- carries supplied `FieldID` values into layout and query records;
- appends fixed platform query fields for `ListDataID`, `CreatedBy`,
  `ModifiedBy`, `Created`, and `Modified`;
- returns fresh objects for normal inputs without mutating supplied fields or
  the view record.

The checked path then pushes a
`DATA_VIEW_FILTER_PLANNED_BUT_NOT_MATERIALIZED` finding into the caller-owned
`findings` array when planned filter text cannot be lowered.

## Blocking Dependency

The transitive helper `parseDataViewFixedFilterConditionPart` calls
`crypto.randomUUID()` for every materialized fixed-filter condition key. This
affects non-empty, date-now, and direct-comparison filter branches. Therefore
the Legacy result contains Core-generated random identifiers unless a host
supplies them. It cannot meet a deterministic immutable Core contract as the
current complete boundary stands.

The necessary future contract is not a helper extraction. It must first define
an explicit host-owned filter-key map and a host-owned findings lowering port.
Only after that contract exists may a narrowed projection receive all keys as
immutable inputs and return findings as immutable values. The current Legacy
implementation and all callers remain unchanged.

## Deferred Behavior

The following behavior is intentionally deferred:

- fixed-filter key allocation;
- caller-owned findings-array mutation;
- any Core output requiring Legacy `crypto.randomUUID` behavior;
- Data List record and layout lowering;
- identity allocation, template loading or mutation, package construction, and
  cross-surface resource references.

## Phase 5G Non-Goals

This audit does not add a Materializer Core export, DTO, differential corpus,
adapter export, distribution artifact, or production route. It does not modify
the Legacy materializer, scalar routing, active Plugin installation, or the
historical release ZIP.
