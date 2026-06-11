# Generated Dashboard Collection Baseline v1

Date: 2026-05-13

## What This Proves

This baseline proves two generated Yeeflow dashboard Collection patterns from the Stage M export study:

- card/grid Collection bound to a local data list
- table-style Collection using a `flex_grid` header and a repeated `flex_grid` row inside the Collection item template
- full-text search binding for a table-style Collection
- local list `New Ticket` action button from a dashboard page
- inline/grow dashboard header action layout for a Collection page
- per-item dynamic show rules inside a Collection item template

Both packages were validated, wrapped, imported into `https://<yourdomain>.yeeflow.com`, opened, and checked in runtime.

## Packages

| Package | Fresh ID Family | Runtime Result |
| --- | --- | --- |
| `generated-dashboard-collection-card-v1.yap` | `260` | Pass |
| `generated-dashboard-collection-table-v3.yap` | `262` | Pass |
| `generated-dashboard-collection-search-v5.yap` | `264` | Pass |
| `generated-dashboard-collection-search-button-v6.yap` | `265` | Pass |
| `generated-dashboard-collection-grid-v7.yap` | `266` | Pass |
| `generated-dashboard-collection-grid-display-v8.yap` | `267` | Pass |

The failed intermediate table package used family `261` and is not a baseline. It imported, but its header and row cells stacked vertically because the generated `flex_grid` schema was wrong.

Runtime review also found that the table header and repeated row grids must turn off Display caption. The corrected search/table package uses fresh family `264` and sets `displayLabel: [null, false]` on both table `flex_grid` controls.

## Resources Included

Each passing package contains:

- one root app/listset
- one Type `103` dashboard page
- one local `Support Tickets` data list
- six sample Support Tickets records
- no approval forms
- no workflows
- no reports
- no AI modules, connections, document libraries, or external dependencies

## Collection Rules Learned

Collection control:

- `type: "collection"`
- data source: `attrs.data.list`
- repeated item template: first child of the Collection
- local list source must resolve inside the same `.yap`

Dynamic fields inside the item template:

- use `attrs.source: "3"`
- use `attrs["obj-f"]` for the source field name
- source fields must resolve against the Collection data list

Collection item expressions:

- use `exprType: "variable_ctx"`
- use `ctx: "__ctx_coll"`
- `dateFormat(...)` can wrap a Collection item date expression

Conditional style:

- stored in `attrs.control_display`
- generated style action must use JSON string `actions.attrs.action_style`
- conditional style actions are proven

Dynamic show:

- stored in `attrs.control_display`
- use `actions.type: 1`
- use `actions.attrs.style_regulation_action: "style_regulation_action_show"`
- keep `actions.attrs.action_style: null`
- formula fields using `ctx: "__ctx_coll"` must resolve to the Collection source list
- runtime v8 proves this can hide Assigned Team for Medium records while showing it for non-Medium records
- dynamic hide action remains unproven

Local New Ticket action:

- use `type: "action_button"`
- use `attrs["action-type"]: "5"`
- bind `attrs.data.list` to the local Support Tickets list with `AppID`, `ListSetID`, and `ListID`
- runtime proof opens the local list add panel; cancel during testing to avoid creating records

## Table-style Flex Grid Rule

Dashboard `flex_grid` columns must use the export-shaped schema:

- `attrs.columns`
- `attrs.rows`
- `attrs.cgap`
- `attrs.cgapU`
- `attrs.content`

Do not put columns under `attrs.layout.cols`. That shape passed older validation but rendered vertically in Yeeflow runtime.

For table-style Collection header and repeated row grids, also set:

- `displayLabel: [null, false]`
- `nv_label` to a meaningful designer-only name

## Validation Results

Card v1:

- `node --check generate-dashboard-collection-card-v1.mjs`: pass
- `validate-yap-package.js`: pass with `APP_THEME_EMPTY` warning
- `validate-yap-graph.js`: pass
- `build-yap-wrapper.js`: pass
- wrapper round-trip: pass

Table v3:

- `node --check generate-dashboard-collection-table-v3.mjs`: pass
- `validate-yap-package.js`: pass with `APP_THEME_EMPTY` warning
- `validate-yap-graph.js`: pass
- `build-yap-wrapper.js`: pass
- wrapper round-trip: pass

