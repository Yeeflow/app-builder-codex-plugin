# Dashboard Action Target Closure Standard

Use this standard whenever a Dashboard is cloned, copied, repaired, or remapped to another Yeeflow application.

Before `appbuilder_component_save`, run `remapDashboardActionTargets` with the issued target IDs. It must recursively remap old `ListID`, `ListSetID`, `LayoutID`/`layout`, field IDs, and local action IDs through Button, clickable Container, Collection `attrs.actions`, and Collection item-template `attrs.control_action` bindings.

Before handoff, run:

```sh
node scripts/validate-dashboard-action-reference-closure.mjs --input <decoded-app.json> --stale-id <each-source-id>
node scripts/test-dashboard-action-reference-closure.mjs
```

The validator fails closed with:

- `DASHBOARD_ACTION_LAYOUT_UNRESOLVED` when an Add/Edit `listitem` action does not resolve to the target application's Data List and its current Type-1 New/Edit layout.
- `DASHBOARD_COLLECTION_OPEN_ACTION_MISSING` when a Collection lacks a local `type: "coll"` edit action with current-list context (`__ctx_coll` / `ListDataID`) or its item template has no `attrs.control_action` bound to that local action.
- `DASHBOARD_STALE_LAYOUT_REFERENCE` when recursive references retain a source/unknown LayoutID, ListID, ListSetID, FieldID, or local action target.

Every Add action on an `action_button` or clickable Container uses action type `5`, a resolvable `attrs.data.list.ListID`, and the target list's New Type-1 `attrs.layout`. Every Collection `listitem` Add follows the same contract. Every Collection record-open action uses the same Collection source list, its Edit Type-1 layout, and `listdataid` from `__ctx_coll` / `ListDataID`; bind its item-template root container or an explicit item button through `attrs.control_action`.

Report evidence as four independent levels: `apiAccepted`, `persistedReadback`, `designerOpen`, and `browserActionRuntime`. API acceptance and component-get/readback can establish only persistence. A Dashboard Add/Edit action is usable only if focused browser action runtime evidence is `passed`: click each Add action and one Collection record, confirm the New/Edit form renders, and confirm no indefinite Loading state.
