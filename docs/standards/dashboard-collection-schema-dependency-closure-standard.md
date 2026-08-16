# Dashboard Collection Schema and Dependency Closure Standard

## Schema-bound clone rule

Golden Collection templates provide structure and style, not reusable business fields. After cloning, recursively inspect every `__ctx_coll` expression, including headings, Dynamic controls, progress values, visibility conditions, filters, sorting, actions, and operation menus.

- A display expression referencing a source-template field must be remapped to a real field from the selected Data List schema.
- An unprovable source-template condition must be removed as a complete condition block; do not leave partial formula tokens.
- Grid header/item cells with invalid bindings must be removed together and their column tracks normalized.
- Progress controls require a real numeric/percent field.

`DASH_DATASET_COLLECTION_CTX_FIELD_MISSING` is always a generated-final blocker.

## Designer-native column contract

A Dashboard Collection is not correct merely because rows render or `component_save` accepts its JSON. Its selected Golden Reference determines the required Designer control tree.

- Create and update a Collection by cloning the complete selected template subtree. Never reconstruct `attrs.tablecols` from a field list or from a visually similar table.
- Preserve the template's native Collection regions (`header`, `body`, `table`, `pagination`, and the template-specific item/Card tree) unless the template explicitly marks a region editable.
- When the selected Golden Reference uses Designer-native `list-column` nodes (currently `collection_control_responsive_multiple_select`), every retained/generated column must keep `type: "list-column"`, a unique UUID `id`, and a unique UUID `mapkey`. A non-selection column must contain a Dynamic child with `attrs.source = "3"` and a resolved `attrs["obj-f"]` target field.
- This rule is template-aware. Do not inject `list-column` wrappers into a different approved template whose exported shape does not use them; doing so creates an unsupported hybrid. Instead, clone that template's own column shape exactly.
- On an update, modify only the approved business slots. Preserve all unknown native attributes and container hierarchy. Replacing the Collection or rebuilding its columns is a failure unless a new approved template is explicitly selected and fully re-materialized.

Run the Designer-column contract before save and again after `component_get` readback. `DASHBOARD_COLLECTION_DESIGNER_COLUMN_INVALID` and `DASHBOARD_COLLECTION_DESIGNER_COLUMN_DYNAMIC_BINDING_INVALID` are fail-closed. A focused Designer-open check must confirm that every column and Dynamic child can be selected and that no `formcraft.control.undefined` node appears. Browser row rendering is separate evidence and cannot replace Designer-open proof.

## Operation dependency closure

Keeping Edit/Delete/multiselect operations also keeps their complete dependency graph: Collection actions, page actions, filter variables, temp variables, confirmation state, and current-item `ListDataID` context.

Template instances must namespace page variables per page and dataset region. Validators must recognize a namespaced declaration by semantic suffix, for example:

```text
var_<page>_<region>_isDeleteConfirmed
var_<page>_<region>_SelectedItems
var_<page>_<region>_SelectedItemsAmount
```

Validators must not require the unscoped source-template ID when a fully linked namespaced declaration exists. Conversely, an undeclared `__temp_` reference remains a hard failure.

## Unplanned template modules

Page-layout modules not selected by the App Plan must be removed with all descendants and dependencies. In particular, Data List Workbench forms must not retain Event Portfolio KPI cards or their `__temp_event_portfolio_*` expressions unless those KPI modules are explicitly planned and materialized.

## Required gates

Run before signing:

```bash
node scripts/test-dashboard-dataset-presentation-golden-references.mjs
node scripts/test-full-app-materialization-entrypoint-gates.mjs
node scripts/yapk-first-generation-preflight.mjs --package <package.yapk> --plan <yeeflow-app-plan.md> --id-provenance <report.json>
```
