# Collection Responsive Card Grid Full Template Training Report

## Scope

This training promotes `collection_control_responsive_card_grid` from a lightweight card-pattern reference to a full export-shaped Dashboard Collection template.

Source export:

- Package: `Company Overview-v1.4.yapk`
- Dashboard page: `Collection_control_responsive_card_grid`
- Component root: `collection_control_responsive_card_wrapper`
- Extracted artifact: `docs/reference/collection-control-responsive-card-grid.template.json`

The extracted artifact stores only the component subtree and required page-level dependencies. Source runtime IDs such as `ListID`, `ListSetID`, and detail layout IDs are placeholders and must be remapped during generation.

## Contract Added

Generated dashboards that select `collection_control_responsive_card_grid` must clone `collection_control_responsive_card_wrapper` and descendants instead of rebuilding a generic card Collection.

Editable regions are limited to:

- `card_col_title_wrapper`
- `op_normal`
- `card_col_item`
- `card_col_item_multi_select`
- `grid_table_col_item_op_menu`

All other template structure, style, layout, spacing, and typography is locked by default.

Dynamic controls inside `card_col_item` must match the selected data source field type:

- user fields -> `dynamic-user`
- image fields -> `dynamic-image`
- file or attachment fields -> `dynamic-file`
- all other fields -> `dynamic-field`

`dynamic-image` is forbidden when the selected source has no Image field.

Item operations are optional. If `grid_table_col_item_op_menu` buttons are present, every button must bind to Collection actions. Delete requires the confirmation temp variable and conditional delete continuation before `setdatalist remove`. Form Report/Data Report and display-only card regions should omit item-operation regions.

## Validator Updates

`scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now validates:

- registry `fullTemplateReference` for the responsive card grid template
- source template artifact root and required slots
- source template page-level dependency presence
- generated `collection_control_responsive_card_wrapper`
- required card body/item slots
- locked responsive layout/style parity for root, caption, operations, and Collection body
- Dynamic control type matching against decoded source list fields
- `dynamic-image` availability based on source field catalog
- item operation button action bindings
- delete confirmation temp variable and conditional Collection action shape
- display-only mode without caption/item-operation regions

## Regression Coverage

`scripts/test-dashboard-dataset-presentation-golden-references.mjs` now covers:

- pass: registry and full responsive card template artifact
- pass: synthetic package with all approved Collection references including full responsive card grid
- pass: display-only responsive card mode without caption/item operations
- fail: missing responsive wrapper
- fail: Dynamic image bound to non-image field
- fail: item operation button without action
- fail: delete operation without confirmation temp variable

## Safety

This training does not change plugin version metadata, release docs, signing, install/import, live Yeeflow writes, tags, releases, or plugin archives.
