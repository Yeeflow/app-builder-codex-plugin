# Generated Knowledge Base Baseline v1

Package: `knowledge-base-generated-v1.yap`

Download copy: `/Users/Renger/Downloads/Knowledge Base Generated v1.yap`

Status: validation passed; runtime import completed; runtime app shell opened but generated components were not rendered.

## What It Proves

This package proves a simplified Knowledge Base-style Yeeflow app can be generated from the studied source pattern with:

- root app shell
- local data lists
- native Title metadata
- local article/category fields
- one Type `103` dashboard page
- dashboard search filter bound to `filterVars`
- dashboard Collection controls bound to local lists
- dynamic-field controls inside Collection item templates
- designer `nv_label` names

## Resources Included

| Resource | ID |
| --- | --- |
| Root app/listset | `2700010000000000000` |
| Home dashboard page | `2700010000000000001` |
| `Articles` list | `2700020000000001000` |
| `Categories` list | `2700030000000001000` |

The ID family is local generation family `270`. Do not reuse it for another import test.

## Data Pattern

`Categories`:

- `Title` / Category Name
- `Text1` / Description

`Articles` included `Title`, `Text1`, `Text2`, and an attempted local lookup field. Runtime testing later proved this lookup should not be part of the first Knowledge Base baseline.

## Dashboard Pattern

The Home dashboard uses:

- search filter binding `__filter_filter_Keywords`
- page `filterVars` entry for `filter_Keywords`
- article Collection with `attrs.data.fulltext`
- category Collection
- dynamic-field controls for Collection item fields
- `nv_label` names for generated dashboard designer readability

## ReplaceIds Rules

`ReplaceIds` includes:

- root app/listset ID
- dashboard page ID
- local list IDs
- generated field IDs
- generated default view/layout IDs
- local sample row IDs referenced by local lookup sample values

`ReplaceIds` excludes:

- tenant/user IDs
- AppID `41`
- nonlocal metadata not owned by the package

## Validation Results

Passed:

- `node --check generate-knowledge-base-dashboard-v1.mjs`
- `node validate-yap-package.js knowledge-base-generated-v1-resource.json --mode generator --stage final`
- `node validate-yap-graph.js knowledge-base-generated-v1-resource.json --mode generator --stage final`
- `node build-yap-wrapper.js knowledge-base-generated-v1-resource.json knowledge-base-generated-v1.yap --title "Knowledge Base Generated v1" --description "..."`
- `node validate-yap-package.js knowledge-base-generated-v1.yap --mode generator --stage final`
- `node validate-yap-graph.js knowledge-base-generated-v1.yap --mode generator --stage final`

Only warning: `APP_THEME_EMPTY`, which is allowed for these dashboard learning baselines.

## Runtime Results

Tested at `https://<yourdomain>.yeeflow.com`.

Observed:

- upload accepted the generated `.yap`
- import metadata dialog showed `Knowledge Base Generated v1`
- import completed successfully
- app tile appeared in Shared Workspace
- app opened at `#/list-set/<workspace-id>/<listset-id>`
- runtime showed Yeeflow's empty component shell (`Add Component`) instead of the generated Home dashboard/navigation

Result: v1 is not a successful runtime baseline. The follow-up v2/v3/v4 isolation path found two fixes:

- child list/app metadata must match the proven generated app shape (`TenantID` and audit users populated, child `WorkspaceID: null`, root `ListSetID` not added ad hoc, no extra child `icon` property)
- generated native `Title` fields must use `FieldIndex: 0` in addition to `Status: 0`, `IsSystem: true`, and `IsIndex: true`

## Known Gaps

- `Sections` list and article-section lookup are deferred.
- Rich text and icon-upload fields are deferred.
- Nested category-to-article Collection filters are deferred.
- Search page and query-param apply-button flow are deferred.
- Admin page cards with application URL expressions are deferred.

## Generator Rules Learned

- Start Knowledge Base generation with Articles and Categories only.
- Keep article detail/navigation actions out of v1.
- Preserve native Title metadata for all generated lists.
- Use text category labels for the first generated Knowledge Base package; defer lookup fields until a dedicated lookup isolation package passes runtime.
- Native `Title` metadata includes `FieldIndex: 0`.
- Do not add nested Collection filters until flat Collection rendering is open/runtime-proven.
- Use a fresh ID family for every import test.
