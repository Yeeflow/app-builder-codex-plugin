# Dashboard Feature Pattern Study

Source exports studied:

- `/Users/Renger/Downloads/Service Desk Pro (1).yap`
- `/Users/Renger/Downloads/Test Dashboard Only.yap`
- `/Users/Renger/Downloads/Knowledge Base_1.yap`

Focus pages:

- `Executive Dashboard`
- `Settings`

This study follows `yeeflow-feature-learning-orchestrator`: real export first, read-only study, validator update, smallest generated test, validation, wrapper build, runtime import, and baseline documentation.

## Minimal Dashboard-Only Baseline

`Test Dashboard Only.yap` is the current source of truth for the smallest importable dashboard package.

Observed shape:

- root app/listset only; `Data.Childs.length = 0`
- no forms, reports, sample rows, AI modules, connections, document libraries, or approval workflows
- one root `Data.Item.Layouts[]` entry
- dashboard layout `Type: 103`
- dashboard layout `LayoutView: null`
- dashboard layout `Ext2: "{\"src\":true}"`
- dashboard layout `LayoutInResources: []`
- root `ListModel.LayoutView.sort[]` contains two `Type: 103` entries, both targeting the dashboard `LayoutID`
- `ReplaceIds` contains exactly the dashboard `LayoutID` and root app/ListSet `ListID`
- `AppTags`, `AppMetadatas`, `AppThemes`, and `AppComponents` are present as arrays but empty

Important correction: a minimal dashboard-only app does not require embedded dashboard/page JSON under `LayoutInResources`. Earlier generator attempts treated `LayoutInResources[0].Resource` as mandatory for all Type `103` pages; the minimal export proves that is too strict.

Generated proof package:

- `generated-dashboard-minimal-v1-resource.json`
- `generated-dashboard-minimal-v1-app-def.json`
- `generated-dashboard-minimal-v1.yap`

Runtime result:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace after refresh
- opened as `Dashboard | Generated Dashboard Minimal v1`
- rendered the empty dashboard page shell with `OPEN PAGE DESIGNER`

## Simple Static Elements Baseline

`Test Dashboard Only (2).yap` is the next source of truth after the empty dashboard baseline.

Observed shape:

- same root app/listset and duplicate Type `103` navigation pattern as v1
- no child resources, forms, reports, AI modules, connections, or document libraries
- one dashboard `LayoutInResources` entry
- `LayoutInResources[0].ID = LayoutID`
- `LayoutInResources[0].RefId = LayoutID`
- `LayoutInResources[0].Resource` contains page JSON
- `ReplaceIds` still contains only root app/ListSet ID and dashboard `LayoutID`
- page JSON keys: `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts`
- page JSON uses `ver: 2`, `filterVars: []`, `tempVars: []`, and `exts: []`

Element types observed:

- layout/static visual: `container`, `flex_grid`, `line`
- text: `heading`, `text-editor`
- static actions: `action_button`, containers with `action-type: "2"` and `link.url: "#"`
- images: `picture`, background image config under `attrs.common.background`
- icons: `icon`

Generated proof package:

- `generated-dashboard-simple-elements-v2-resource.json`
- `generated-dashboard-simple-elements-v2-app-def.json`
- `generated-dashboard-simple-elements-v2.yap`

Runtime result:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace after refresh
- opened as `Dashboard | Generated Dashboard Simple Elements v2`
- rendered hero text, static buttons, rich text, icon/link tiles, pictures, and gallery cards

## Real Export Inventory

`Service Desk Pro (1).yap` is a wrapped `.yap` export with:

- root app/listset: `Service Desk Pro`, ListSetID `2054077087595905025`, AppID `41`
- child resources: 12
- data lists: 10
- approval/list workflows: 4 total forms, including one approval form
- reports/data resources: 2
- Type `103` dashboard/app pages: 4
- `ReplaceIds`: 342
- no AI agents, copilots, connections, knowledges, or document dependencies detected

Read-only outputs created:

- `service-desk-pro-dashboard-study.metadata.json`
- `service-desk-pro-dashboard-study.metadata.md`
- `service-desk-pro-dashboard-study.inspection.json`
- `service-desk-pro-dashboard-study.inspection.md`
- `service-desk-pro-dashboard-pages.inspection.json`
- `service-desk-pro-dashboard-pages.inspection.md`
- `service-desk-pro-dashboard-study.graph-after-dashboard-rules.json`
- `service-desk-pro-dashboard-study.graph-after-dashboard-rules.md`

## Dashboard Resource Location

Dashboard pages are root `Data.Item.Layouts[]` records with:

- `Type: 103`
- `LayoutView: null`
- page JSON stored in `LayoutInResources[0].Resource`
- root navigation entries in `Data.Item.ListModel.LayoutView.sort[]` using `Type: 103` and `ListID = LayoutID`

Observed focus pages:

