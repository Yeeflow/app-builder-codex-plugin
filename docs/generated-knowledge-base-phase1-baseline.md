# Generated Knowledge Base Phase 1 Baseline

Package: `knowledge-base-phase1-full.generated.yap`

Download copy: `/Users/Renger/Downloads/Knowledge Base Phase 1 Full.yap`

Status: validation passed and runtime import/open/dashboard/list smoke tests passed at `https://<yourdomain>.yeeflow.com`.

## What It Proves

This is the first generated Knowledge Base Phase 1 package that combines the safe v4 dashboard/list baseline with the later v11 lookup isolation pattern and the source template's third `Sections` list.

It proves:

- one root app/listset
- two Type `103` dashboard pages: `Home Page` and `Article Library`
- local `Categories`, `Sections`, and `Articles` lists
- `Categories.Decimal1` as Order
- `Articles.Text4` as a plain input slot
- `Articles.Text3` as Category Lookup sorted by `Categories.Decimal1`
- Home dashboard article/category/section Collections
- Article Library dashboard article Collection
- dynamic field controls inside Collection item templates
- meaningful `nv_label` names for generated dashboard controls
- sample rows render in dashboard Collections and list grids

## Resources

| Resource | ID family |
| --- | --- |
| Root app/listset | `281001...` |
| Home dashboard page | `281001...0001` |
| Article Library dashboard page | `281001...0002` |
| `Articles` list | `281002...` |
| `Categories` list | `281003...` |
| `Sections` list | `281004...` |

Do not reuse this ID family for another import test.

## Runtime Evidence

Imported app was remapped by Yeeflow to:

`#/list-set/<workspace-id>/<listset-id>/<list-id>`

Verified:

- import metadata parsed package name and description
- app tile appeared as `Knowledge Base Phase 1 Full`
- app opened as `Home Page | Knowledge Base Phase 1 Full`
- Home dashboard rendered article, category, and section Collections
- Article Library dashboard rendered article Collection rows
- `Categories` opened with sample rows and `Order`/`Accent` values
- `Sections` opened with sample rows after refresh stabilization
- `Articles` opened with sample rows after the known first-open refresh stabilization
- generated Articles add form displayed `Category Lookup`

No record was saved during form inspection.

Runtime caveat: the same refresh stabilization seen in the v11 lookup baseline remains present for some list pages. The app imports and runs, but list pages may initially render the shell before rows appear after refresh. Chrome console also logged Yeeflow runtime `RangeError: Wrong length!` entries during refresh transitions. Because the final rows rendered and the dashboard/list data appeared, this is documented as Phase 1 passed with a runtime caveat, not as a production-ready pattern.

## Validation Results

Passed:

- `node --check generate-knowledge-base-phase1-full.mjs`
- `node validate-yap-package.js knowledge-base-phase1-full-resource.json --mode generator --stage final`
- `node validate-yap-graph.js knowledge-base-phase1-full-resource.json --mode generator --stage final`
- `node build-yap-wrapper.js knowledge-base-phase1-full-resource.json knowledge-base-phase1-full.generated.yap --title "Knowledge Base Phase 1 Full" --description "..."`
- `node validate-yap-package.js knowledge-base-phase1-full.generated.yap --mode generator --stage final`
- `node validate-yap-graph.js knowledge-base-phase1-full.generated.yap --mode generator --stage final`

Only package warning: `APP_THEME_EMPTY`.

## Generator Rules Learned

- Keep the v4 package as the safest first Knowledge Base package.
- Use the Phase 1 package only after the v4 and v11 patterns are already accepted.
- Include `Sections` as a plain local list first; do not add source lookup from Sections to Categories until isolated.
- For Articles, keep both a plain category label and the v11 Category Lookup pattern.
- Keep lookup sample values blank until local lookup sample IDs are separately proven.
- Add dashboard Collections as flat local-list Collections; defer nested category-to-article Collections.
- Use meaningful `nv_label` values on dashboard containers, Collections, cards, fields, and sections.

## Deferred Phase 2 Items

- nested category-to-article Collections
- source-style `Sections.Category` and `Articles.Section` lookup chains
- lookup sample values referencing local category rows
- rich text body and image fields
- Search page query-param behavior
- Admin action cards and deep links
- custom list forms beyond generated default form behavior
- full-text search behavior beyond the visible dashboard search control
