# Yeeflow Def App-Context Validator

Validate a decoded Yeeflow approval form `Def` JSON draft against extracted `.yap` metadata.

This validator is read-only. It does not import into Yeeflow, operate the UI, modify `.ywf` / `.yap` / metadata files, base64 encode, or create packages.

## Usage

```bash
node validate-ywf-def-against-yap.js \
  ./travel-request-def.sandbox.json \
  ./procurement-metadata.json \
  --mode final \
  --profile generator
```

Use `draft` mode while placeholders are expected:

```bash
node validate-ywf-def-against-yap.js ./draft-def.json ./app-metadata.json --mode draft
```

## Profiles

`--profile generator` is the default and is strict. Use it for generated packages.

```bash
node validate-ywf-def-against-yap.js ./def.json ./metadata.json --mode final --profile generator
```

In generator profile:

- `SOURCE_ROW_FIELD_NOT_FOUND` remains an error.
- missing workflow variables remain errors.
- missing target fields remain errors.
- final mode fails if placeholders remain.

`--profile compat` is for studying real exports that may contain historical or stale mappings.

```bash
node validate-ywf-def-against-yap.js ./def.json ./metadata.json --mode final --profile compat
```

In compat profile, `SOURCE_ROW_FIELD_NOT_FOUND` is downgraded to `SOURCE_ROW_FIELD_NOT_FOUND_COMPAT` only when the target field resolves and the source list variable exists, so the only missing piece is the row field itself. The warning includes suggested aliases, but the validator never rewrites mappings automatically.

## What It Checks

ContentList targets:

- `appid` matches the metadata app ID when present.
- `listsetid` matches the main ListSetID or a known list ListSetID.
- `listid` exists in `metadata.lists[]`.
- target list names are resolved where possible.

ContentList field mappings:

- each `listdatas[].Columns` value resolves to a target list field.
- source expressions are classified as literal, workflow variable, list row variable, expression array, list-trigger field, function, or unknown.
- workflow variable references exist in `variables.basic`.
- list row variable references exist in the bound `variables.listref`.
- likely source/target type mismatches are reported as warnings.

Where conditions:

- edit/remove `wheres[].left` fields exist in the target list, except `ListDataID`.
- where-right expressions reference existing variables/list fields when parseable.

Lookup sources:

- lookup source list IDs exist in metadata.
- lookup display fields exist in the source list.

Document dependencies:

- `GenerateDocument` nodes are detected.
- document IDs are matched against known document libraries/dependencies when possible.
- template files are warned as not fully verifiable unless metadata exposes them clearly.

AI references:

- AI nodes and AI form actions are detected.
- Agent IDs are checked against `metadata.aiReferences` when available.

Placeholders:

- draft mode reports unresolved `__...REQUIRED...__` placeholders as warnings.
- final mode fails if placeholders remain.

## Output

The script prints a JSON report:

```json
{
  "status": "pass | pass_with_warnings | fail",
  "mode": "draft",
  "profile": "generator",
  "errors": [],
  "warnings": [],
  "resolvedReferences": {
    "contentListTargets": [],
    "fieldMappings": [],
    "lookupSources": [],
    "documentDependencies": [],
    "aiReferences": []
  },
  "summary": {
    "contentListNodesChecked": 0,
    "fieldMappingsChecked": 0,
    "lookupSourcesChecked": 0,
    "documentDependenciesChecked": 0,
    "aiReferencesChecked": 0,
    "typeWarnings": 0,
    "compatWarnings": 0
  }
}
```

## Recommended Pipeline

```bash
node extract-yap-metadata.js "./Procurement Management.yap" --out ./procurement-metadata.json --md ./procurement-metadata.md
node validate-ywf-def.js ./decoded-def.json --mode final
node validate-ywf-def-against-yap.js ./decoded-def.json ./procurement-metadata.json --mode final --profile generator
```

This app-context validator complements the structural validator. A Def can be structurally valid but still reference missing app resources or incompatible list fields.

Recommendation: use `generator` for generated packages and release gates. Use `compat` for studying real exports and import-history artifacts where you want a report rather than a hard stop on known legacy inconsistencies.