| Page | LayoutID | Direct Children | Page Keys |
| --- | --- | ---: | --- |
| Settings | `2054077096417705984` | 2 | `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts` |
| Executive Dashboard | `2054077096417705985` | 1 | `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, `exts`, `actions` |

Important compatibility observation: the Service Desk Pro export has `LayoutInResources[0].ID` and `RefId` equal to the page `LayoutID`, and those IDs are in `ReplaceIds`. The minimal dashboard export has no `LayoutInResources` entries at all. Treat embedded page-resource ID behavior as pattern-specific until more export-back evidence is collected.

## Settings Page Pattern

`Settings` is a dashboard/app page used as a navigation and action hub.

Observed structure:

- component types: `section`, `section-column`, `container`, `heading`, `flex_grid`, `icon`
- no dashboard `exts`
- no `filterVars`
- no `tempVars`
- multiple `container.attrs.data.form` action targets
- grouped tiles such as `Ticket Management`, `Asset and Service Management`, and `Service Level Agreement (SLA) Management`

Risk:

- Several Settings tile actions reference external ListSetID `1825912053297844224` with `ProcKey: ExNT`.
- The validator now reports these as `DASHBOARD_FORM_EXTERNAL_LISTSET_REFERENCE`.
- Generated dashboards should either omit these external actions, include the referenced resource pattern explicitly, or stop before final generation.

## Executive Dashboard Pattern

`Executive Dashboard` is the main analytics page.

Observed structure:

- `filterVars`: 2
  - `f_SubmittedPeriod`
  - `filter_Team`
- `tempVars`: 14
  - examples: `vTotalSubmitted`, `vTicketsResolved`, `v_TicketsOpen`, `v_FirstResponseHoursAVG`, `v_ResolutionSLACompliance`
- control types include:
  - `select-filter`
  - `relative-period`
  - `summary`
  - `pie-chart`
  - `bar-chart`
  - `line-chart`
  - `opendashboard`
- `exts`: 26 entries
  - summary/query configurations with `AppID`, `ListID`, `ListSetID`, `settings.values`, `preConditions`, and `Conditions`
  - chart configurations with `chartType`, `settings.rows`, `settings.values`, and optional `sort`
- `actions`: includes `opendashboard` steps targeting `Drill-down Tickets List` page `2054077096421900288`

Observed data-source references:

| Resource | ID |
| --- | --- |
| Service Desk Pro root listset | `2054077087595905025` |
| Support Tickets | `2054077096447066112` |
| Request Types | `2054077096749056000` |
| Ticket Categorise | `2054077096774221824` |
| Support Teams | `2054077097130737664` |
| SLA Report | `2054077097487253504` |
| SLA Compliance Rate | `2054077097575333889` |

## Validator Rules Added

Updated files:

- `validate-yap-package.js`
- `validate-yap-graph.js`

New package checks:

- empty `LayoutInResources` is accepted for a minimal dashboard-only Type `103` page when `Ext2` parses as `{ "src": true }` and the `LayoutID` is in `ReplaceIds`
- `AppThemes` must be an array, but an empty array is now a warning rather than a generator-stopping error because the minimal dashboard-only export uses `AppThemes: []`
- Type `103` page `filterVars` and `tempVars` are arrays when present.
- Type `103` page `exts` is an array when populated; an empty object is accepted for simple app-page shells.
- `summary.attrs.save_var` resolves to a declared `tempVars[].id`.
- `attrs.data.list.ListID` resolves to an included list/resource.
- `exts[].attr.ListID` and nested row `listid`/`ListID` values resolve.
- `opendashboard` action `PageID` resolves to a Type `103` root page.
- external form/listset action references are reported as dependencies in compatibility mode and errors in generator mode.

New graph edges:

- `dashboardControlSource`
- `dashboardConfigSource`
- `dashboardActionPage`

## Generator Rules Learned

For the first safe generated dashboard:

1. Start from the minimal dashboard-only export pattern.
2. Include one root app/listset and one Type `103` root dashboard page.
3. Use `LayoutInResources: []` for the first import test.
4. Set dashboard `LayoutView: null`.
5. Set dashboard `Ext2: "{\"src\":true}"`.
6. Keep root navigation entries pointing to the dashboard `LayoutID`.
7. Include only the root app/ListSet ID and dashboard `LayoutID` in `ReplaceIds`.
8. Preserve tenant/user metadata such as `TenantID`, `CreatedBy`, and `ModifiedBy`; do not remap these into the local resource ID family.
9. Keep `AppTags`, `AppMetadatas`, `AppThemes`, and `AppComponents` as arrays even when empty.
10. Use fresh local IDs for every generated import-test package.
11. Add child lists, dashboard page JSON, widgets, `exts`, and data-source bindings only after the empty dashboard shell imports and opens.

## Knowledge Base Dashboard Pattern

`Knowledge Base_1.yap` adds a compact app-template pattern that combines local data lists and dashboard Collections without approval forms, workflows, reports, AI modules, connections, or document libraries.

Observed source shape:

- root app/listset `Knowledge Base_1`
- local lists: `Categories`, `Sections`, `Articles`
- dashboard pages: `Home Page`, `Search`, `Admin`
- Home Page uses search, Article Collection, Category Collection, and a nested category-to-article Collection
- Search page uses a search filter, fulltext Collection binding, and collection item expressions over article system fields
- Admin page uses static cards with application URL expressions

Runtime-proven generated v4 safe scope:

- root app/listset
- local `Categories` and `Articles` lists
- plain text article category labels
- one Home dashboard page
- article Collection with fulltext search
- category Collection
- dynamic-field controls inside Collection item templates
- `nv_label` names

Deferred from v1:

- `Sections`
- richtext article body
- icon-upload/image controls
- article detail links
- nested category-to-article Collection filters
- Search page query-param behavior
- Admin action cards

Runtime status:

- `knowledge-base-generated-v1.yap` uploaded, imported, and opened, but rendered Yeeflow's empty component shell instead of the generated app content
- `knowledge-base-generated-v2.yap` and `knowledge-base-generated-v3.yap` imported and rendered Home/Categories, but Articles stayed on the loading spinner
- `knowledge-base-generated-v4.yap` imported successfully, opened as `Knowledge Base Generated v4`, rendered article/category Collection cards on Home, and opened both `Categories` and `Articles` with sample rows
- v4 is the first successful Knowledge Base runtime baseline; it uses native `Title.FieldIndex: 0`, corrected child-list metadata, and no article-to-category lookup field

Use `docs/knowledge-base-template-pattern-study.md`, `docs/generated-knowledge-base-baseline-v4.md`, and `skills/installed/yeeflow-dashboard-generator/references/knowledge-base-pattern.md` before expanding this template.
12. Do not include Settings-style external form actions until their external ListSet/ProcKey dependency is understood.

## Stop Conditions

Stop before final generation if:

- dashboard `exts` reference lists not included in the package
- summary `save_var` does not resolve to a `tempVars` id
- an `opendashboard` action references a missing Type `103` page
- dashboard actions reference external forms/listsets without an explicit dependency plan
- generated child list `Title` is not native/system/indexed
- root navigation cannot resolve the dashboard page
- `ReplaceIds` omits local graph IDs
- tenant/user metadata has been remapped into a generated local ID family
- local `LayoutInResources[].ID` values reuse IDs from a prior import-test package
- validators fail

## First Safe Generation Test

Generated files:

- `generate-dashboard-minimal-v1.mjs`
- `generated-dashboard-minimal-v1-resource.json`
- `generated-dashboard-minimal-v1-app-def.json`
- `generated-dashboard-minimal-v1.yap`

Minimal shape:

- one app/listset
- one dashboard page: `Dashboard`
- no child source list
- no widgets
- no dashboard `exts`
- no approval form
- no external actions
- no AI, connections, knowledges, or document dependencies

Validation:

- `node --check generate-dashboard-minimal-v1.mjs`: pass
- `node --check decode-yap-resource.js`: pass
- `node --check inspect-dashboard-pages.js`: pass
- `node --check validate-yap-package.js`: pass
- `node --check validate-yap-graph.js`: pass
- `node validate-yap-package.js generated-dashboard-minimal-v1-resource.json --mode generator --stage final`: pass with warning `APP_THEME_EMPTY`
- `node validate-yap-graph.js generated-dashboard-minimal-v1-resource.json --mode generator --stage final`: pass
- `node build-yap-wrapper.js generated-dashboard-minimal-v1-resource.json generated-dashboard-minimal-v1.yap ...`: pass, including wrapper round-trip checks
- `node validate-yap-package.js generated-dashboard-minimal-v1.yap --mode generator --stage final`: pass with warning `APP_THEME_EMPTY`
- `node validate-yap-graph.js generated-dashboard-minimal-v1.yap --mode generator --stage final`: pass

Runtime import evidence:

- `generated-dashboard-minimal-v1.yap`: upload succeeded, metadata dialog parsed name/description/icon, import completed, app appeared after refresh, and the dashboard page opened.
- `generated-dashboard-isolate-v3-shell-exts-array.yap`: dashboard shell with empty `exts: []`; upload and metadata parse succeeded, but final import returned `Created failed`.
- `generated-dashboard-isolate-v4-shell-preserve-tenant.yap`: root tenant/user metadata preserved; upload and metadata parse succeeded, but final import returned `Created failed`.
- `generated-dashboard-isolate-v5-shell-replaceids-only.yap`: upload and metadata parse succeeded. The metadata modal showed the expected title/description, but repeated OK attempts did not close the modal or produce a success/failure toast.
- Chrome console evidence after failed/stalled import attempts included `Uncaught RangeError: Wrong length!` from Yeeflow client bundle.
- Root cause for the earlier generator path: it started from a richer app-page/dashboard pattern with a child data list, embedded `LayoutInResources[0].Resource`, widget definitions, and dashboard `exts`. The minimal working export shows the safe first dashboard package should be an empty Type `103` page shell. Add data lists, embedded page JSON, widgets, and `exts` as isolated follow-up steps.

Import blocker:

- Chrome extension file upload via the browser backend failed with `fileChooser.setFiles failed` / `Not allowed`.
- The visual Chrome file chooser can upload when accessible, but after tab claiming the accessibility tree became intermittent.

Standalone `.ydl` validation note:

- The child list validates as an app child resource.
- A standalone validation wrapper with `{ Item: child }` returns `pass_with_warnings` because the list is not packaged as a standalone `.ydl` export and does not carry standalone `ListSetID` packaging metadata.

## Known Gaps

- Runtime import/open has been proven for the empty minimal generated dashboard shell.
- Export-back behavior is still unknown.
- The exact runtime binding between visual chart controls and `exts[]` has now been import-proven for one pie, one column, and one line chart. Export-back comparison is still open.
- Settings external action dependencies require a separate export study before generation.
- The server-side cause of earlier `Created failed` attempts still needs network/API response evidence if those richer dashboard packages are revisited.

## Data-Bound Dashboard Round: Local List, Summary, and Data Table

Source of truth:

- `/Users/Renger/Downloads/Generated Dashboard Simple Elements v2.yap`

Generated proof package:

- `generated-dashboard-data-bound-v3.yap`
- `generated-dashboard-data-bound-v3-resource.json`
- `generated-dashboard-data-bound-v3-app-def.json`

What changed from the static simple-elements baseline:

- one child data list named `Event Planning`
- root navigation now contains the two dashboard entries plus a `Type: 1` list entry for `Event Planning`
- `Resource.ReplaceIds` grows from root/dashboard only to 39 IDs: dashboard layout, root app/listset, child list layout, child list, 15 child fields, and 20 sample row IDs
- dashboard page JSON keeps `LayoutInResources[0].ID = RefId = LayoutID`
- dashboard page `exts[]` contains two `summary` entries
- each summary `exts[].i` equals the corresponding summary control id in the page tree
- `Resource.ReportIds` contains those two summary control ids
- the data table control uses `type: "data-list"` and stores its source list under `attrs.data.list`
- no approval forms, reports, AI modules, connections, document libraries, or external data dependencies are required

Observed data-bound components:

- `summary`: KPI/summary card. Runtime binding lives in `page.exts[]`, keyed by `ext.i` equal to the summary control id.
- `data-list`: dashboard table. Runtime binding lives in `attrs.data.list` with `AppID`, `ListID`, `ListSetID`, `Type`, and `Title`.
- `container`: layout wrapper for summary controls and table sections.

Summary `exts[]` pattern:

- `category: "___Pivot___"`
- `key: "summary"`
- `i`: page control id for the summary control
- `attr.AppID`: app id
- `attr.ListID`: local data list id
- `attr.ListSetID`: root app/listset id
- `attr.settings.values[]`: aggregation definition, such as `SUM` of `Decimal1` or `COUNT` of `ListDataID`
- `attr.settings.Conditions[]`: optional filter conditions using field names

Data table pattern:

- page control type is `data-list`
- control label is `Data table`
- source list reference is `attrs.data.list`
- dashboard graph should include a `dashboardControlSource` edge from the dashboard to the local list
- the list must be packaged in `Data.Childs[]`

Generator hardening learned:

- remap object keys as well as object values because sample record IDs can appear as `ListDatas` keys
- build `Resource.Data` from decoded app-def JSON, not by plain `JSON.parse(resource.Data)`, to avoid converting large numeric layout IDs into unsafe JavaScript numbers
- keep all large Yeeflow numeric IDs as strings in generated JSON
- preserve the learned dashboard `exts` and data-table list references through exact ID remapping
- keep the generated child list Title field native: `Status: 0`, `IsSystem: true`, `IsIndex: true`
- normalize generated data-list grid `LayoutView` to include `layout`, `sort`, `query`, `rowColor`, and `filter`
- remove unproven textarea and negative system pseudo columns from the generated list grid view while preserving the source dashboard/table binding

Validation results:

- `node --check generate-dashboard-data-bound-v3.mjs`: pass
- `node --check validate-yap-package.js`: pass
- `node validate-yap-package.js generated-dashboard-data-bound-v3-resource.json --mode generator --stage final`: `pass_with_warnings`; only `APP_THEME_EMPTY`
- `node validate-yap-graph.js generated-dashboard-data-bound-v3-resource.json --mode generator --stage final`: pass
- `node build-yap-wrapper.js generated-dashboard-data-bound-v3-resource.json generated-dashboard-data-bound-v3.yap ...`: pass with full wrapper round-trip

Runtime results:

- imported successfully into `https://<yourdomain>.yeeflow.com`
- app appeared as `Generated Dashboard Data Bound v3`
- dashboard opened successfully
- two summary controls rendered: `SGD 142500.00` and `20`
- data table rendered rows from the local `Event Planning` list
- `Event Planning` list opened successfully with sample records; no `datas/query` 400 was observed

