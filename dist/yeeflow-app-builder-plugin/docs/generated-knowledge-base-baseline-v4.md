# Generated Knowledge Base Baseline v4

Package: `knowledge-base-generated-v4.yap`

Download copy: `/Users/Renger/Downloads/Knowledge Base Generated v4.yap`

Status: validation passed and runtime import/open/list smoke tests passed at `https://<yourdomain>.yeeflow.com`.

## What It Proves

This is the first runtime-proven simplified Knowledge Base generated package.

It proves:

- one root app/listset
- one Type `103` Home dashboard
- local `Categories` list
- local `Articles` list
- dashboard search filter with `filterVars`
- dashboard Collection controls bound to local lists
- dynamic-field controls inside Collection item templates
- generated list navigation for dashboard and child lists
- sample rows render in dashboard Collections and list grids

## Resources

| Resource | ID family |
| --- | --- |
| Root app/listset | `273001...` |
| Home dashboard page | `273001...0001` |
| `Articles` list | `273002...` |
| `Categories` list | `273003...` |

Do not reuse this ID family for another import test.

## Runtime Evidence

Imported app was remapped by Yeeflow to:

`#/list-set/<workspace-id>/<listset-id>/<list-id>`

Verified:

- app tile appeared as `Knowledge Base Generated v4`
- Home dashboard opened
- article Collection rendered 3 cards
- category Collection rendered 3 cards
- `Categories` list opened with 3 rows
- `Articles` list opened with 3 rows
- no visible `datas/query` 400 state occurred during list smoke tests

## Fixes From Failed Attempts

v1 imported but opened as an empty component shell. v2/v3 opened the dashboard, but `Articles` stayed on the loading spinner.

v4 fixed the runtime issue by:

- aligning generated child list metadata to the proven generated app shape
- keeping child `WorkspaceID: null`
- removing ad hoc root `ListSetID` assignment in `ListModel`
- removing the unproven article-to-category lookup from the first generated package
- setting native `Title.FieldIndex = 0`
- setting child list `ListModel.LayoutView = null`

## Generator Rules Learned

- First Knowledge Base baseline should use category label text, not lookup fields.
- Lookup isolation after v4 showed `Articles.Text3` lookup is not safe: v5 with local sample IDs, v6 with blank lookup values, and v7 with the lookup hidden from the list view all imported but left Articles on a loading spinner.
- The source template uses `Articles.Text4` for Category lookup; v8 validates and round-trips with that source-like slot, imports, and renders Home, but Categories and Articles stay on loading spinners. v9 removes the generated `Text3` placeholder and confirms Categories can open while Articles still spins. v10 imports with `Text4` as a plain input field, renders Home, and opens Categories, but Articles still spins with Chrome console `Uncaught RangeError: Wrong length!`. Do not add non-contiguous `Text4` or lookup metadata beyond the v4 baseline.
- v11 proves a later-stage lookup isolation based on the user's exported v10 update: `Categories.Decimal1` Order, `Articles.Text4` plain input slot, and `Articles.Text3` Category Lookup sorted by `Decimal1`. It imports and opens; Articles may require one refresh on first open; the lookup dropdown resolves Categories sorted by Order. Keep v4 as the safest baseline and use v11 only when lookup is explicitly part of the test.
- Every generated data-list `Title` field must preserve:
  - `FieldName: "Title"`
  - `Status: 0`
  - `IsSystem: true`
  - `IsIndex: true`
  - `FieldIndex: 0`
- Child list metadata should preserve populated tenant/user audit fields and `WorkspaceID: null`.
- Do not add unproven extra top-level child list properties.
- Keep `Sections`, rich text, images, nested Collections, lookup fields, and Admin action links for later isolated stages.

## Validation Results

Passed:

- `node --check generate-knowledge-base-dashboard-v1.mjs`
- `node validate-yap-package.js knowledge-base-generated-v4-resource.json --mode generator --stage final`
- `node validate-yap-graph.js knowledge-base-generated-v4-resource.json --mode generator --stage final`
- `node build-yap-wrapper.js knowledge-base-generated-v4-resource.json knowledge-base-generated-v4.yap --title "Knowledge Base Generated v4" --description "..."`
- `node validate-yap-package.js knowledge-base-generated-v4.yap --mode generator --stage final`
- `node validate-yap-graph.js knowledge-base-generated-v4.yap --mode generator --stage final`

Only package warning: `APP_THEME_EMPTY`.
