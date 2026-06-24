# Collection Grid-Table Full Template Training Report

## Scope

This training promotes `collection_control_grid_table` from a loose grid/table pattern into a full export-shaped Dashboard Collection template.

Source package:

- `Projects Center_1-v1.7.yapk`

Source page and component:

- Dashboard page: `Collection_control_grid_table`
- Component root: `grid_table_col_wrapper`
- Template artifact: `docs/reference/collection-control-grid-table.template.json`

## Contract

Generation must clone `grid_table_col_wrapper` and every descendant as the source of truth, then remap only approved business slots. A generated package must not hand-build a visually similar grid-table Collection with only a header `flex_grid` and item `flex_grid`.

Editable regions:

- `grid_table_col_title_wrapper`
- `op_normal`
- `grid_table_col_header`
- `grid_col_item`
- `grid_table_col_item_operations`

Locked regions:

- All descendants outside editable regions preserve the source control settings, style, layout, spacing, and typography.
- `grid_table_col_body` remains the Collection root and action host.
- `grid_table_col_header` and `grid_col_item` keep matching column counts, widths, and column property signatures.
- `grid_table_col_item_operations` is optional; when present, every button must bind to a valid action.
- Delete operations require the source-style confirmation temp variable and conditional delete flow.
- Form Report/Data Report display-only regions must not emit edit/delete operation controls.

## Validation Added

New registry/template artifact gates:

- `DASH_DATASET_GRID_TABLE_TEMPLATE_REFERENCE_MISSING`
- `DASH_DATASET_GRID_TABLE_TEMPLATE_SLOT_MISSING`
- `DASH_DATASET_GRID_TABLE_TEMPLATE_TEXT_HEADS_MISSING`
- `DASH_DATASET_GRID_TABLE_TEMPLATE_COLUMN_PARITY_INVALID`

New package materialization gates:

- `DASH_DATASET_GRID_TABLE_FULL_TEMPLATE_WRAPPER_MISSING`
- `DASH_DATASET_GRID_TABLE_FULL_TEMPLATE_SLOT_MISSING`
- `DASH_DATASET_GRID_TABLE_HEADER_ITEM_COLUMN_MISMATCH`
- `DASH_DATASET_GRID_TABLE_OPERATION_ACTION_MISSING`
- `DASH_DATASET_GRID_TABLE_COLLECTION_ACTIONS_MISSING`
- `DASH_DATASET_GRID_TABLE_DELETE_CONFIRMATION_TEMPVAR_MISSING`
- `DASH_DATASET_GRID_TABLE_DYNAMIC_CONTROLS_MISSING`
- `DASH_DATASET_GRID_TABLE_DISPLAY_ONLY_OPERATION_FORBIDDEN`

## Notes

The exported source package had two Text controls without a plain-string `attrs.heads.color`. The reference artifact fills those missing color values so the template can be linted as a complete generator source-of-truth. The source YAPK was not modified.

## Safety Boundary

No live Yeeflow writes, signing, install/import, upgrade, tags, releases, or plugin archives were performed as part of this training.
