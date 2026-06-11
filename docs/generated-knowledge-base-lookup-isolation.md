# Generated Knowledge Base Lookup Isolation

Scope: article-to-category lookup learning after the runtime-proven `knowledge-base-generated-v4.yap` baseline.

Source export studied: `/Users/Renger/Downloads/Knowledge Base_1.yap`

## Source Lookup Pattern

The real Knowledge Base source stores article category lookup metadata on the `Articles` list as:

- `FieldName: "Text4"`
- `DisplayName: "Category"`
- `InternalName: "Category"`
- `FieldType: "Text"`
- `Type: "lookup"`
- `FieldIndex: 4`
- `Rules.listid`: local `Categories` list ID
- `Rules.listsetid`: root app/listset ID
- `Rules.listfield`: `Title`
- `Rules.displayStyle`: `dropdown`

Article sample lookup values are plain target category `ListDataID` strings in `Text4`.

## Isolation Results

| Package | Change tested | Validation | Runtime result |
| --- | --- | --- | --- |
| `knowledge-base-lookup-v5.yap` | Added `Articles.Text3` lookup to local `Categories.Title`, with local category sample IDs in article rows | package passed with `APP_THEME_EMPTY`; graph passed | imported; Home and Categories rendered; Articles stayed on loading spinner |
| `knowledge-base-lookup-v6-empty-samples.yap` | Kept `Articles.Text3` lookup but blanked article lookup sample values | package passed with `APP_THEME_EMPTY`; graph passed | imported; Home and Categories rendered; Articles stayed on loading spinner |
| `knowledge-base-lookup-v7-hidden-lookup-column.yap` | Kept `Articles.Text3` lookup, blank sample values, and hid lookup from Articles list view | package passed with `APP_THEME_EMPTY`; graph passed | imported; Home and Categories rendered; Articles stayed on loading spinner |
| `knowledge-base-lookup-v8-text4-lookup.yap` | Moved lookup to source-like `Articles.Text4`, kept blank values, and hid lookup from Articles list view | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported; Home dashboard rendered; Categories and Articles stayed on loading spinners |
| `knowledge-base-lookup-v9-text4-only.yap` | Started from the runtime-proven v4 shape, added only blank source-like `Articles.Text4` lookup metadata, omitted the generated `Text3` placeholder, and kept the lookup hidden from the list view | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported; Home dashboard rendered; Categories opened with 3 rows; Articles stayed on loading spinner |
| `knowledge-base-text4-input-v10.yap` | Started from the runtime-proven v4 shape and added `Articles.Text4` as a plain input field instead of lookup metadata | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported; Home dashboard rendered; Categories opened with 3 rows; Articles stayed on loading spinner; Chrome console showed `Uncaught RangeError: Wrong length!` |
| `knowledge-base-category-lookup-v11.yap` | Studied the user's exported v10 update, added `Categories.Decimal1` Order and `Articles.Text3` Category Lookup sorted by `Decimal1`, retained `Articles.Text4` as a plain input slot, and kept lookup sample values blank | package passed with `APP_THEME_EMPTY`; graph passed; wrapper round-trip passed | imported; Home dashboard rendered; Categories opened with 3 rows and Order values; Articles initially spun, then loaded after one refresh; new-item form resolved Category Lookup options sorted Getting Started, Operations, Application Builder |

## Current Finding

The v5-v7 failures show that using `Text3` for the generated lookup is not safe for the Knowledge Base article list. The failure still occurred when lookup sample values were blank and when the lookup was hidden from the visible list layout, so the issue is not only sample-value remapping or visible-column rendering.

The v8 failure shows that moving the lookup to source-like `Text4` is still not sufficient. Because both `Categories` and `Articles` stayed on loading spinners while the static Home dashboard rendered, the lookup field shape or list metadata still has an unresolved runtime dependency.

The v9 result narrows that finding: with the generated `Text3` placeholder removed and only `Articles.Text4` lookup metadata added, `Categories` opens correctly again while `Articles` stays on a loading spinner. This points to the article list lookup metadata itself rather than the category list definition or a generated `Text3` field-slot collision.

The v10 package isolates the `Text4` field slot without lookup metadata. It imports and opens, and Home/Categories render, but Articles stays on the loading spinner. The captured Chrome console error is `Uncaught RangeError: Wrong length!`. Because v10 contains no lookup relationship, non-contiguous generated `Text4` usage or field/list-view ordering by itself was not safe.

The user-exported v10 update changed the shape in a useful way: it added `Categories.Decimal1` (`Order`) and added `Articles.Text3` as `Category Lookup`, sorted by `Categories.Decimal1`, while keeping `Articles.Text4` as a plain input slot. The generated v11 reproduction imports and opens. Articles may show a first-load spinner, but one browser refresh loaded the grid. The lookup dropdown in the new-item form resolved the local Categories records in the expected Order sort sequence.

## Generator Rules

- The v4 plain text `Category Label` baseline remains the safest first package.
- v11 proves one generated lookup shape for a later isolation stage:
  - `Categories.Decimal1` as `Order`
  - `Articles.Text4` as a plain input slot
  - `Articles.Text3` as `Category Lookup`
  - `Rules.listid`: local generated `Categories` list ID
  - `Rules.listsetid`: root generated listset ID
  - `Rules.listfield`: `Title`
  - `Rules.sort-first.SortName`: `Decimal1`
  - `Rules.sort-first.SortByDesc`: `false`
  - blank lookup sample values in article rows
- Keep lookup sample values blank until a separate package proves local target sample IDs can be saved and remapped cleanly.
- After lookup metadata opens, run a second package with local target sample row IDs in lookup values and include those local target IDs in `ReplaceIds`.
- v8/v9 prove that `Articles.Text4` lookup metadata alone is not safe.
- v10 proves that adding a non-contiguous generated `Text4` field without `Text3` is also not safe for Articles runtime.
- v11 proves the manually discovered `Text3` lookup + `Text4` plain slot + category sort field pattern, with the caveat that Articles needed one refresh on first open.

## Stop Conditions

Stop before promoting lookup support if:

- Articles list still stays on a loading spinner after one refresh.
- Chrome/network evidence cannot be collected due local browser permission limits.
- lookup target list or display field cannot be resolved by `validate-yap-graph.js`.
- a generated lookup would need to reuse imported/remapped IDs from a previous package.