Validator rules added:

- dashboard `exts[].i` must resolve to a page control id
- when `Resource.ReportIds` is present, each dashboard `exts[].i` should be included in `ReportIds` for import/runtime binding

Known gaps after v3:

- export-back comparison has not been performed for the data-bound v3 app
- summary controls, dashboard data table, and basic pie/column/line charts are now proven; dashboard filters still need a separate minimal round
- Service Desk Pro-style dashboards should still be reconstructed by staged additions, not copied directly from the complex app

## Chart Widget Dashboard Round: Pie, Column, and Line Charts

Source of truth:

- `/Users/Renger/Downloads/Generated Dashboard Data Bound v3.yap`

Generated proof package:

- `generated-dashboard-chart-widgets-v4.yap`
- `generated-dashboard-chart-widgets-v4-resource.json`
- `generated-dashboard-chart-widgets-v4-app-def.json`

What changed from the v3 data-bound baseline:

- `Resource.ReportIds` grew from two summary ids to five data-bound control ids: two summaries plus pie, column, and line chart control ids.
- dashboard page `exts[]` now contains five entries: two `summary` entries and three chart entries.
- chart visual controls were added under the dashboard page control tree:
  - `type: "pie-chart"` with title `Pie Chart of Budget by Vendor`
  - `type: "bar-chart"` with label `Column chart` and title `Column Chart of Budget by Vendor`
  - `type: "line-chart"` with title `Line Chart of Budget by Vendor`
