# Dashboard Lookup Dynamic Field Display Contract Training

## Trigger

ComfortDelGro Audit Management exposed a Dashboard Collection where a `dynamic-field` rendered a Lookup source field without the Lookup Display field configuration. The Dashboard save and subsequent component readback succeeded, but those results did not prove that the Collection would render the intended associated-record label.

## Required generation behavior

1. Resolve the Collection/Kanban/Timeline host Data List and the Dynamic field `attrs["obj-f"]`.
2. If the source field is Lookup, resolve the Lookup target list and its configured display field from field metadata.
3. Emit `attrs["dis-f"]` with that resolved target display field. Never infer `Title` unless metadata selects `Title`.
4. Recompute the contract after every clone, list remap, or field remap.
5. Reject missing, stale, unresolved, or mismatched Lookup display configuration before generated-final handoff.

## Regression scope

The Dashboard hard-gate fixture covers a valid Lookup Dynamic field, missing `dis-f`, a mismatched `dis-f`, and an unresolved configured target display field. The fixture deliberately makes the target display configuration metadata-driven so future changes cannot pass by hard-coding `Title`.

## Evidence boundary

- `apiAccepted`: the component save request was accepted.
- `persistedReadback`: the saved resource still contains the resolved `attrs.dis-f`.
- `designerOpen`: the Dashboard Designer opens the control and displays its intended Lookup Display field.
- `browserActionRuntime`: a Collection row with a real associated record displays the intended label.

Only the first two are static/configuration evidence. The latter two remain required for UI/runtime claims.
