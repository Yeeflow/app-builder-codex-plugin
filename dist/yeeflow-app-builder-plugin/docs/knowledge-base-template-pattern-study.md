# Knowledge Base Template Pattern Study

Source export studied: `<downloads>/Knowledge Base_1.yap`

This study follows the Yeeflow feature-learning rule: study the real export first, extract the resource pattern, validate before generation, then generate the smallest safe package.

## Source Summary

- App/template: `Knowledge Base_1`
- AppID: `41`
- Root ListSetID: `2054454402918137856`
- MainListType: `1024`
- ReplaceIds: 61
- Child lists: 3
- Dashboard pages: 3
- Forms/workflows/reports/AI/connections/document libraries: none detected

The source is a compact app-level `.yap` with local data lists and dashboard pages. It does not require approval forms, workflows, data reports, AI modules, or external connections.

## Data List Pattern

The source uses three local lists:

| List | Purpose | Notable fields |
| --- | --- | --- |
| `Categories` | Knowledge grouping | `Title`, `Icon`, `Description`, self lookup `Parent category` |
| `Sections` | Category sub-grouping | `Title`, `Description`, lookup `Category` |
| `Articles` | Main knowledge content | `Title`, `Summary`, `Content`, `Feature image`, lookup `Category`, lookup `Section` |

Lookup pattern:

- `Sections.Category` resolves to `Categories.Title`.
- `Articles.Category` resolves to `Categories.Title`.
- `Articles.Section` resolves to `Sections.Title`.
- `Categories.Parent category` is a self lookup and creates a dependency cycle that should be treated carefully in generated packages.

Generator rule: generated data lists must use native Title metadata even when the source export has `Title.Status: 1`.

Required generated Title metadata:

```json
{
  "FieldName": "Title",
  "Status": 0,
  "IsSystem": true,
  "IsIndex": true
}
```

## Dashboard Pattern

The source has three Type `103` pages:

| Page | Role | Key controls |
| --- | --- | --- |
| `Home Page` | browse/search landing page | search filter, apply button, article Collection, category Collection, nested article Collection |
| `Search` | results page | search filter, article Collection, fulltext binding, item expressions |
| `Admin` | admin links | static card containers using application URL expressions |

All dashboard pages live in root `Data.Item.Layouts[]`:

- `Type: 103`
- `LayoutView: null`
- `LayoutInResources[0].ID` equals the page `LayoutID`
- `LayoutInResources[0].RefId` equals the page `LayoutID`
- root navigation entries target the dashboard `LayoutID`
- page JSON uses `children`, `attrs`, `title`, `ver`, `filterVars`, `tempVars`, and `exts`

## Collection Pattern

The Knowledge Base source reuses the proven dashboard Collection anatomy:

- Collection control type: `collection`
- Data source: `attrs.data.list`
- Article Collection source: `Articles`
- Category Collection source: `Categories`
- Collection item values use `dynamic-field` with `attrs.source: "3"` and `attrs["obj-f"]`
- Text/expression controls can use `exprType: "variable_ctx"` with `ctx: "__ctx_coll"`
- Search results use `attrs.data.fulltext` bound to a page filter variable

The source also includes a nested Collection under each category card. That nested filter binds article category values to the current category item. This is useful but should be deferred until a focused nested-Collection isolation package is generated and imported successfully.

## Generated Baseline Scope

The successful runtime baseline is `knowledge-base-generated-v4.yap`. It intentionally implements only the safe first Knowledge Base-style package:

- one root app
- one Home dashboard page
- local `Categories` list
- local `Articles` list
- plain text article category labels
- search filter bound to `filterVars`
- article Collection with fulltext search
- category Collection
- dynamic-field controls inside Collection items
- designer `nv_label` names

Deferred:

- `Sections`
- richtext article body
- icon-upload/image fields
- article detail page links
- nested category-to-article Collection filters
- Search page query-param flow
- Admin action cards
- approval forms, workflows, reports, AI modules, connections, document libraries

## Validation Results

Source compatibility validation:

- `validate-yap-package.js <downloads>/Knowledge Base_1.yap --mode compatibility`: passed with warnings
- `validate-yap-graph.js <downloads>/Knowledge Base_1.yap --mode compatibility`: passed with warnings

Generated v4 validation:

- `node --check generate-knowledge-base-dashboard-v1.mjs`: passed
- decoded resource package validation: passed with `APP_THEME_EMPTY` warning
- decoded resource graph validation: passed
- wrapper build and round-trip validation: passed
- wrapped `.yap` package validation: passed with `APP_THEME_EMPTY` warning
- wrapped `.yap` graph validation: passed

