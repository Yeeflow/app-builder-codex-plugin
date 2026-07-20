# Phase 5T Data List Additional-View LayoutView Public-API Readiness Audit

## Decision

`DATA_LIST_ADDITIONAL_VIEW_LAYOUT_PUBLIC_API_READINESS_ACCEPTED`

The selected future shape is a separate additive `projectDataListAdditionalViewLayout` export. It preserves `projectDataListDefaultViewLayout` unchanged and keeps non-default scope and intent validation independent. This audit makes no public export, artifact, adapter, or routing change.

## Prospective API

The public input requires immutable supplied FieldIDs, an immutable template snapshot, `viewIntent.isDefault: false`, and a non-empty non-default `viewScope`. It accepts no LayoutID, ListID, URL, slug, route key, or layout index. The result contains only frozen JSON-serializable fragment, fixed-filter intent, request, and finding data.

## Responsibility Boundary

Materializer Core projects layout and fixed-filter intents only. Local Runtime validates supplied allocations, lowers Legacy-shaped filters, and optionally appends findings to an explicit host target. The host materializer retains selection, LayoutID, ListID, URL, route key, index, UUID allocation, and final resource integration.

## Future Evidence

A future promotion requires source, Plugin dist, official ZIP, and installed export/corpus parity; manifest/checksum parity; leakage and unexpected-export gates. A future route is restricted to the `extraDataViews` call, must protect the default route, prove deterministic integrated output with controlled UUID allocation, and provide temporary-copy-only Legacy rollback.

## Current Non-Goals

The internal function is not public or distributed. No adapter, materializer route, active installation, historical ZIP, Git publication, or release state changed.
