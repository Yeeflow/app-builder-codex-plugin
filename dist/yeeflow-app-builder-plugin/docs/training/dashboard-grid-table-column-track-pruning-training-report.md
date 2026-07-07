# Dashboard Grid-Table Column Track Pruning Training Report

## Issue

`Doctor Operations Dashboard.ydp` exposed a grid-table Collection defect: the generated `grid_table_col_header` and repeated `grid_col_item` rows each contained only three actual header/item cells after schema cleanup, but both grids still kept the cloned template's six desktop column tracks in `attrs.columns["1"].list`.

This rendered three empty trailing table columns in Designer even though no business fields were mapped to those columns.

## Root Cause

The Dashboard Collection materializer correctly cloned the approved `collection_control_grid_table` golden reference and later pruned invalid header/item children, such as copied progress/status columns that did not match the selected source list schema.

However, the pruning step only updated:

- `grid_table_col_header.children`
- `grid_col_item.children`

It did not update the corresponding flex grid column track definitions:

- `grid_table_col_header.attrs.columns["1"].list`
- `grid_col_item.attrs.columns["1"].list`

Existing validators only compared header tracks to item tracks. Because both still had six tracks, validation passed even though the track count no longer matched the actual three visible cells.

## Required Generation Rule

After any Dashboard grid-table schema cleanup or business field remapping:

1. Prune invalid header and item cells together.
2. Recompute `grid_table_col_header` desktop column tracks to match `grid_table_col_header.children.length`.
3. Recompute `grid_col_item` desktop column tracks to match `grid_col_item.children.length`.
4. Keep header/item track definitions identical.
5. Do not keep the source template's original six tracks unless six real business columns remain.

## Required Validator Rule

Generated Dashboard packages must fail if:

```text
grid_table_col_header.attrs.columns["1"].list.length !== grid_table_col_header.children.length
```

or:

```text
grid_col_item.attrs.columns["1"].list.length !== grid_col_item.children.length
```

This is separate from the existing header/item track parity gate. A package can have matching stale tracks on both header and item grids while still rendering blank columns.

## Regression

The regression fixture intentionally leaves `grid_table_col_header` and `grid_col_item` with matching six-track desktop grids while their `children[]` arrays contain only three cells. The expected hard gate is:

```text
DASH_DATASET_GRID_TABLE_COLUMN_TRACK_COUNT_MISMATCH
```

The same rule applies to multiselect grid-table templates through:

```text
DASH_DATASET_GRID_MULTISELECT_COLUMN_TRACK_COUNT_MISMATCH
```
