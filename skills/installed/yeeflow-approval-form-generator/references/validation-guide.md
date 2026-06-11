# Validation Guide

Use these validators before any wrapper build.

## Structural Def Validation

Run:

```bash
node scripts/validate-ywf-def.js ./form-def.json --mode draft
node scripts/validate-ywf-def.js ./form-def.json --mode final
```

Draft mode may contain placeholders. Final mode must not.

Checks include:

- required decoded Def sections
- variable/listref uniqueness and consistency
- page/control binding validity
- list control metadata
- request and approval pages
- taskurl references
- workflow node connectivity
- SequenceFlow targets and source inference
- approved/rejected approval paths
- ContentList structure
- SetVariableTask variable references
- unresolved placeholders

## App-Context Validation

First extract metadata from a `.yap` export:

```bash
node scripts/extract-yap-metadata.js "./Application.yap" --out ./app-metadata.json --md ./app-metadata.md
```

Then validate:

```bash
node scripts/validate-ywf-def-against-yap.js ./form-def.json ./app-metadata.json --mode final --profile generator
```

Use `--profile generator` for generated packages. Use `--profile compat` only when studying real exports that contain known compatibility quirks.

Checks include:

- ContentList target app/listset/list existence
- target field internal names
- source workflow variables
- source list-row variables
- source/target type compatibility
- lookup sources
- lookup display/sort fields
- lookup additional-field source fields
- lookup additional-field target variables
- document dependencies
- AI references
- placeholders in draft/final modes

When an approval form targets a newly generated data list, validate against metadata extracted from the imported/exported-back `.ydl`. Do not validate or build the final `.ywf` against pre-import generated list IDs.

## Required Validation Gate

A decoded Def is wrapper-ready only when:

- structural validation passes in final mode
- app-context validation passes in final/generator mode when target app metadata is involved
- `ContentList` targets and mappings resolve against exported-back generated-list metadata when the storage list was generated
- no placeholders remain
- FlowKey matches `defkey`
- WorkflowType matches `workflowType`

Do not build `.ywf` if any of these fail.
