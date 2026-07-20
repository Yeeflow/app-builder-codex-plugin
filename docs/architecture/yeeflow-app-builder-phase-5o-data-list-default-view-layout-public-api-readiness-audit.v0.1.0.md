# Phase 5O Data List Default-View LayoutView Public-API Readiness Audit

## Decision

`DATA_LIST_DEFAULT_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED`

The internal projection is ready for a later public API promotion because the
Materializer Core boundary remains structural and Phase 5N now provides the
separately distributed Local Runtime lowering contract. This audit makes no
public export, artifact, adapter, or production-route change.

## Prospective Public API

- Function: `projectDataListDefaultViewLayout`
- Inputs: `DataListDefaultViewLayoutProjectionInput`, `DataListDefaultViewFieldInput`, `DataListDefaultViewIntent`, `DataListDefaultViewTemplateSnapshot`, `DataListStaticQueryField`
- Outputs: `DataListDefaultViewLayoutProjectionResult`, `DataListDefaultViewLayoutProjection`, `DataListLayoutColumnProjection`, `DataListQueryFieldProjection`, `LayoutViewProjectionFinding`, `FixedFilterProjectionResult`
- Required fields: `fields`, `viewScope`
- Optional fields: `viewIntent`, `templateSnapshot`, `listName`

The function returns an immutable JSON-serializable fragment and fixed-filter
intent data only. Legacy LayoutView records, mutable templates, caller findings
arrays, allocation maps, host identities, generated resources, package handles,
and runtime state remain outside the public API.

## Inter-Artifact Boundary

Materializer Core returns no allocated filter key and never appends findings.
Local Runtime alone validates supplied allocations, lowers Legacy-shaped filters,
and performs the explicit optional findings append. Both artifacts must resolve
from Plugin core paths without workspace or repository leakage.

## Future Phase 5P

Phase 5P may promote the single public export only after source, dist, ZIP, and
installed twelve-case export and corpus parity, manifest/checksum parity, and
public-export leakage gates pass.

## Future Phase 5Q

Phase 5Q may add one adapter export and route only the restricted Data List
default/additional-view lowering boundary after full integration parity,
deterministic decoded output, and temporary-copy-only Legacy rollback prove
that Local Runtime retains allocation and findings-lowering ownership.

## Current Non-Goals

The internal helper remains unexported. No distribution artifact, adapter,
Legacy materializer, active installation, archive, or release action changed.

## Phase 5P Follow-Up

The approved promotion proof has now completed. `projectDataListDefaultViewLayout`
is publicly exported and available from the self-contained Materializer Core
artifact, while routing remains unstarted pending separate Phase 5Q evidence.
