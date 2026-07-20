# Phase 5J Data List Default-View LayoutView Projection Re-Audit

## Decision

`DATA_LIST_DEFAULT_VIEW_LAYOUT_PROJECTION_REAUDIT_ACCEPTED`

The Phase 5I fixed-filter parser and host-lowering shadow removes the two
former Core blockers: Core no longer creates random filter keys, and Core no
longer appends to caller-owned findings arrays. This acceptance authorizes only
a future Phase 5K Core shadow. It does not authorize a Core runtime export,
adapter change, distribution update, production route, or Legacy change.

## Exact Legacy Dependency Graph

```text
buildDataListViewLayoutViewChecked
  -> buildDataListViewLayoutView
       -> resolveDataViewFields
            -> resolveDataViewField
            -> splitPlannedFieldList
       -> ensureTitleFirstFields
       -> uniqueFieldsByName
       -> buildDataViewLayoutColumn
       -> buildDataViewQueryField
       -> parseDataViewFixedFilterConditions
            -> parseDataViewFixedFilterConditionPart
                 -> crypto.randomUUID (replaced by Phase 5I host allocation)
  -> findings.push (replaced by Phase 5I host findings lowering)

future Core projection
  -> projectFixedFilterIntents
  -> immutable layout/query/sort/row-color fragment
Local Runtime
  -> lowerFixedFilterProjectionAtHost
  -> explicit host findings append and final resource integration
```

The two production checked callers remain the default and additional Data List
view record paths. They are out of scope for this audit and are not changed.

## Updated Resource-Definition Classification Totals

| Classification | Count |
| --- | ---: |
| eligible-after-fixed-filter-host-contract | 1 |
| requires-identity-allocation-contract | 4 |
| requires-template-graph-contract | 3 |
| requires-workflow-or-form-contract | 3 |
| host-orchestration-only | 1 |
| defer-high-risk | 0 |

## Future Phase 5K Contract

| Boundary | Contract |
| --- | --- |
| Core input | `DataListDefaultViewLayoutProjectionInput { viewScope, fields, viewIntent, templateSnapshot }` |
| Field identity | Every `FieldID` is supplied by the host field record. Core accepts no `ListID` or `LayoutID` and allocates no identity. |
| Template boundary | `DataListDefaultViewTemplateSnapshot` contains only static query-field descriptors. Core neither loads nor mutates a template graph. |
| Core output | Fresh immutable `DataListDefaultViewLayoutProjection { layout, query, sort, rowColor, fixedFilterProjection }`. |
| Fixed filters | Core delegates filter parsing to `projectFixedFilterIntents`; Local Runtime receives `keysByRequestId` and lowers the Legacy filter shape. |
| Findings | Core returns immutable findings. Local Runtime appends converted findings only to an explicit caller-owned host array in ordinal order. |
| Final integration | The host inserts the lowered immutable fragment into generated resources. Core never mutates a resource or writes a package. |

## Remaining Controlled Boundaries

The future shadow must preserve Title-first selection, the twelve-column layout
limit, eight-field fallback selection, field de-duplication, static query
fields, view intent, error and finding order, and caller-supplied FieldID use.
These are deterministic projection rules, not permission for implicit template
loading, identity allocation, or generated-resource mutation.

## Required Future Evidence

The future corpus must cover empty and over-limit fields, explicit and fallback
display/query selection, duplicate requests, supplied FieldIDs, template static
query snapshots, no/valid/malformed filters, allocated filter keys, and ordered
findings. It must prove source, temporary official ZIP, and simulated installed
Plugin parity before any routing decision. A temporary-copy-only rollback must
restore the retained checked Legacy lowering while preserving all other routes.

## Non-Goals

This audit does not modify the Legacy materializer, the materializer adapter,
Core distribution, active Plugin installation, archive, or production routing.