- chart controls are grouped inside a container; they are not separate child resources.
- root navigation, Type `103` dashboard layout, `LayoutInResources[0].ID = RefId = LayoutID`, and local list packaging remained consistent with v3.
- `Resource.ReplaceIds` remained 39: local app/list/layout/field/sample ids only.

Chart `exts[]` pattern:

- `category: "___Pivot___"`
- `key`: `pie-chart`, `bar-chart`, or `line-chart`
- `i`: matching chart control id in the page tree
- `attr.AppID`: app id
- `attr.ListID`: local source list id
- `attr.ListSetID`: root app/listset id
- `attr.chartType`: chart type string
- `attr.settings.rows[]`: category/grouping field definitions
- `attr.settings.values[]`: aggregate value definitions

Chart types learned:

- pie chart: `key: "pie-chart"`, `chartType: "0"`
- column chart: `key: "bar-chart"`, `chartType: "2"`
- line chart: `key: "line-chart"`, `chartType: "1"`

Field binding learned:

- pie and column charts group by `Text7` / `Vendors` and sum `Decimal1` / `Budget`
- line chart groups by `Datetime1` / `Date` using `func: "MONTH"` and sums `Decimal1` / `Budget`

Validation results:

- `node --check generate-dashboard-chart-widgets-v4.mjs`: pass
- `node --check validate-yap-package.js`: pass
- `node validate-yap-package.js generated-dashboard-chart-widgets-v4-resource.json --mode generator --stage final`: `pass_with_warnings`; only `APP_THEME_EMPTY`
- `node validate-yap-graph.js generated-dashboard-chart-widgets-v4-resource.json --mode generator --stage final`: pass
- `node build-yap-wrapper.js generated-dashboard-chart-widgets-v4-resource.json generated-dashboard-chart-widgets-v4.yap ...`: pass with full wrapper round-trip
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Runtime results:

- imported successfully into `https://<yourdomain>.yeeflow.com`
- app appeared as `Generated Dashboard Chart Widgets v4`
- dashboard opened successfully
- two summary controls rendered
- dashboard data table rendered rows
- pie, column, and line charts rendered with visible chart output
- `Event Planning` list opened successfully with sample records; no visible `datas/query` 400 was observed

Validator rules added:

- dashboard `exts[].settings.rows[]` field references must resolve to the referenced list fields
- dashboard `exts[].settings.columns[]` field references must resolve to the referenced list fields when present
- dashboard `exts[].settings.values[]` field references must resolve to the referenced list fields or known system fields such as `ListDataID`

Known gaps after v4:

- export-back comparison has not been performed for the chart widget v4 app
- only simple pie, column, and line charts are proven
- dashboard filters are structurally learned and runtime-proven in the v5 filter-controls round below

## Dashboard Filter Controls Round: Search, Radio, and Range Filters

Source of truth:

- `/Users/Renger/Downloads/Generated Dashboard Chart Widgets v4.yap`

Generated validation package:

- `generated-dashboard-filter-controls-v5.yap`
- `generated-dashboard-filter-controls-v5-resource.json`
- `generated-dashboard-filter-controls-v5-app-def.json`

