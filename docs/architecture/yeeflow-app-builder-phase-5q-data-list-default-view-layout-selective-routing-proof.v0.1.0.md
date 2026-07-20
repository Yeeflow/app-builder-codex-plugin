# Phase 5Q Selective Data List LayoutView Production Routing Proof

## Decision

`DATA_LIST_LAYOUTVIEW_ADAPTER_ROUTING_PASSED`

Only the default Data List Type 0 LayoutView route uses Materializer Core and Local Runtime. The separate additional-view call remains on the retained Legacy helper because the approved twelve-case contract covers default-view semantics only.

## Routed Boundary

- Routed call expressions: 1
- Checked LayoutView call expressions: 2
- Legacy-excluded call expressions: 1
- Excluded scenarios: `additional Data List Type 0 LayoutViews`

Materializer Core produces only immutable layout and fixed-filter intent data. The Local Runtime adapter resolves only its distributed artifact and performs allocation validation, filter lowering, and explicit caller findings append. Host UUID allocation and final resource integration remain in Legacy materializer code.

## Evidence

The 2-case actual-materializer matrix passed source, temporary official ZIP, and simulated installed Plugin layouts. It compares normalized decoded resources, output-file shape, errors, and findings against a temporary-copy-only Legacy baseline, covers default title-first/fallback/deduplication/maximum-column behavior, FieldIDs, static query data, controlled fixed filters, and malformed filter findings. The historical ZIP SHA-256 remained `377dc6ddaf3b922c0543e3a77274e7a56f32b4e2f19452f4a73ed6ad7f8cd9e2`.

## Follow-Up Boundary

Phase 5R separately audited additional Data List views. It does not change this route: additional views remain Legacy-owned until a dedicated extended view-intent contract, parity matrix, and rollback proof are implemented and accepted.

## Rollback

Remove the projectDataListDefaultViewLayout and lowerFixedFilterProjectionAtHost imports, delete buildDataListDefaultViewLayoutViewThroughCore, and replace the default call flag with the retained buildDataListViewLayoutView path.

No runtime toggle, source fallback, or production feature flag exists.
