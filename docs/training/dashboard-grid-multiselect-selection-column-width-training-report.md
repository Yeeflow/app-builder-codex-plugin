# Dashboard Grid-Table Multiselect Selection Column Width Training

## Incident

The generated `Legal Intake Workbench.ydp` used `collection_control_grid_table_with_multiselect` for the `Triage Queue`. After business-field mapping, both `grid_table_col_header` and `grid_col_item` contained four cells, but their desktop track definitions were emitted as:

```text
[2fr, 1fr, 1fr, 1fr]
```

The first cell was not the primary request/title field. It was the dedicated selection-only container (`grid_table_col_header_select` / `grid_table_col_item_select`). The result was an oversized empty checkbox column.

## Root Cause

`pruneGridTableColumnsBySchema()` correctly removed unused template cells, then called the generic `normalizeGridColumnDefinition()` helper. That helper assumes a normal grid-table whose first cell is the primary business/title column, so it always assigns the first track `2fr`.

The validator checked header/item width parity and track-count parity, but did not check the semantic role of the first two tracks. Because both grids were wrong in the same way, generated-final validation passed.

## Golden Reference Contract

For `collection_control_grid_table_with_multiselect`:

1. The first header/item cells are dedicated selection controls.
2. The first desktop track is fixed at `46px`.
3. The second header/item cells are the primary title/business cells.
4. The second desktop track is `2fr`.
5. Remaining mapped business columns default to `1fr`.
6. Header and item track arrays must match exactly and their lengths must match the actual child-cell counts.
7. The ordinary grid-table `[2fr, 1fr...]` normalizer must never be applied to a checkbox-only leading cell.

## Generator Fix

`normalizeGridColumnDefinition()` now accepts a `leadingSelectionColumn` contract. Schema pruning enables it only when the first remaining header and item cells preserve the export-proven identities `grid_table_col_header_select` and `grid_table_col_item_select`. The regenerated Legal Intake fixture emits:

```text
[46px, 2fr, 1fr, 1fr]
```

Ordinary grid tables retain `[2fr, 1fr...]`.

## Validator Hard Gate

The Dashboard dataset-presentation validator now rejects source templates and generated packages unless multiselect header/item grids preserve:

- selection cells in position 1;
- title cells in position 2;
- leading tracks `[46px, 2fr]` in both grids.

Generated failure code:

```text
DASH_DATASET_GRID_MULTISELECT_SELECTION_COLUMN_CONTRACT_INVALID
```

## Regression Coverage

- Source-template mutation from `46px` to `2fr` must fail.
- Generated header/item arrays that both use `2fr` for the checkbox-only first column must fail even though parity matches.
- Full-app materialization with only three business fields must prune the cloned template to four cells and emit `[46px, 2fr, 1fr, 1fr]` in both grids.