What changed from the v4 chart baseline:

- page `filterVars` changed from `[]` to three variables:
  - `filter_Search`
  - `filter_Radio_Vendor`
  - `filter_Range_BudgetNumber`
- a new filter container was inserted before the chart container
- three filter controls were added:
  - `search-filter`
  - `radio-filter`
  - `range-filter`
- chart `page.exts[].attr.settings.Conditions` now reference the filter variables
- `Resource.ReportIds` still contains only the two summary ids and three chart ids
- `Resource.ReplaceIds` remains 39 local numeric ids

Filter control binding pattern:

- control `binding` uses `__filter_` plus the filter variable id
- search filter binding: `__filter_filter_Search`
- radio filter binding: `__filter_filter_Radio_Vendor`
- range filter binding: `__filter_filter_Range_BudgetNumber`

Radio filter pattern:

- `type: "radio-filter"`
- source list stored in `attrs.data.list`
- `display_f` and `value_f` are both `Text7`
- `displayStyle` is `dropdown`
- sort uses `Text7`

Range filter pattern:

- `type: "range-filter"`
- max, step, prefix, thousand separators, and rounding live in `attrs`
- studied values: `number_max: 100000`, `number_step: 1000`, `prefix.value: "USD "`, `displayThousandths: "1"`, `rounded-to: "0"`

Chart condition pattern:

- variable condition expressions use:
  - `exprType: "variable"`
  - `type: "expr"`
  - `id: "__filter_" + name`
  - `name`: a page `filterVars[].id`
- pie chart conditions bind `Title`, `Text7`, and `Decimal1` to search, radio, and range filters
- column chart conditions bind `Text7` and `Decimal1` to radio and range filters, and also include nested static `Text4` RSVP conditions
- line chart conditions bind `Text7` and `Decimal1` to radio and range filters

Validation results:

- source decode: pass, 39 `ReplaceIds`, large numeric ids preserved
- source compatibility package validation: `pass_with_warnings`; `APP_THEME_EMPTY` and `LARGE_NUMERIC_IDS`
- source compatibility graph validation: `pass_with_warnings`; `LARGE_NUMERIC_IDS`
- `node --check generate-dashboard-filter-controls-v5.mjs`: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Validator rules added:

- filter control `binding` must resolve to page `filterVars`
- chart/filter condition expression `name` must resolve to page `filterVars`
- chart/filter condition expression `id` must equal `__filter_` plus `name`
- condition `left` fields, including nested condition groups, must resolve to source list fields

Known gaps after v5:

- export-back comparison remains open
- interactive filter behavior still needs deeper Yeeflow runtime testing by changing search/radio/range values and confirming chart data refresh
- only one search, one radio, and one range filter pattern are studied

Runtime import evidence:

- `generated-dashboard-filter-controls-v5.yap` imported successfully into `https://<yourdomain>.yeeflow.com`
- import metadata parsed the expected app name: `Generated Dashboard Filter Controls v5`
- imported app appeared in Shared Workspace and opened
- dashboard page rendered the filter container with `Search filter`, `Radio filter`, and `Range filter`
- dashboard summary values rendered: `SGD 142500.00` and `20`
- dashboard table rendered sample rows
- pie, column, and line chart widgets rendered visible chart output
- `Event Planning` source list opened successfully with sample rows and no visible `datas/query` failure

## Service Desk Pro Resume: Stage C Static Executive Dashboard

The Service Desk Pro path resumed from `/Users/Renger/Downloads/Service Desk Pro (1).yap` after the simpler dashboard baselines had runtime proof.

Reconfirmed Service Desk Pro dashboard inventory:

- `Executive Dashboard`: Type `103`, page JSON with `filterVars`, `tempVars`, 26 `exts`, chart/summary/table-like data configs, and `opendashboard` actions.
- `Settings`: Type `103`, mostly static navigation hub, but includes external form/listset action dependencies.
- `Drill-down Tickets List`: Type `103`, required before enabling Executive Dashboard drill-down actions.
- `Help Guide`: Type `103`, simple static/help content.

Classification:

- already proven simple/static elements: containers, headings, text-editor notes, icons, lines, card-like containers
- already proven local data-bound patterns: summary controls, data table, pie/column/line charts, search/radio/range filters
- not yet regenerated safely for Service Desk Pro: Support Tickets source list, lookup-based chart rows, SLA report resources, select team filter, relative-period filter, `opendashboard` actions
- high-risk Settings behavior: external ListSetID / ProcKey action references

Selected resumed package:

- stage: `C`
- package: `service-desk-pro-dashboard-stage-b-or-c.generated.yap`
- app def: `service-desk-pro-dashboard-stage-b-or-c-app-def.json`
- resource: `service-desk-pro-dashboard-stage-b-or-c-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-c.mjs`

What Stage C proves:

- one root app/listset
- one Type `103` `Executive Dashboard` page
- embedded page JSON with `LayoutInResources[0].ID = RefId = LayoutID`
- Service Desk-style static header, filter note, KPI placeholders, chart placeholders, and drill-down/SLA placeholders
- no data lists, no `exts`, no filter variables, no temp variables, and no external dependencies

Validation:

- generator syntax check: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Runtime import evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage C`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage C`
- rendered `Executive Dashboard`, `Dashboard filters`, `KPI Cards`, `Total Submitted`, `Resolved Tickets`, `Open Tickets`, `Critical Open`, chart placeholders, `SLA Compliance`, and `Drill-down Tickets List`

Next safe stage:

- Stage D: add one local `Support Tickets` data list with only fields needed for the first summary metric. Do not add filters, charts, report resources, Settings actions, or drill-down actions yet.

## Service Desk Pro Resume: Stage D Local Support Tickets List

