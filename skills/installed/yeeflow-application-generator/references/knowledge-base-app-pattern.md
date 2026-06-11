# Knowledge Base App Pattern

Source studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

Use this when generating a small Knowledge Base-style `.yap` app that combines local lists and dashboard pages.

## Safe Runtime-Proven Scope

Generate:

- one root app/listset
- one Type `103` Home dashboard page
- local `Categories` list
- local `Articles` list
- plain text article category labels
- local category/article sample rows
- root navigation for Home, Categories, and Articles

After the v4 and v11 baselines are accepted, the Phase 1 completion package may also include:

- a plain local `Sections` list
- an `Article Library` Type `103` dashboard
- flat article/category/section dashboard Collections
- `Categories.Decimal1` Order
- `Articles.Text3` Category Lookup sorted by `Categories.Decimal1`
- `Articles.Text4` kept as a plain input slot

Defer:

- `Sections`
- article-to-category lookup metadata until the v4 plain text baseline is already proven; use the v11 lookup-isolation shape only when the test explicitly includes lookup
- richtext article bodies
- icon-upload images
- article detail pages
- nested category-to-article dashboard Collections
- Search query-param flow
- Admin application-URL cards
- forms, workflows, reports, AI modules, connections, document libraries

## App Shell Rules

- root app/listset keeps `CustomType: ""`, `Perm: 0`, non-null `IconUrl`, `WorkspaceID`, `CreatedBy`, and `ModifiedBy`
- root `LayoutView.sort[]` includes duplicate Type `103` entries for the Home dashboard when following the proven dashboard shell pattern
- local list navigation entries point to included child list IDs
- `AppTags`, `AppMetadatas`, `AppComponents`, `AppThemes`, and `OtherModules` are present as arrays
- child lists keep app-level metadata in the proven generated shape: populated `TenantID`, `CreatedBy`, and `ModifiedBy`, with child `WorkspaceID: null`
- do not add an ad hoc `ListSetID` property directly to the root `ListModel`

## ReplaceIds Rules

Include:

- root ListSetID
- dashboard LayoutID
- local list IDs
- generated field IDs
- generated list view/layout IDs
- local sample row IDs

Exclude:

- tenant/user IDs
- AppID
- any external dependency IDs

## Runtime Checklist

- import metadata parses app name and icon
- app appears in Shared Workspace
- Home dashboard opens and renders
- local list navigation renders
- Categories and Articles list queries do not return `400`

## Runtime Lessons

- v1 imported and opened but showed Yeeflow's empty component shell, so import alone is not enough.
- v2/v3 rendered Home/Categories, but Articles stayed on the loading spinner.
- v4 passed after correcting child-list metadata, keeping list `LayoutView: null`, removing the first-stage lookup, and preserving native `Title.FieldIndex: 0`.
- v5/v6/v7 article-to-category lookup isolations imported and rendered Home/Categories, but Articles stayed on the loading spinner. The failed variants used `Articles.Text3` lookup with local sample IDs, blank values, and hidden list-view visibility.
- The source template uses `Articles.Text4` for Category lookup; v8 validates and round-trips with that source-like slot, imports, and renders Home, but Categories and Articles stay on loading spinners. Lookup generation remains blocked.
- v9 removes the generated `Text3` placeholder and adds only blank `Articles.Text4` lookup metadata. It imports, renders Home, and opens Categories, but Articles still stays on the loading spinner. This narrows the blocker to Articles lookup metadata.
- v10 adds `Articles.Text4` as a plain input field and imports successfully. Home renders and Categories opens, but Articles stays on a loading spinner with Chrome console `Uncaught RangeError: Wrong length!`. Do not treat the plain non-contiguous `Text4` field slot as proven.
- v11 follows the user's exported v10 update and is the first generated Knowledge Base lookup isolation to pass runtime: `Categories.Decimal1` Order, `Articles.Text4` plain input slot, and `Articles.Text3` Category Lookup sorted by `Decimal1`. Articles loaded after one refresh, and the new-item lookup dropdown resolved Categories in Order sequence. Keep v4 as the safest initial app baseline.
- `knowledge-base-phase1-full.generated.yap` is the first broader Phase 1 generated app baseline. It imported, opened, rendered Home and Article Library Collections, and opened Categories/Sections/Articles with sample rows after refresh stabilization where needed. It keeps the v11 first-open refresh caveat and should not yet be treated as production-ready for lookup sample values, nested Collections, or source-style section lookup chains.
