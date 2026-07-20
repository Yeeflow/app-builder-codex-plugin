# Phase 6E Selective Data List Lookup Production Routing Proof

## Decision

`DATA_LIST_LOOKUP_RESOLUTION_ADAPTER_ROUTING_PASSED`

Only Data List Lookup fields in the existing `collectDataListFieldSpecs -> fieldSpecsForList -> buildFieldRecord` path are routed. The Materializer Core adapter returns immutable Lookup intent only. The Local Runtime adapter validates the host-supplied map and returns fresh `Rules.listid` text only.

## Production Boundary

There is one production `buildFieldRecord` call expression. The selected Lookup branch has one Core intent call and one Local Runtime lowering call. The host continues to own target maps, ListID and FieldID strings, scope context, final record integration, and package output. Empty deterministic Core candidates preserve the Legacy empty `Rules` value; no target discovery or fallback ID is introduced.

## Evidence

The fifteen-case routing matrix passed source, a temporary official ZIP extraction, and a simulated installed Plugin. It covers direct and singular-alias resolution, lossless target identities, all six stable errors, multiple Lookup ordering, excluded field families, no fallback discovery, deterministic output, and a temporary-copy-only Legacy rollback. UUID normalization is limited to pre-existing control UUIDs and never affects `Rules.listid`.

## Retained Legacy Scope

- scalar fields
- sublists
- identity user and department fields
- file image and binary fields
- barcode behavior
- custom forms
- approval forms
- document libraries
- dashboards
- workflows
- target resource integration
- empty Rules for an empty deterministic Lookup candidate

## Non-Goals

No new public export, Core contract change, active installation change, historical ZIP change, cross-surface Lookup route, Git publication, or release action occurred.
