# Generated Dashboard Baseline v2: Simple Elements

Package: `generated-dashboard-simple-elements-v2.yap`

Status: successful static dashboard runtime baseline.

## Source Export

Studied read-only:

- `/Users/Renger/Downloads/Test Dashboard Only (2).yap`

This export extends the empty dashboard baseline by adding static page-builder content. It still has no data lists, forms, reports, AI modules, document libraries, or data-bound dashboard `exts`.

## What Changed From v1

Compared with `Test Dashboard Only.yap` and `generated-dashboard-minimal-v1.yap`:

| Area | v1 Empty Baseline | v2 Simple Elements |
| --- | --- | --- |
| Child resources | none | none |
| Forms/reports/modules | none | none |
| Dashboard layout | Type `103`, `LayoutInResources: []` | Type `103`, one `LayoutInResources` entry |
| Page resource ID | none | `ID = RefId = LayoutID` |
| Page resource payload | none | JSON page resource |
| Page keys | none | `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts` |
| Page version | none | `ver: 2` |
| `filterVars` | none | `[]` |
| `tempVars` | none | `[]` |
| `exts` | none | `[]` |
| ReplaceIds | root + dashboard | root + dashboard |
| Navigation | duplicate Type `103` dashboard entries | unchanged |
| AppComponents/AppThemes | empty arrays | empty arrays |

## Element Inventory

Observed static component counts:

| Type | Count | Classification |
| --- | ---: | --- |
| `container` | 34 | layout/static visual |
| `heading` | 24 | text/heading |
| `text-editor` | 1 | rich text |
| `action_button` | 2 | static action/button |
| `flex_grid` | 3 | layout/grid |
| `icon` | 8 | static icon |
| `line` | 1 | divider |
| `picture` | 3 | image |

No chart/table/data-bound widget was present. No large data-source IDs were found inside the page JSON.

## Reusable Pattern

For static simple dashboard elements:

- keep the proven root dashboard shell
- add one `LayoutInResources` entry to the Type `103` layout
- set `LayoutInResources[0].ID = LayoutID`
- set `LayoutInResources[0].RefId = LayoutID`
- keep the dashboard `LayoutID` in `ReplaceIds`
- store page JSON in `LayoutInResources[0].Resource`
- page JSON must include:
  - `children`
  - `attrs`
  - `title`
  - `ver`
  - `filterVars`
  - `tempVars`
  - `exts`
- use `filterVars: []`, `tempVars: []`, and `exts: []` when no data-bound widgets are present

## Validation Results

Passed:

- `node --check generate-dashboard-simple-elements-v2.mjs`
- `node --check validate-yap-package.js`
- decoded resource package validation: `pass_with_warnings` for `APP_THEME_EMPTY`
- decoded resource graph validation: `pass`
- wrapper build and round-trip validation: `pass`
- wrapped `.yap` package validation: `pass_with_warnings` for `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: `pass`
- dashboard inspection on wrapped `.yap`: `pass`

## Runtime Results

Tested at `https://<yourdomain>.yeeflow.com`.

Observed:

- file upload succeeded
- metadata dialog parsed title, description, and icon
- import completed
- app appeared in Shared Workspace after refresh
- app opened
- dashboard navigation rendered
- static elements rendered, including hero headings, buttons, rich text, icon tiles, picture elements, and gallery cards

Runtime IDs:

| Generated ID | Runtime ID | Meaning |
| --- | --- | --- |
| `2360010000000000000` | `2054189247378501633` | root app/listset |
| `2360010000000000001` | `2054189256791703552` | dashboard Type `103` layout/page |

## Known Gaps

- Export-back comparison is still pending.
- Data-bound dashboard widgets are not proven.
- Dashboard `exts` bindings are not proven.
- Charts, tables, reports, filters, and Service Desk Pro-style dashboard actions remain future stages.
