# Dashboard Action Reference Closure Training Report

## Runtime defect incorporated

A CRM Dashboard cloned from a reference application persisted successfully through MCP `component_save` and `component_get`, but `Add Opportunity` and `Add Activity` stayed Loading and Collection records did not open. The clone retained source-application form LayoutIDs in Add actions; Collection item-template roots lacked a `control_action` bound to a local edit action.

## Generation rule

Treat Dashboard action targets as a dependency closure, not a display-only clone. Allocate target ListID/LayoutID/action IDs first, recursively remap every copied action reference, then validate the saved/read-back resource with `validate-dashboard-action-reference-closure.mjs`. Do not merely check that an old ListID is absent: inspect ListID, ListSetID, LayoutID, FieldID, and local action target references recursively.

## Regression fixture

`fixtures/dashboard-action-reference-closure/clone-before-remap.json` models one Dashboard Add action plus one Collection Add/Edit/current-record-open sequence. `scripts/test-dashboard-action-reference-closure.mjs` verifies target remapping and fail-closed stale-layout and missing-open-action cases.

## Evidence boundary

`apiAccepted` and `persistedReadback` are not action-runtime proof. Designer opening is a separate observation. The only evidence level that can mark the interaction usable is `browserActionRuntime`, recorded after focused clicks on each Add control and at least one Collection record with rendered form/edit UI and no Loading loop.
