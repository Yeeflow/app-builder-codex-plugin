# Dashboard live MCP resource-authority training report

## Trigger

Live Dashboard updates can be accepted and returned through MCP while the Designer or runtime renders an empty or old page. The failure is not disproved by `component_save` or `component_get`: the runtime-authoritative `LayoutInResources[].Resource` may be absent, stale, or structurally invalid even when a separate `LayoutView` was written.

## Required generation and update contract

1. Fetch the complete Dashboard component and classify it with `classifyLiveDashboardResourceMode()` before mutation.
2. Treat the selected `LayoutInResources[].Resource` as runtime-authoritative. An empty `LayoutView` is a valid embedded-only mode; do not populate it or equate it to the Resource by default.
3. Normalize the intended page into the embedded Resource with `ID = RefId = LayoutID`, preserving unplanned component fields and generation markers such as `src` and `generatedFinal`.
4. For generated Custom Code Dashboards, require exactly one parseable embedded resource, a `main -> content` root topology, and exactly one `codein` control with a non-empty `attrs["codein-script"]`.
5. Validate before save, save only with the user-approved component operation, read it back, and compare intended vs. readback runtime Resources with `validateLiveDashboardPostSave()`.
6. If the post-save contract fails, do not describe the page as usable. Restore the previously read full component only when the caller has explicit authorization for that write.
7. For master-detail pages, validate the current-item selection closure: a card/row binds a local Collection action, the action writes `__ctx_coll/ListDataID` to `vCurrentItemID`, and the detail Collection consumes that variable using a one-record `ListDataID` filter.

## Fail-closed findings

- `DASHBOARD_RESOURCE_NOT_MATERIALIZED`: missing/unparseable Resource, or invalid Custom Code resource cardinality.
- `DASHBOARD_RESOURCE_ID_MISMATCH`: Resource `ID` or `RefId` differs from the owning `LayoutID`.
- `DASHBOARD_ROOT_STRUCTURE_INVALID`: Custom Code Resource lacks `main -> content`.
- `DASHBOARD_CODEIN_MISSING`: Custom Code Resource lacks exactly one configured `codein` control.
- `DASHBOARD_POSTSAVE_DRIFT`: persisted runtime Resource differs from the intended Resource.

## Evidence reporting

Always report these independent booleans: `apiAccepted`, `persistedReadback`, `designerOpen`, and `browserActionRuntime`. `apiAccepted` and `persistedReadback` are persistence evidence only. `designerOpen` proves the page can be opened for design, not that actions work. Set `actionsUsable: true` only after focused `browserActionRuntime` evidence verifies the claimed Add, record-open, selection, or Custom Code behavior.

## Regression scope

`scripts/test-dashboard-live-component-resource-sync.mjs` exercises an embedded-only valid Dashboard, preservation of generation markers, missing resource, wrong resource identity, missing root topology, missing Custom Code, and post-save Resource drift. This is a local contract regression only; it does not claim a tenant Designer or browser runtime result.