Search v5:

- `node --check generate-dashboard-collection-search-v5.mjs`: pass
- `validate-yap-package.js`: pass with `APP_THEME_EMPTY` warning
- `validate-yap-graph.js`: pass
- `build-yap-wrapper.js`: pass
- wrapper round-trip: pass
- wrapped `.yap` validation: pass with `APP_THEME_EMPTY` warning
- wrapped `.yap` graph validation: pass

Search Button v6:

- `node --check generate-dashboard-collection-search-button-v6.mjs`: pass
- `validate-yap-package.js`: pass with `APP_THEME_EMPTY` warning
- `validate-yap-graph.js`: pass
- `build-yap-wrapper.js`: pass
- wrapper round-trip: pass
- wrapped `.yap` validation: pass with `APP_THEME_EMPTY` warning
- wrapped `.yap` graph validation: pass

Grid v7:

- `node --check generate-dashboard-collection-grid-v7.mjs`: pass
- `validate-yap-package.js`: pass with `APP_THEME_EMPTY` warning
- `validate-yap-graph.js`: pass
- `build-yap-wrapper.js`: pass
- wrapper round-trip: pass
- wrapped `.yap` validation: pass with `APP_THEME_EMPTY` warning
- wrapped `.yap` graph validation: pass

Grid Display v8:

- `node --check generate-dashboard-collection-grid-display-v8.mjs`: pass
- `validate-yap-package.js`: pass with `APP_THEME_EMPTY` warning
- `validate-yap-graph.js`: pass
- `build-yap-wrapper.js`: pass
- wrapper round-trip: pass
- wrapped `.yap` validation: pass with `APP_THEME_EMPTY` warning
- wrapped `.yap` graph validation: pass

Validator improvement:

- `validate-yap-package.js` now rejects `flex_grid` controls that use `attrs.layout.cols` instead of `attrs.columns`.
- The failed table v2 package is now caught by `DASHBOARD_FLEX_GRID_COLUMNS_SCHEMA_INVALID`.
- `validate-yap-package.js` now checks dashboard filter controls with `binding: "__filter_<id>"` against `page.filterVars`.
- `validate-yap-package.js` now rejects table-style Collection `flex_grid` controls labelled `Table header` or `Table row` unless Display caption is disabled.

## Runtime Results

Card v1:

- imported successfully
- app opened
- dashboard rendered
- six Support Tickets cards appeared
- title, priority, status, and assigned team values resolved
- priority badge conditional styles appeared

Table v3:

- imported successfully
- app opened
- dashboard rendered
- header columns appeared horizontally
- each Support Ticket rendered as one Collection row
- title, ticket id, priority, status, team, and formatted created date resolved
- priority badge conditional styles appeared

Search v5:

- imported successfully
- app opened
- dashboard rendered with hidden table-grid captions
- table header and rows remained horizontal
- search-filter control rendered
- typing `VPN` narrowed the Collection to `VPN access fails for sales team`

Search Button v6:

- imported successfully
- app opened
- table-style Collection and search-filter still rendered
- New Ticket button rendered
- clicking New Ticket opened the local Support Tickets add panel
- add panel was cancelled without saving a record

Grid v7:

- imported successfully
- app opened
- card/grid Collection rendered as two rows of three ticket cards
- priority/status/team values resolved
- New Ticket button rendered
- clicking New Ticket opened the local Support Tickets add panel
- add panel was cancelled without saving a record

Grid Display v8:

- imported successfully
- app opened
- card/grid Collection rendered as two rows of three ticket cards
- New Ticket button rendered inline/right aligned and opened the local Support Tickets add panel
- add panel was cancelled without saving a record
- Assigned Team appeared for non-Medium records with Created Time present
- Assigned Team was hidden for Medium records, proving the per-item dynamic show rule

## Known Gaps

- Collection dynamic show display rules are proven; dynamic hide action remains unproven.
- Collection sorting, pagination, and empty-state settings remain unproven.
- Other source types such as reports or external resources remain out of scope.

## Next Safe Test

Study a focused export that contains one native hide dynamic display rule on a Collection item container, or a focused export with pagination/sort settings. Do not generate hide behavior from the conditional style or show-action patterns.
