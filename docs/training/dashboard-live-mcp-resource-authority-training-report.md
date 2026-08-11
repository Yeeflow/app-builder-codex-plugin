# Dashboard live MCP resource-authority training report

## Trigger

The Dental Website Application build exposed a live Dashboard update that was accepted and readable through MCP but still rendered the old page. The update had changed `LayoutView` while leaving `LayoutInResources[0].Resource` stale.

## Required generation and update contract

1. Fetch the full live Dashboard component before mutation.
2. Treat the embedded `LayoutInResources` page JSON as runtime-authoritative.
3. Normalize the intended page into both `LayoutView` and the embedded Resource, with `ID = RefId = LayoutID`.
4. Validate the synchronized component before save and again after component readback.
5. For master-detail pages, validate the current-item selection closure: a card/row binds a local Collection action, the action writes `__ctx_coll/ListDataID` to `vCurrentItemID`, and the detail Collection consumes that variable using a one-record `ListDataID` filter.
6. Keep save acceptance, persisted readback, Designer open, and browser interaction evidence distinct. The first two must never be reported as a working Add, record-open, or record-selection interaction.

## Regression scope

`scripts/test-dashboard-live-component-resource-sync.mjs` injects a stale embedded Resource, proves that it fails with `DASHBOARD_LIVE_RESOURCE_DRIFT`, normalizes it, and then injects a missing clickable selection binding. This is a local contract regression only; it does not claim a tenant browser runtime result.
