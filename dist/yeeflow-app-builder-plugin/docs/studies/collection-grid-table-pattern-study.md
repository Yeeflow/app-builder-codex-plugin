# Collection + Grid Table Pattern Study

## Scope

This study covers the `collection_control_grid_table` pattern only. It is separate from `collection_control_responsive_card_grid` and must not be used as proof for card, kanban, grouped, nested, timeline, gallery, or unknown Collection styles.

## Samples Inspected

| Sample | Format | Decode result | Notes |
|---|---|---|---|
| `Projects Center_1.yap` | YAP | wrapper parsed; `[______gizp______]` Resource decoded; `Resource.Data` parsed | app title `Projects Center_1`; root pages found under `Item.Layouts[]` |
| `Projects Center_1-v1.5 Collection Grid Tasks.yapk` | YAPK | wrapper parsed; Resource decoded through base64 plus tolerant Brotli | strict Brotli ended with `Z_BUF_ERROR`; decoded object is AppPackageInfo |

Raw `Resource`, raw `Sign`, decoded payloads, tenant/workspace/upload IDs, private URLs, screenshots, and raw API responses were not committed. The first diagnostic attempt used an unsafe local large-number replacer and Node printed an exception excerpt; no such payload was stored or committed, and later inspection used structural redaction only.

## Target Pages

| Target page/dashboard | Found in YAP | Found in YAPK | Collection count | Grid count | Notes |
|---|---:|---:|---:|---:|---|
| All tasks | yes | yes | 1 | 2 `flex_grid` controls | normal table body, search, add action, pagination |
| All tasks - Multiple select | yes | yes | 1 | 2 `flex_grid` controls | adds checkbox column, selected state, bulk toolbar/actions |

YAP locations:

- `Item.Layouts[].LayoutInResources[].Resource`

YAPK locations:

- `Pages[].LayoutInResources[].Resource`

## Pattern Name

Use `collection_control_grid_table`.

Definition:

- a caption/header area and toolbar sit above the table
- a header `flex_grid` represents table headings
- a `collection` control represents the table body
- the Collection item template contains one repeated `flex_grid`
- each repeated item grid behaves like a table row
- header grid and item grid use matching desktop column count and width configuration
- mobile hides the header grid and turns each item grid into a card-like row

## Shared Structure

Both target pages use:

- outer page/container wrapper
- title heading
- toolbar/search row with `search-filter` placeholder `Search tasks`
- `action_button` for Add Task
- header `flex_grid`
- Collection body
- item-template `flex_grid`
- pagination through `attrs.pagination.p`

The normal page uses six columns:

- Title
- Assignee
- Start date
- End date
- Completion (%)
- Status

The multiple-select page prepends a 46px checkbox column and keeps the remaining six columns aligned.

## Header Grid Rules

Export-proven control type: `flex_grid`.

Required shape:

- `displayLabel: [null, false]`
- `attrs.columns["1"].list[]`
- `attrs.rows["1"].list[]`
- `attrs.cgap`
- `attrs.rgap`
- `attrs.content.border`
- `attrs.content.pd`
- `attrs.common.hide: [null, null, null, true]` for mobile

Column widths:

- normal table desktop: `[2fr, 1fr, 1fr, 1fr, 1fr, 1fr]`
- multiselect desktop: `[46px, 2fr, 1fr, 1fr, 1fr, 1fr, 1fr]`

## Collection Body Rules

Collection root:

- `type: "collection"`
- `label: "Collection"`
- `attrs.data.list` resolves to the Tasks list
- `attrs.data.link` points to a task detail/edit layout
- `attrs.data.modalsize: 2`
- `attrs.data.sort[]` uses `SortName` and `SortByDesc`
- `attrs.data.fulltext[]` references searchable fields
- multiselect page includes `attrs.data.ps: 16`
- `attrs.layout.col: [null, 1]`
- `attrs.layout.rg`, `attrs.layout.cg`
- optional export-proven `attrs.layout.hover.bgColor`
- `attrs.pagination.p`

## Item Grid Rules

The first Collection child is a repeated `flex_grid`.

Required:

- `displayLabel: [null, false]`
- desktop columns exactly match the header grid
- mobile columns are explicit; this sample uses `attrs.columns["3"].list` with one `1fr` column
- row content has border/padding/align metadata
- row controls bind to current item through `attrs.source: "3"` dynamic controls or `variable_ctx` with `ctx: "__ctx_coll"`

Observed row fields:

- title: `dynamic-field` on `Title`
- assignee: `dynamic-user` on `Text2`
- start date: `dynamic-field` on `Datetime1`
- end date: `dynamic-field` on `Datetime2`
- completion: `progress` value expression using current item `Decimal2`
- status: heading/text expression and conditional style rules using current item `Text1`

## Search And Fulltext

The visible search control is `search-filter`. The Collection carries `attrs.data.fulltext[]` with field references. The studied sample uses three searchable fields, represented in the normalized reference as placeholders plus the field names `Title`, `Text2`, and `Text6`.

## Multiselect

The multiple-select page adds:

- leading 46px checkbox column in header and item grids
- item checkbox cell with checked/unchecked icon controls
- current-item `ListDataID` expression
- selected temp variables
- Collection root `attrs.actions[]` with `type: "coll"`
- step types: `setvar`, `listitem`, `confirm`, `setdatalist`, `otheraction`
- bulk toolbar buttons above the table for selected-item operations

## Responsive Behavior

Desktop/tablet preserve table alignment by matching header and row grid columns. Mobile hides the header grid through `attrs.common.hide[3] === true` and uses the item grid mobile columns. This sample uses one mobile item column, making each row render card-like.

## Hover Effect

The Collection root stores row hover styling at `attrs.layout.hover`, observed as a background color change. Hover is optional, but generated hover styling must use this export-proven location.

## YAP vs YAPK

| Area | YAP shape | YAPK shape | Common rule | Format-specific rule |
|---|---|---|---|---|
| wrapper | YAP wrapper with gzip `Resource` | AppExportPackageInfo with base64 Brotli `Resource` | inspect decoded page resources only | YAPK may require tolerant Brotli after `Z_BUF_ERROR` |
| page location | `Item.Layouts[].LayoutInResources[].Resource` | `Pages[].LayoutInResources[].Resource` | target pages contain the same control tree | validators must inspect the right wrapper location |
| header grid | `flex_grid` before Collection | same | hidden caption, matching columns | none beyond location |
| Collection body | `collection` with item `flex_grid` | same | list, fulltext, sort, pagination, hover | none beyond location |
| multiselect | root `attrs.actions[]`, row icons, toolbar actions | same | selected state and current item context | none beyond location |

## Differences From Card-Style Collection

Card-style Collection uses `attrs.layout.col: [null, null, 2, 1]` and a visual card item template. Grid/table Collection uses `attrs.layout.col: [null, 1]`, a header `flex_grid`, and a repeated item `flex_grid`. These patterns are not interchangeable.

## Proof Boundaries

Proven:

- YAP and YAPK dashboard/page usage for the two Projects Center task pages
- normal grid/table rows
- multiselect grid/table rows
- search/fulltext
- current item expressions
- progress value binding
- mobile header hidden and item one-column behavior
- pagination shape

Still separate/unproven:

- approval-form-hosted grid/table Collection
- data-list-form-hosted grid/table Collection
- grouped/nested/table variants beyond the studied header-grid plus item-grid pattern
- runtime mutation semantics beyond export-backed action shape
