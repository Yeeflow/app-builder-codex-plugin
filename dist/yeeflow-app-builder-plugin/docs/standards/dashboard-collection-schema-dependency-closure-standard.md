# Dashboard Collection Schema and Dependency Closure Standard

## Schema-bound clone rule

Golden Collection templates provide structure and style, not reusable business fields. After cloning, recursively inspect every `__ctx_coll` expression, including headings, Dynamic controls, progress values, visibility conditions, filters, sorting, actions, and operation menus.

- A display expression referencing a source-template field must be remapped to a real field from the selected Data List schema.
- An unprovable source-template condition must be removed as a complete condition block; do not leave partial formula tokens.
- Grid header/item cells with invalid bindings must be removed together and their column tracks normalized.
- Progress controls require a real numeric/percent field.

`DASH_DATASET_COLLECTION_CTX_FIELD_MISSING` is always a generated-final blocker.

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
