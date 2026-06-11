# Generated Dashboard Baseline v3: Local Data-Bound Elements

## Package

- source export studied: `<downloads>/Generated Dashboard Simple Elements v2.yap`
- generated package: `generated-dashboard-data-bound-v3.yap`
- generated resource: `generated-dashboard-data-bound-v3-resource.json`
- generated app def: `generated-dashboard-data-bound-v3-app-def.json`
- generator: `generate-dashboard-data-bound-v3.mjs`

## What It Proves

This baseline proves a generated Yeeflow dashboard app can import and open with:

- one root app/listset
- one Type `103` dashboard page
- one local child data list
- two data-bound `summary` controls
- one dashboard `data-list` table control
- local sample rows used by both dashboard and list runtime views

## Resource Pattern

- root dashboard layout remains `Type: 103`
- `LayoutInResources[0].ID = LayoutID`
- `LayoutInResources[0].RefId = LayoutID`
- `Ext2 = "{\"src\":true}"`
- root navigation has duplicate dashboard entries plus a `Type: 1` child list entry
- dashboard `exts[]` contains summary runtime bindings
- `Resource.ReportIds` includes the summary control ids
- data table source list is stored directly in `attrs.data.list`

## ReplaceIds Rules

Include every local package id:

- root app/listset id
- dashboard layout id
- child list layout id
- child list id
- child list field ids
- local sample row ids, including `ListDatas` object keys

Do not remap tenant/user metadata such as `TenantID`, `CreatedBy`, or `ModifiedBy`.

## Validation Results

- `node --check generate-dashboard-data-bound-v3.mjs`: pass
- `node --check validate-yap-package.js`: pass
- package validation: `pass_with_warnings` with only `APP_THEME_EMPTY`
- graph validation: pass
- wrapper build: pass
- wrapper round-trip: decoded data equals source, package validation passes, graph validation passes

## Runtime Results

Tested at `https://<yourdomain>.yeeflow.com/`.

- import completed
- app appeared in Shared Workspace
- dashboard opened at `Dashboard | Generated Dashboard Data Bound v3`
- summary cards rendered `SGD 142500.00` and `20`
- dashboard data table rendered event rows
- `Event Planning` list opened and rendered sample rows without a visible query failure

## Generator Rules Learned

- Remap object keys as well as values because `ListDatas` sample row ids are object keys.
- Build generated `Resource.Data` from decoded app-def JSON to preserve large numeric ids as strings.
- Preserve `page.exts[]` summary bindings and `attrs.data.list` table binding.
- Keep generated native Title field metadata: `Status: 0`, `IsSystem: true`, `IsIndex: true`.
- Normalize generated list grid `LayoutView` with `layout`, `sort`, `query`, `rowColor`, and `filter`.
- Keep this baseline limited to summary/table data binding before introducing charts, filters, or actions.

## Known Gaps

- Export-back comparison remains open.
- Chart widgets are not proven by this baseline.
- Dashboard filters are not proven by this baseline.
- Service Desk Pro reconstruction should continue from this baseline in small isolated steps.
