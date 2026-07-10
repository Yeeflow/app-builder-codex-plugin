# Collection Grid Table Generation Standard

This standard applies only to the `collection_control_grid_table` pattern: a table-like Collection body paired with a header `flex_grid` and a repeated item `flex_grid`.

It is separate from `collection_control_responsive_card_grid`. Do not reuse card-style Collection rules for table-style generation, and do not use this standard for kanban, gallery, timeline, grouped, nested, or unknown Collection styles.

## Supported Formats And Surfaces

Supported formats:

- YAP
- YAPK, when the wrapper Resource decodes through strict or tolerant Brotli

Supported surfaces from the Projects Center sample:

- dashboard/page resources

YAP resource location:

- `Item.Layouts[].LayoutInResources[].Resource`

YAPK resource location:

- `Pages[].LayoutInResources[].Resource`

Approval-form-hosted and data-list-form-hosted grid/table Collections remain unproven until a separate export-backed study finds them.

## When To Use

Use this pattern for:

- dense row/column operational records
- task lists
- project tables
- ticket tables
- record lists that need table scanning plus responsive mobile behavior
- optional multiselect row operations

Do not use this pattern for:

- visual card feeds or activity cards
- kanban/gallery/timeline layouts
- grouped or nested Collections
- unknown non-table Collection requests

For ordinary tabular data where Collection row templating is not needed, prefer existing Data table/list/grid components.

## Required Structure

Generated grid/table Collection sections must include:

- caption/title container
- toolbar/search/add-action row when requested
- header `flex_grid`
- Collection body
- repeated item `flex_grid` as the first Collection child
- pagination metadata when paging is generated

## Header Grid And Item Grid Alignment

Header and item grids must:

- use `type: "flex_grid"`
- use `displayLabel: [null, false]`
- define desktop columns in `attrs.columns["1"].list[]`
- have the same desktop column count
- have the same desktop column width configuration
- define rows through `attrs.rows["1"].list[]`
- preserve compatible `cgap`, `rgap`, `content.border`, and `content.pd`

Export-proven widths:

- normal task table: `[2fr, 1fr, 1fr, 1fr, 1fr, 1fr]`
- multiselect task table: `[46px, 2fr, 1fr, 1fr, 1fr, 1fr, 1fr]`

For `collection_control_grid_table_with_multiselect`, the first track is a dedicated selection-only column and must remain exactly `46px` on desktop after business-field mapping or schema pruning. The primary title/business column is the second track and may use `2fr`; all following business columns default to `1fr`. Never apply the normal grid-table `2fr` first-track rule to `grid_table_col_header_select` or `grid_table_col_item_select`. Header and item grids must preserve the same ordered slot contract: selection cell first, primary title cell second, then mapped business cells.

Generated-final validation must fail:

- `COLLECTION_GRID_TABLE_HEADER_GRID_MISSING`
- `COLLECTION_GRID_TABLE_ITEM_GRID_MISSING`
- `COLLECTION_GRID_TABLE_COLUMN_COUNT_MISMATCH`
- `COLLECTION_GRID_TABLE_COLUMN_WIDTH_MISMATCH`
- `COLLECTION_GRID_TABLE_HEADER_CAPTION_VISIBLE`
- `COLLECTION_GRID_TABLE_ITEM_CAPTION_VISIBLE`
- `DASH_DATASET_GRID_MULTISELECT_SELECTION_COLUMN_CONTRACT_INVALID`

## Collection Body

Collection root must use:

- `type: "collection"`
- `label: "Collection"`
- `attrs.data.list`
- `attrs.data.link` when row open/edit navigation is generated
- `attrs.data.modalsize` when modal row open/edit is generated
- `attrs.data.sort[]` with valid fields
- `attrs.data.fulltext[]` when search is generated
- optional positive `attrs.data.ps` for records-per-page
- `attrs.layout.col: [null, 1]`
- `attrs.layout.rg`
- `attrs.layout.cg`
- optional `attrs.layout.hover`
- `attrs.pagination.p` when pagination is generated

## Row Binding And Expressions

Inside the item `flex_grid`:

