# Knowledge Base Dashboard Pattern

Use this reference after the minimal dashboard, data-list, lookup, and Collection-control patterns are already understood.

Source studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

Runtime-proven generated baseline: `knowledge-base-generated-v4.yap`

Phase 1 completion baseline: `knowledge-base-phase1-full.generated.yap`

## Source Shape

The Knowledge Base template is an app-level `.yap` with:

- one root app/listset
- local `Categories`, `Sections`, and `Articles` data lists
- Type `103` dashboard pages: `Home Page`, `Search`, and `Admin`
- no approval forms, workflows, reports, AI modules, connections, or document libraries

## Safe Generated v4 Pattern

The first runtime-proven generated package includes only:

- root app shell
- one `Home Page` Type `103` dashboard
- local `Categories` list
- local `Articles` list
- plain text article category labels
- local category and article sample rows
- article Collection
- category Collection
- search filter bound to page `filterVars`
- dynamic fields inside Collection item templates
- meaningful `nv_label` names

Defer lookup fields, `Sections`, nested Collections, rich text, images, detail-page links, query-param navigation, and Admin action cards until the simpler package has imported and opened.

## Dashboard Rules

- Dashboard page lives in root `Layouts[]` with `Type: 103`.
- Embedded page JSON lives in `LayoutInResources[0].Resource`.
- `LayoutInResources[0].ID` and `RefId` match the dashboard `LayoutID` for the Knowledge Base source pattern.
- Root navigation must include duplicate Type `103` entries for the dashboard page when following the proven generated dashboard shell pattern.
- Search filter binding uses `__filter_<filterVarId>`, for example `__filter_filter_Keywords`.
- Collection fulltext values reference the same bound filter variable.

## Data Rules

- Generated lists must preserve native Title metadata:
  - `FieldName: "Title"`
  - `Status: 0`
  - `IsSystem: true`
  - `IsIndex: true`
- `FieldIndex: 0`
- The first safe package should use a plain text category label on `Articles`; article-to-category lookup must be introduced only in a later isolation package.
- When lookup is introduced, it must target the local generated Categories list and display `Title`.
- Local lookup sample values may reference local category sample row IDs, and those IDs must be in `ReplaceIds`.
- Do not copy the source export's self lookup on `Categories.Parent category` into the first generated package; it creates a dependency cycle and should be isolated separately.
- Knowledge Base lookup isolation v5-v7 showed that `Articles.Text3` lookup is not runtime-safe: Articles stayed on a loading spinner with local lookup sample values, with blank lookup values, and with the lookup hidden from the list layout.
- The source export uses `Articles.Text4` for Category lookup. A source-like `Text4` lookup package (`knowledge-base-lookup-v8-text4-lookup.yap`) validates, round-trips, imports, and renders Home, but Categories and Articles stay on loading spinners. Do not promote lookup generation from this package.
- A narrower source-like package (`knowledge-base-lookup-v9-text4-only.yap`) removes the generated `Text3` placeholder and adds only blank `Articles.Text4` lookup metadata. It imports, renders Home, and opens Categories, but Articles still stays on a loading spinner. This narrows the blocker to Articles lookup metadata.
- A plain field-slot package (`knowledge-base-text4-input-v10.yap`) adds `Articles.Text4` as an input field instead of lookup metadata. It imports, Home renders, and Categories opens, but Articles stays on a loading spinner with Chrome console `Uncaught RangeError: Wrong length!`. Do not treat plain non-contiguous `Text4` as proven.
- The user's exported v10 update added `Categories.Decimal1` Order and `Articles.Text3` Category Lookup sorted by `Decimal1`, while leaving `Articles.Text4` as a plain input slot. The generated reproduction (`knowledge-base-category-lookup-v11.yap`) imports and opens. Home and Categories render immediately; Articles loaded after one refresh; the new-item lookup dropdown resolved Categories in Order sequence. This is a proven later-stage lookup isolation, not the safest first baseline.

## Runtime Lessons

- `knowledge-base-generated-v1.yap` uploaded, imported, and opened, but rendered Yeeflow's empty component shell instead of generated app content.
- v2/v3 imported and rendered Home/Categories, but `Articles` stayed on the loading spinner.
- v4 passed runtime: Home rendered article/category Collections, `Categories` opened with sample rows, and `Articles` opened with sample rows.
- Root causes fixed by v4: child list metadata followed the app-level baseline, root `ListSetID` was not added directly to the root `ListModel`, list `LayoutView` stayed `null`, and native `Title.FieldIndex` was set to `0`.
- v5/v6/v7 lookup isolations imported and rendered Home/Categories, but Articles stayed on a loading spinner. v8 imported and rendered Home, but Categories and Articles stayed on loading spinners. v9 restored Categories runtime while Articles still spun. v10 shows that plain non-contiguous `Text4` also leaves Articles spinning. v11 proves the manually discovered `Categories.Decimal1` sort + `Articles.Text3` lookup + `Articles.Text4` plain slot pattern, with a first-open refresh caveat.
- Phase 1 combines v4, v11, a plain `Sections` list, `Home Page`, and `Article Library`. Runtime import/open passed: Home rendered article/category/section Collections, Article Library rendered article rows, Categories/Sections/Articles rendered sample rows, and the Articles add form displayed Category Lookup. Sections and Articles may need refresh stabilization on first list open; Chrome console can log Yeeflow `RangeError: Wrong length!` during the transition. Treat Phase 1 as a learning/completion baseline with a caveat, not final production readiness.

## Stop Conditions

Stop before generation when:

- an article Collection source list is missing
- a lookup source/target cannot resolve locally
- lookup fields are being added before the plain text category-label baseline has passed
- a nested Collection filter depends on an unproven current-item comparison shape
- query-param page navigation has not been isolated
- generated Title metadata would violate the native Title rule

## Runtime Checklist

After import:

- app tile appears in Shared Workspace
- app opens
- Home dashboard renders
- search filter appears
- article Collection renders local rows
- category Collection renders local rows
- `Categories` list opens without datas/query `400`
- `Articles` list opens without datas/query `400`
- `Sections` list opens and renders local rows when included
- Article Library opens and renders article Collection rows when included