Standalone `.ydl` validation was not used as the authoritative check because the generated child lists are embedded app child resources, not standalone `.ydl` packages.

## Runtime Result

Runtime import was tested at `https://<yourdomain>.yeeflow.com/`.

Observed for v1:

- upload/import metadata parsed the package name, description, and icon
- import completed
- app tile appeared in Shared Workspace as `Knowledge Base Generated v1`
- app opened, but rendered Yeeflow's empty component shell instead of the generated app content

Observed for v2/v3:

- app imported and Home dashboard rendered
- `Categories` opened
- `Articles` stayed on the loading spinner

Observed for v4:

- app imported and opened as `Knowledge Base Generated v4`
- Home dashboard rendered article/category Collection cards
- `Categories` list opened with sample rows
- `Articles` list opened with sample rows

Root causes learned:

- Generated child list metadata must match the proven app-level package pattern: populated tenant/user metadata, `WorkspaceID: null`, and no ad hoc child-list properties.
- Do not add `ListSetID` directly to the root `ListModel` when following the proven generated app shell.
- The native `Title` field rule includes `FieldIndex: 0`. `Status: 0`, `IsSystem: true`, and `IsIndex: true` were not sufficient by themselves.
- The first Knowledge Base baseline should avoid lookup fields and use category label text; lookup fields should be introduced in a later isolated package.

## First Safe Next Stage

The next generation stage stayed small and became a lookup isolation sequence:

1. v5 added article-to-category lookup with local lookup sample values. Import passed, but Articles stayed on a loading spinner.
2. v6 blanked the lookup sample values. Articles still stayed on a loading spinner.
3. v7 hid the lookup field from the visible Articles list view. Articles still stayed on a loading spinner.
4. v8 moved the lookup to the source-like `Text4` slot and validated/build round-tripped successfully. Runtime import succeeded and the Home dashboard rendered, but both Categories and Articles stayed on loading spinners.
5. v9 removed the generated `Text3` placeholder and added only blank `Articles.Text4` lookup metadata. Runtime import succeeded; Home rendered; Categories opened with 3 rows; Articles stayed on a loading spinner.
6. v10 replaced the lookup with a plain `Articles.Text4` input field. Local validation, graph validation, wrapper build, and import passed; Home dashboard rendered; Categories opened with 3 rows; Articles stayed on a loading spinner and Chrome console showed `Uncaught RangeError: Wrong length!`.
7. v11 studied the user's exported update to v10, then generated `Categories.Decimal1` Order and `Articles.Text3` Category Lookup sorted by `Decimal1` while preserving `Articles.Text4` as a plain input slot. Local validation, graph validation, wrapper build, and import passed. Runtime Home and Categories opened; Articles loaded after one refresh; the new-item lookup dropdown resolved Categories in Order sequence.

See `docs/generated-knowledge-base-lookup-isolation.md`.

Current rule: use v4 plain text category-label as the safest first package. For lookup learning, v11 is the first runtime-proven generated Knowledge Base lookup isolation, but keep it as a later-stage pattern because Articles needed one refresh on first open and lookup sample values were intentionally blank.

## Phase 1 Completion Baseline

The first broader Phase 1 completion package is `knowledge-base-phase1-full.generated.yap`.

It starts from the v4 dashboard/list baseline, adds the v11 category lookup isolation shape, and introduces the source template's `Sections` list as a plain local list.

Included:

- root Knowledge Base app shell
- `Home Page` Type `103` dashboard
- `Article Library` Type `103` dashboard
- local `Categories`, `Sections`, and `Articles` lists
- dashboard article/category/section Collections
- `Categories.Decimal1` Order and `Articles.Text3` Category Lookup sorted by Order
- `Articles.Text4` kept as a plain input slot
- sample category, section, and article records

Runtime result at `https://<yourdomain>.yeeflow.com/`:

- import passed
- app tile appeared as `Knowledge Base Phase 1 Full`
- app opened
- Home dashboard rendered all generated Collections
- Article Library dashboard rendered article rows
- Categories, Sections, and Articles list pages rendered rows
- Articles add form displayed Category Lookup

Runtime caveat: Sections and Articles list pages may initially render only the shell and then show rows after refresh stabilization. Chrome console logged Yeeflow runtime `RangeError: Wrong length!` entries during the refresh transitions. Treat this as a Phase 1 dashboard/data-list completion baseline with a known runtime caveat, not as a final production pattern.

## Stop Conditions

Stop before generation if:

- a Collection source list cannot resolve locally
- a lookup target list is not included or intentionally external
- a dashboard expression references an unmodeled query parameter or external page
- generated Title metadata would violate the native Title rule
- runtime import fails and Chrome/network evidence does not identify a clear next isolation step
