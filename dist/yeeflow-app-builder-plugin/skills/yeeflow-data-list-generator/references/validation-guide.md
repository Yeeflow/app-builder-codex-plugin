# Validation Guide

Use local tools only. Do not import or operate Yeeflow UI.

## Structural Validation

Validate real exports in compatibility mode:

```bash
node scripts/validate-ydl-list.js "./Real Export.ydl" --mode compatibility
```

Validate generated drafts:

```bash
node scripts/validate-ydl-list.js ./generated.decoded.json --mode generator --stage draft
```

Validate final decoded candidates:

```bash
node scripts/validate-ydl-list.js ./generated.final.json --mode generator --stage final
```

With dependencies:

```bash
node scripts/validate-ydl-list.js ./generated.final.json --mode generator --stage final --dependency-map ./dependencies.json
```

Final mode must have no placeholders and no unresolved dependencies.

## App Context Validation

Use when lookups, workflows, or app resources exist:

```bash
node scripts/validate-ydl-against-yap.js ./list.ydl ./app-metadata.json --mode generator
```

Full `.yap` metadata gives better confidence than isolated `.ydl` metadata.

## Wrapper Build

Build only after final validation passes:

```bash
node scripts/build-ydl-wrapper.js \
  ./generated.final.json \
  ./generated.ydl \
  --title "List Name" \
  --description "Sandbox generated data list" \
  --dependency-map ./dependencies.json
```

The builder round-trips:

- wrapper JSON
- Resource prefix
- base64
- gzip
- Resource JSON
- `Resource.Data`
- source equality
- no placeholders
- final validation

## Important Checks

`validate-ydl-list.js` checks:

- `Item`, `ListModel`, `Defs`, `Layouts`, `ListDatas`
- field IDs/names/types/Rules
- views and displayed columns
- custom forms and bound controls
- list workflows and target lists
- sample data value shapes
- lookup relationships
- placeholders
- unsafe external lookup sample values in `ReplaceIds`

`build-ydl-wrapper.js` refuses to write when validation fails. With a dependency map, it excludes resolved external dependency IDs from `Resource.ReplaceIds`.

For generated lists that will become approval-form storage targets, wrapper validation is not the final handoff. The user must import the `.ydl`, export the list back, and use exported-back list/field metadata to patch the approval form `ContentList` target.