Stage D adds one local child data list to the proven Stage C static Executive Dashboard shell.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-d.generated.yap`
- app def: `service-desk-pro-dashboard-stage-d-app-def.json`
- resource: `service-desk-pro-dashboard-stage-d-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-d.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-d.generated.yap`

What Stage D proves:

- one root app/listset
- one Type `103` `Executive Dashboard` page using the proven Stage C static page JSON pattern
- one local `Support Tickets` data list as a child resource
- native `Title` metadata is preserved for the ticket title field
- local sample row IDs and local field/list/layout IDs are included in `ReplaceIds`
- the local data list imports, opens, and queries successfully in Yeeflow runtime

Minimal Support Tickets field set:

- native `Title` as `Ticket Title`
- `Text1` as `Ticket ID`
- `Text2` as `Priority`
- `Text3` as `Status`
- `Text4` as `Assigned Team`
- `Datetime1` as `Created Time`
- `Decimal1` as `First Response Hours`
- `Decimal2` as `Resolution Hours`
- `Bit1` as `First Response SLA Compliance`
- `Bit2` as `Resolution SLA Compliance`

Validation:

- generator syntax check: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Runtime import evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage D`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage D`
- rendered the static Executive Dashboard and the Stage D source-list note
- `Support Tickets` navigation opened the list view
- six sample rows rendered with the expected fields and no visible `datas/query` failure

What Stage D does not prove yet:

- dashboard `exts`
- bound summary values
- charts
- filters
- `save_var` / `tempVars`
- drill-down actions
- Settings page actions
- SLA report resources

Next safe stage:

- Stage E: add exactly one data-bound summary widget, recommended first target: `Total Submitted` count over the local `Support Tickets` list. Use a fresh ID family and do not add filters, charts, reports, Settings, or drill-down actions in the same package.

## Service Desk Pro Resume: Stage E and Stage F1 Bound KPI Summaries

Stage E adds one bound summary control to the Stage D package.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-e.generated.yap`
- app def: `service-desk-pro-dashboard-stage-e-app-def.json`
- resource: `service-desk-pro-dashboard-stage-e-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-e.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-e.generated.yap`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage E`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage E`
- `Total Submitted` rendered `6`, matching the six local `Support Tickets` rows

Stage F1 adds the remaining three KPI summaries.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-f1.generated.yap`
- app def: `service-desk-pro-dashboard-stage-f1-app-def.json`
- resource: `service-desk-pro-dashboard-stage-f1-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-f1.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-f1.generated.yap`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage F1`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F1`
- KPI values rendered:
  - `Total Submitted`: `6`
  - `Resolved Tickets`: `2`
  - `Open Tickets`: `4`
  - `Critical Open`: `0`

Reusable KPI summary rules:

- summary controls are page controls with matching `page.exts[]` entries
- each summary control id is included in `Resource.ReportIds`
- `COUNT(ListDataID)` works for local list row counts
- equality conditions over local text fields work for Service Desk status and priority summaries
- do not include Service Desk filter variables until filter controls are reintroduced in a later package

## Service Desk Pro Resume: Stage F2 Local Chart Package

Stage F2 adds one `bar-chart` / column chart to the Stage F1 package:

- package: `service-desk-pro-dashboard-stage-f2.generated.yap`
- app def: `service-desk-pro-dashboard-stage-f2-app-def.json`
- resource: `service-desk-pro-dashboard-stage-f2-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-f2.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-f2.generated.yap`

Local validation:

- generator syntax check: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Runtime status:

- pass.

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage F2`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage F2`
- KPI cards rendered `6`, `2`, `4`, and `0`
- `Open Tickets by Priority` rendered as a column chart with Medium and High buckets from the local `Support Tickets` rows

Reusable chart rules:

- a Service Desk-style chart can be added after KPI summaries using the same local `Support Tickets` list
- chart control id must be present in both `page.exts[].i` and `Resource.ReportIds`
- for this proven chart, `key: "bar-chart"`, `chartType: "2"`, row field `Text2` / Priority, and value `COUNT(ListDataID)` worked
- active-status conditions over `Text3` worked for the chart just as they did for KPI summaries

## Service Desk Pro Resume: Stage G Static Settings Page

Stage G adds a second Type `103` page for `Settings` to the proven Stage F2 package.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-g.generated.yap`
- app def: `service-desk-pro-dashboard-stage-g-app-def.json`
- resource: `service-desk-pro-dashboard-stage-g-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-g.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-g.generated.yap`

Validation:

- generator syntax check: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage G`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage G`
- Executive Dashboard still rendered with the proven KPI and chart patterns
- `Settings` navigation opened a static page with configuration cards

Rules learned:

- a second Type `103` page can be added by cloning the proven dashboard layout envelope and replacing `LayoutID`, `LayoutInResources[0].ID`, `RefId`, title, page JSON, and navigation entry
- static Settings cards are safe when they do not include the original export's external links/actions
- do not reintroduce Settings actions until target list/page dependencies are included and validated

## Service Desk Pro Resume: Stage H Static Drill-down and Help Pages