- use `dynamic-field` and `dynamic-user` with `attrs.source: "3"` for current-row values
- use `variable_ctx` with `ctx: "__ctx_coll"` for expression-driven values
- progress values must bind to the current item, as observed with `Decimal2`
- status/text expression styling must reference current item fields, as observed with `Text1`
- row actions must include current item context and `ListDataID` when operating on a row

Generated-final validation must fail:

- `COLLECTION_GRID_TABLE_FIELD_BINDING_INVALID`
- `COLLECTION_GRID_TABLE_EXPRESSION_CONTEXT_MISSING`
- `COLLECTION_GRID_TABLE_PROGRESS_VALUE_BINDING_INVALID`
- `COLLECTION_GRID_TABLE_TEXT_EXPRESSION_INVALID`
- `COLLECTION_GRID_TABLE_ROW_ACTION_CONTEXT_MISSING`

## Search And Fulltext

When search is requested:

- render `search-filter`
- bind the Collection through `attrs.data.fulltext[]`
- reference valid source-list fields
- use page/filter variables that resolve

The Projects Center sample searched task fields represented as `Title`, `Text2`, and `Text6`.

Generated-final validation must fail:

- `COLLECTION_GRID_TABLE_SEARCH_FILTER_MISSING`
- `COLLECTION_GRID_TABLE_SEARCH_FIELDS_INVALID`

## Multiselect

Use multiselect only when requested and when actions can be generated with this export-proven shape.

Projects Center / Project Tasks is the export-proven source reference for the multiselect grid-table shape; it is not a business-domain restriction. The same template may be selected for any Dashboard dataset that needs dense table scanning plus multi-row selection and batch operations.

Required:

- leading checkbox column
- checkbox item cell with checked and unchecked icons
- selected temp variables
- selected count or bulk toolbar
- Collection root `attrs.actions[]`
- action `type: "coll"`
- current item `ListDataID` / `__ctx_coll` context
- step types limited to `setvar`, `listitem`, `confirm`, `setdatalist`, and `otheraction`

Generated-final validation must fail:

- `COLLECTION_GRID_TABLE_CHECKBOX_COLUMN_MISSING`
- `COLLECTION_GRID_TABLE_SELECTION_STATE_MISSING`
- `COLLECTION_GRID_TABLE_MULTISELECT_ACTION_INVALID`
- `COLLECTION_GRID_TABLE_BULK_ACTION_REFERENCE_INVALID`

## Responsive Rules

Responsive grid/table sections must:

- keep desktop/tablet table alignment
- hide the header grid on mobile with `attrs.common.hide[3] === true`
- define mobile item grid columns in `attrs.columns["3"].list[]`
- default the mobile item grid to one `1fr` column for this pattern
- use mobile item layout/card-like wrapping instead of a separate mobile header

Generated-final validation must fail:

- `COLLECTION_GRID_TABLE_MOBILE_HEADER_NOT_HIDDEN`
- `COLLECTION_GRID_TABLE_MOBILE_ITEM_GRID_COLUMNS_INVALID`
- `COLLECTION_GRID_TABLE_MOBILE_COLUMN_SPAN_INVALID`
- `COLLECTION_GRID_TABLE_RESPONSIVE_LAYOUT_INVALID`

## Pagination And Records Per Page

When pagination is requested:

- use `attrs.pagination.p`
- use a positive `attrs.data.ps` only when a page size is explicitly generated
- keep search/fulltext compatible with pagination
- use boolean `attrs.data.limit` only when limit-records metadata is present

Generated-final validation must fail:

- `COLLECTION_GRID_TABLE_PAGINATION_INVALID`
- `COLLECTION_GRID_TABLE_RECORDS_PER_PAGE_INVALID`
- `COLLECTION_GRID_TABLE_LIMIT_RECORDS_INVALID`

## Proof Rules

Schema validation alone is not enough. Generated-final/import-qualified grid/table Collections must pass the Collection validator in grid/table mode.

This study is export-proven and validator-backed for the Projects Center dashboard/page pattern. It does not prove all Collection controls, all table variants, or all runtime action mutations.
