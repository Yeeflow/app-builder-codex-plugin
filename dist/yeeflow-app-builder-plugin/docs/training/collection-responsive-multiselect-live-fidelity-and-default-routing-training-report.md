# Responsive Multiselect Collection: Live Fidelity and Default Routing

## Scope

This training update compares the export-shaped `All Tasks - multiple select (new)` Dashboard in the controlled Projects Center reference application with `collection_control_responsive_multiple_select`.

## Confirmed complete contract

The template preserves the full responsive multiselect component rather than only a Collection control:

- native sortable Table columns for desktop and tablet plus a non-empty mobile Card item tree;
- the `grid_table_col_multiselect_wrapper` subtree and page `filterVars`, `tempVars`, `filter`, `actions`, and `formAction` dependencies;
- Collection selection, edit, delete, and completion actions; selected IDs/count state; and batch completion/deletion controls;
- Card item operation click protection (`grid_table_col_item_operations` z-index `2`) and Button-right operation-menu placement;
- mobile operation-container width values `[null, "2", "1"]` on `grid_table_col_operations` and `op_normal`, matching the live reference.

## Routing policy

`collection_control_responsive_multiple_select` is now the default when a Dashboard requirement describes multiple selection, checkbox selection, selected records/count, or bulk/batch completion, update, or deletion. The legacy `collection_control_grid_table_with_multiselect` remains available only when the App Plan explicitly requests legacy Flex Grid compatibility or names that exact template ID. Card-first multiselect requirements continue to select the card-toolbar template.

## Regression evidence

- `test-dashboard-dataset-presentation-golden-references.mjs` rejects width drift in the responsive multiselect source artifact.
- `test-responsive-multiselect-default-routing.mjs` materializes a generic multi-select/batch Dashboard requirement and verifies native Table/Card output, complete page dependencies, no Flex Grid in the generated Collection, and the live mobile width contract.
- The materializer Card-view mapper now has its missing safe array helper, so the default route can generate the Card subtree instead of failing during materialization.

## Proof boundary

Live MCP configuration readback and local generated-final regression tests prove reference fidelity and materialization behavior. They do not prove tenant install, Designer rendering, or end-user runtime behavior for a newly generated app; those require a separately authorized install and browser/runtime test.