Stage H adds static Type `103` page scaffolds for `Drill-down Tickets List` and `Help Guide`.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-h.generated.yap`
- app def: `service-desk-pro-dashboard-stage-h-app-def.json`
- resource: `service-desk-pro-dashboard-stage-h-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-h.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-h.generated.yap`

Validation:

- generator syntax check: pass
- generated resource package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- generated resource graph validation: pass
- wrapper build and round-trip: pass
- wrapped `.yap` package validation: `pass_with_warnings`; only `APP_THEME_EMPTY`
- wrapped `.yap` graph validation: pass

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage H`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage H`
- navigation rendered `Executive Dashboard`, `Settings`, `Drill-down Tickets List`, `Help Guide`, and `Support Tickets`
- `Drill-down Tickets List` rendered six static ticket rows
- `Help Guide` rendered three static help sections
- `Support Tickets` opened and rendered the six local rows without a visible query failure

Rules learned:

- additional static Type `103` pages can be added safely with fresh layout IDs and root navigation entries
- Drill-down and Help pages are safe as static scaffolds
- the original dynamic drill-down `collection`, `tempVars`, filter variables, and `opendashboard` actions are still unproven and require their own isolated package

## Service Desk Pro Resume: Stages I-L Filters, Actions, and Drill-down Data Tables

Stages I-L continue the Service Desk Pro rebuild after the static Settings, Drill-down, and Help pages passed.

### Stage I: Local Support Teams Filter Source

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-i.generated.yap`
- app def: `service-desk-pro-dashboard-stage-i-app-def.json`
- resource: `service-desk-pro-dashboard-stage-i-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-i.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-i.generated.yap`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage I`
- `Executive Dashboard` rendered the local `Support Teams` select filter and submitted-period staged control
- team dropdown rendered the local support team rows
- `Support Teams` list opened and rendered rows without a visible query failure

Rules learned:

- a local Support Teams list can safely back a Service Desk-style dashboard select control
- Support Teams must preserve native `Title` metadata when generated as a child data list
- submitted-period UI can render as a staged static control, but date semantics remain unbound until separately proven

### Stage J: Opendashboard Action

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-j.generated.yap`
- app def: `service-desk-pro-dashboard-stage-j-app-def.json`
- resource: `service-desk-pro-dashboard-stage-j-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-j.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-j.generated.yap`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage J`
- clicking the operational `Drill-down Tickets List` placeholder opened the local Drill-down Type `103` page in a modal
- URL included the staged query param `?Title=Open+Tickets`
- modal rendered the static Drill-down page rows

Rules learned:

- `opendashboard` actions are safe when the target Type `103` page is included in the same package
- the action should be attached through `attrs.control_action` on the clickable dashboard control
- graph validation should detect the `dashboardActionPage` edge before runtime testing
- query params can be carried into the URL, but mapping them into page `tempVars` is not yet proven

### Stage K: Bound Drill-down Data-list Control

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-k.generated.yap`
- app def: `service-desk-pro-dashboard-stage-k-app-def.json`
- resource: `service-desk-pro-dashboard-stage-k-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-k.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-k.generated.yap`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage K`
- direct Drill-down navigation rendered a dashboard `data-list` control bound to local `Support Tickets`
- modal opened from the Executive Dashboard action and rendered the same bound table
- table rendered all six local tickets with `Ticket ID`, `Title`, `Priority`, `Status`, and `Assigned Team`

Rules learned:

- a dashboard `data-list` control can replace static drill-down rows when bound to an included local list
- `attrs.data.list.AppID`, `ListID`, `ListSetID`, and `Type` must resolve to the local source list
- `attrs.listarr[].Field` must resolve to fields in the local list definition
- empty `attrs.data.filter: []` is safe for the first data-bound drill-down table

### Stage L: Static Drill-down Data-list Filter

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-l.generated.yap`
- app def: `service-desk-pro-dashboard-stage-l-app-def.json`
- resource: `service-desk-pro-dashboard-stage-l-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-l.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-l.generated.yap`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage L`
- Drill-down table rendered only `T-1001` and `T-1006`
- both rendered rows had `Priority = High`

Rules learned:

- dashboard `data-list` controls support static scalar filters in `attrs.data.filter`
- the proven static filter shape is:

```json
{
  "pre": "and",
  "left": "Text2",
  "op": "0",
  "right": "High",
  "showCus": true
}
```

- static filters should be proven before introducing query-param or `tempVars` expressions

Remaining high-risk original Service Desk Pro areas:

- query-param to `tempVars` mapping for original drill-down filters
- dynamic `collection` card layout on the original Drill-down page
- Settings tile actions that reference external `ListSetID` or `ProcKey`
- SLA report resources and SLA Compliance Rate report dependencies

## Service Desk Pro Resume: Stage M Submitted-period Conditions and Layout Polish

Stage M used the user-modified export `/Users/Renger/Downloads/Service Desk Pro Dashboard Stage L.yap` as the read-only source of truth for the next learning round.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-m.generated.yap`
- app def: `service-desk-pro-dashboard-stage-m-app-def.json`
- resource: `service-desk-pro-dashboard-stage-m-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-m.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-m.generated.yap`

Export-back observation:

- the user export added a submitted-period expression condition to the `Total Submitted` summary:

```json
{
  "pre": "and",
  "left": "Datetime1",
  "op": "0",
  "right": [
    {
      "exprType": "variable",
      "valueType": "string",
      "id": "__filter_f_SubmittedPeriod",
      "type": "expr",
      "name": "f_SubmittedPeriod"
    }
  ],
  "showCus": false
}
```

Stage M applied the same variable-bound date condition to all Service Desk Pro KPI summaries and the `Open Tickets by Priority` chart. This proves the submitted-period filter can drive local dashboard bindings when the filter variable is `f_SubmittedPeriod` and the source date field is the generated local `Datetime1`.

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage M`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage M`
- default Executive Dashboard rendered KPI values `6`, `2`, `4`, and `0`
- clicking `Today` changed all four KPI summaries to `0`, proving the submitted-period variable condition is active
- `Settings` rendered the user-restyled 3-column card grids with wider spacing
- improved `Help Guide` rendered two 3-column static card sections
- `Drill-down Tickets List` rendered the filtered high-priority table with `T-1001` and `T-1006`
- `Support Tickets` opened with six rows and no visible query failure
- `Support Teams` opened with four rows and no visible query failure

Rules learned:

- a relative-period filter condition can be reused across summary and chart `exts` when the same local list date field is available
- the proven condition uses `left: "Datetime1"`, `op: "0"`, and `right[0].id: "__filter_f_SubmittedPeriod"`
- do not add the period condition twice; each relevant `summary` or `bar-chart` binding should have exactly one submitted-period condition
- Settings dashboard grids can use three columns with `cgap` and `rgap` set to `24px`
- Help Guide page polish can use static card grids safely; avoid links/actions until target resources are proven

Known cleanup for the next package:

- update the Executive Dashboard helper text so it no longer says date filtering is only staged

## Service Desk Pro Resume: Stage N Active Filter Helper Copy

Stage N continued from the proven Stage M package and changed only the user-facing copy needed after the submitted-period binding became active.

Generated artifacts:

- package: `service-desk-pro-dashboard-stage-n.generated.yap`
- app def: `service-desk-pro-dashboard-stage-n-app-def.json`
- resource: `service-desk-pro-dashboard-stage-n-resource.json`
- generator: `generate-service-desk-pro-dashboard-stage-n.mjs`
- Downloads copy: `/Users/Renger/Downloads/service-desk-pro-dashboard-stage-n.generated.yap`

