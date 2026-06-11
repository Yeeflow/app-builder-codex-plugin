# Knowledge Base List Pattern

Source studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

Use this reference for Knowledge Base-style generated child lists inside app-level `.yap` packages.

## Source Lists

- `Categories`: category name, icon, description, parent category lookup
- `Sections`: section name, description, category lookup
- `Articles`: article title, summary, content, feature image, category lookup, section lookup

## Safe Runtime-Proven Generated Lists

Start with only:

`Categories`

- `Title` as Category Name
- `Text1` as Description

`Articles`

- `Title` as Article Title
- `Text1` as Summary
- `Text2` as Category Label

## Hard Rules

- Keep every generated `Title` field native: `Status: 0`, `IsSystem: true`, `IsIndex: true`, `FieldIndex: 0`.
- Do not copy the source `Title.Status: 1` values into generated packages.
- Use plain text `Category Label` for the first runtime baseline instead of article-to-category lookup metadata.
- Do not include `Categories.Parent category` in the first package because it is a self lookup and creates a dependency cycle.
- Do not include `Sections`, article-to-category lookup, or article-to-section lookup until each lookup pattern has imported and opened cleanly in an isolated package.
- When local app-level lookup samples are reintroduced, the target category sample record IDs may be local generated IDs and must be included in `ReplaceIds`.
- Do not place Knowledge Base `Articles.Category` lookup in `Text3`; v5-v7 import tests showed Articles stayed on a loading spinner even with blank lookup values and the lookup hidden from the list view.
- The source template places `Articles.Category` in `Text4`, but source-like `Text4` lookup isolations still failed list runtime: v8 imported and rendered Home while Categories and Articles stayed on loading spinners; v9 removed the generated `Text3` placeholder and Categories opened, but Articles still stayed on a loading spinner. Keep the v4 plain text `Category Label` baseline until a reduced/source-aligned lookup isolation opens lists cleanly.
- v10 adds `Articles.Text4` as a plain input field and imports; Home renders; Categories opens; Articles stays on a loading spinner with Chrome console `Uncaught RangeError: Wrong length!`. Do not treat the plain `Text4` slot as runtime-proven.
- v11 is the first runtime-proven Knowledge Base lookup isolation. It follows the user's exported v10 update: add `Categories.Decimal1` as `Order`, keep `Articles.Text4` as a plain input slot, add `Articles.Text3` as `Category Lookup`, and set `Rules.sort-first` to `{ "SortName": "Decimal1", "SortByDesc": false }`. Keep article lookup sample values blank. Articles loaded after one refresh, and the new-item lookup dropdown resolved Categories in Order sequence.
- Phase 1 adds a plain generated `Sections` list and combines it with the v11 lookup shape. Runtime import/open passed: Categories, Sections, and Articles rendered local sample rows after refresh stabilization where needed. Keep `Sections.Category` and `Articles.Section` as plain label text until source-style lookup chains are isolated.

## Runtime Lessons

- A package can import while list runtime still fails; list navigation must be opened as part of the proof.
- v2/v3 showed that Home/Categories can work while Articles remains on a spinner.
- v4 proved Articles after removing first-stage lookup metadata and setting native `Title.FieldIndex: 0`.
- v5/v6/v7 showed that an unresolved lookup list runtime issue can persist even without local lookup sample values and even when the lookup column is not visible in the list layout.
- v8 showed that moving the lookup to the source-like `Text4` slot is not sufficient by itself; v9 narrowed the failure to Articles lookup metadata by restoring Categories runtime. Do not advance to local lookup sample values until lookup metadata alone opens cleanly.
- v10 proved non-contiguous generated `Text4` alone was not enough. v11 proved the combined `Text3` lookup plus `Text4` plain slot and category `Decimal1` sort pattern. Because Articles needed one refresh on first open, keep this as a lookup-isolation pattern rather than the default first Knowledge Base package.
- Phase 1 proves the three-list app shape for learning use, but keeps the same refresh caveat. Do not promote lookup sample values, section lookup fields, or nested dashboard Collections until separately proven.

## Validation Notes

Embedded child lists in an app-level `.yap` are validated through `validate-yap-package.js` and `validate-yap-graph.js`. Standalone `.ydl` validation requires a standalone `.ydl` resource shape and is not authoritative for embedded child list objects.
