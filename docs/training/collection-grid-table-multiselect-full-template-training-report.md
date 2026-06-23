# Collection Grid-Table Multiselect Full Template Training Report

This training upgrades `collection_control_grid_table_with_multiselect` from summary-level multiselect grid-table guidance into a first-class export-shaped Dashboard Collection template.

The template source is the `All Tasks - multiple select` Dashboard page from `Projects Center_1-v1.6.yapk`. The extracted component root is `grid_table_col_multiselect_wrapper`; the plugin now carries the component subtree and required page-level dependencies as a standalone reference artifact:

- `docs/reference/collection-control-grid-table-with-multiselect.template.json`

The source package was decoded through tolerant streaming Brotli because the official export emitted complete parseable `AppPackageInfo` JSON before ending with `Z_BUF_ERROR`. The plugin artifact does not include the raw `.yapk`, raw `Resource`, raw `Sign`, tenant URLs, or a full decoded application payload. Long source resource IDs are redacted or placeholderized in the reference artifact.

## Generation Contract

Generation must copy `grid_table_col_multiselect_wrapper` and all descendants. It must not satisfy this template with a generic grid-table Collection, ad hoc checkbox icons, or a rebuilt toolbar.

Editable regions:

- `grid_table_col_title_wrapper`
- `op_normal`
- `op_multipleselected`
- `grid_table_col_header`
- `grid_col_item`

Optional repeatable/removable part:

- `btn_set_items`

Locked regions and dependencies:

- `grid_table_col_multiselect_wrapper`
- `grid_table_col_item_select`
- `grid_table_col_body`
- Collection root `attrs.actions[]`
- page-level `filterVars`
- page-level `tempVars`
- page-level `actions`
- page-level `filter`
- page-level `formAction`

`grid_table_col_item_select` must remain unchanged, including checked and unchecked icon controls plus selection/action wiring. `grid_table_col_header` and `grid_col_item` are the field-mapping regions and must keep matching column count, column widths, and compatible grid properties.

## Field Mapping Rules

`grid_table_col_header` maps visible column labels. `grid_col_item` maps repeated item content from the selected Collection data source.

- User fields use Dynamic user controls.
- Image fields use Dynamic image controls.
- File or attachment fields use Dynamic file controls.
- Other fields use Dynamic field controls.

`op_normal` should retain Search and Add item unless a validated business rule removes one of them. Search placeholder text and Add item button text may change. `op_multipleselected` should retain Delete selected items. `btn_set_items` is optional. Additional batch buttons may be added only when each button has a valid action binding.

## Validator Coverage

`scripts/validate-dashboard-dataset-presentation-golden-references.mjs` now validates:

- registry linkage to the full template artifact
- required template slots
- required page-level dependencies
- generated package `grid_table_col_multiselect_wrapper`
- generated package `grid_table_col_item_select`
- Collection root actions
- action bindings in normal and multiselect operation regions
- header/item column parity
- page-level selected variables and form/action dependencies
- rejection of simplified grid-table multiselect approximations

The focused regression test now includes a positive package using all approved Dashboard Collection templates and negative cases for:

- missing full grid-table multiselect wrapper
- mismatched header/item columns
- missing page-level dependencies
- action buttons without action bindings

## Classification

This was a pre-existing generator/validator gap. The plugin already knew `collection_control_grid_table_with_multiselect` as an approved template ID, but it did not carry the full export-shaped source subtree or strict template-specific materialization gates.

## Proof Boundary

The learned template is export-shaped and validator-backed. Runtime execution of generated batch actions remains separate proof and must not be inferred from local package validation, signing, install, or upgrade API acceptance alone.