Stage N preserves:

- all Stage M submitted-period conditions on KPI summaries and the local priority chart
- the local `Support Tickets` and `Support Teams` lists
- Settings three-column grid layout and `24px` grid gaps
- improved static Help Guide card grids
- static high-priority Drill-down Tickets List table filter

Stage N changes:

- fresh ID family `259`
- app title `Service Desk Pro Dashboard Stage N`
- Executive Dashboard helper text now says the local Support Teams and Submitted period filters narrow the KPI and priority chart bindings
- helper text states that Submitted period is bound to the local Created Time field for the generated Support Tickets list

Validation evidence:

- `node --check generate-service-desk-pro-dashboard-stage-n.mjs`: pass
- decoded resource package validation: `pass_with_warnings`
- decoded resource graph validation: pass
- wrapper build: pass
- wrapper package validation: `pass_with_warnings`
- wrapper graph validation: pass
- only recurring package warning: `APP_THEME_EMPTY`

Runtime evidence:

- imported into `https://<yourdomain>.yeeflow.com`
- appeared in Shared Workspace as `Service Desk Pro Dashboard Stage N`
- opened as `Executive Dashboard | Service Desk Pro Dashboard Stage N`
- helper copy rendered the active submitted-period binding message
- default Executive Dashboard rendered KPI values `6`, `2`, `4`, and `0`
- clicking `Today` changed all four KPI values to `0`, confirming the period filter remained active after the copy cleanup
- `Settings` rendered the 3-column card grid layout
- `Help Guide` rendered improved static card sections
- `Drill-down Tickets List` rendered `T-1001` and `T-1006`
- `Support Tickets` opened with six rows and no visible query failure
- `Support Teams` opened with four rows and no visible query failure

Rules learned:

- after a staged filter becomes active, update static dashboard helper text in the same fresh-ID generation cycle
- copy-only dashboard page updates can be promoted only after a full import/open test, because page JSON edits still travel through the same Type 103 wrapper path
- Stage N is the current safest Service Desk Pro baseline before isolating query-param to `tempVars`, original collection cards, Settings actions, or SLA report resources

## Collection Control Learning: Tickets with Collection Export

Source export studied read-only: `/Users/Renger/Downloads/Service Desk Pro Dashboard Stage M.yap`

The export adds a Type `103` dashboard named `Tickets with Collection` to the Stage M app. This page introduces the first studied dashboard `collection` controls.

What changed from the generated Stage M baseline:

- added one root app dashboard layout titled `Tickets with Collection`
- added one root navigation entry targeting the new Type `103` layout
- added two `collection` controls bound to local `Support Tickets`
- added dynamic fields inside Collection item templates using `source: "3"` and `obj-f`
- added collection item expressions using `exprType: "variable_ctx"` with `ctx: "__ctx_coll"`
- added conditional priority badge styles in `attrs.control_display`
- added meaningful designer navigator labels in `nv_label`

Patterns learned:

- Collection data source is stored at `attrs.data.list`.
- Collection item template is the first child of the Collection control.
- Dynamic field controls inside the item template use `source: "3"` and source-list `FieldName` in `obj-f`.
- Text/heading expressions can read collection item fields with `variable_ctx` and `ctx: "__ctx_coll"`.
- `dateFormat(...)` can wrap a collection item date expression.
- Conditional style rules for per-item badges are stored in `attrs.control_display`.
- The studied dynamic rules apply styles, not hide/show behavior; hide/show remains unproven.
- Navigator names are stored in `nv_label` and are useful for generator readability but not runtime behavior.

Dedicated study doc: `docs/dashboard-collection-control-pattern-study.md`

First safe generation plan:

- `dashboard-collection-first-generation-test-plan.md`
- `dashboard-collection-first-generation-test-spec.json`

Generation/runtime results:

- `generated-dashboard-collection-card-v1.yap` passed validation, wrapper build, import, and runtime rendering.
- `generated-dashboard-collection-table-v2.yap` imported but failed visual runtime layout because generated `flex_grid` controls used `attrs.layout.cols`.
- `generated-dashboard-collection-table-v3.yap` corrected the table schema to `attrs.columns` / `attrs.rows`, passed validation, imported, and rendered horizontal table-style rows.

Validator follow-up:

- `validate-yap-package.js` now rejects dashboard `flex_grid` controls that put columns under `attrs.layout.cols`.

Baseline doc:

- `docs/generated-dashboard-baseline-collection-control-v1.md`

Remaining gaps:

- Collection hide/show display actions remain unproven.
- Collection full-text search/filter binding is studied but not generated yet.
- Collection sorting, pagination, and empty-state behavior remain unproven.

## Knowledge Base Phase 1 Dashboard Baseline

The generated `knowledge-base-phase1-full.generated.yap` package is the first broader Knowledge Base Phase 1 dashboard/data-list baseline.

It combines:

- v4 Knowledge Base dashboard/list pattern
- v11 category lookup isolation pattern
- a plain `Sections` list
- two Type `103` dashboards: `Home Page` and `Article Library`
- flat article/category/section Collections bound to local lists
- meaningful `nv_label` values for generated dashboard controls

Runtime evidence at `https://<yourdomain>.yeeflow.com`:

- import passed and app tile appeared as `Knowledge Base Phase 1 Full`
- Home dashboard opened and rendered article/category/section Collections
- Article Library dashboard opened and rendered article rows
- Categories, Sections, and Articles list pages rendered sample rows
- Articles add form displayed the generated Category Lookup field

Known caveat:

- Sections and Articles list pages may initially render the shell and require a refresh stabilization before rows appear.
- Chrome console logged Yeeflow runtime `RangeError: Wrong length!` entries during refresh transitions.
- Because the rows and dashboards rendered after stabilization, this baseline is suitable for Phase 1 learning and generator guidance, but Phase 2 should isolate the remaining first-open list behavior before claiming production readiness.
