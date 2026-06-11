# validate-ydl-list.js

`validate-ydl-list.js` is a read-only validator for decoded Yeeflow data-list packages and standalone `.ydl` exports.

It is intended to run before any future `.ydl` wrapper generation or import testing.

## Usage

Validate a real exported `.ydl` in tolerant compatibility mode:

```bash
node validate-ydl-list.js "./Portfolio Management.ydl" --mode compatibility
```

Validate a generated decoded `Resource.Data` JSON draft:

```bash
node validate-ydl-list.js "./generated-list.decoded.json" --mode generator --stage draft
```

Validate a generated decoded `Resource.Data` JSON final candidate:

```bash
node validate-ydl-list.js "./generated-list.decoded.json" --mode generator --stage final
```

## Modes

`compatibility`

Use for studying real historical Yeeflow exports. External lookup targets, workflow target lists, sparse metadata, and old layout artifacts are reported as warnings/dependencies where possible.

`generator`

Use for generated drafts. The validator is stricter: unresolved lookup targets, unresolved workflow target lists, and unresolved placeholders fail validation unless future tooling declares and resolves those dependencies.

## Stages

`draft`

Use for generated drafts that may intentionally contain metadata placeholders. In `generator + draft`, unresolved placeholders are reported in `placeholders[]` and as warnings, while real structural issues remain errors.

`final`

Use for final candidates before wrapper build or sandbox import. In `generator + final`, unresolved placeholders are hard errors.

The default stage is `final`.

## Input Types

The validator supports:

- a `.ydl` wrapper file with a top-level `Resource` field using `[______gizp______]` + base64 + gzip.
- a decoded Resource JSON object with a `Data` JSON string.
- a decoded `Resource.Data` JSON object containing `Item`.

Large numeric IDs are preserved as strings during JSON parsing.

## Checks

The validator checks:

- wrapper JSON validity and Resource gzip/base64 decoding for `.ydl` inputs
- decoded Resource and `Resource.Data` JSON validity
- `Data.Item`, `Item.ListModel`, `Item.Defs`, `Item.Layouts`, and `Item.ListDatas`
- list identity fields such as title, AppID, ListID, ListSetID, and MainListType
- field IDs, names, internal names, display labels, field/control types, duplicate names, and JSON Rules
- normalized field type detection
- choice metadata for radio/dropdown/checkbox fields
- lookup metadata such as appid, listsetid, listid, and display/list field
- view `LayoutView` parsing, displayed columns, filters, sorts, default view
- custom form Resource parsing and recursive control binding checks
- list workflow DefResource parsing, ContentList nodes, QueryData nodes, AI nodes, and field/list references
- sample data record shape, field names, lookup values, multi-choice values, and date/datetime values
- placeholder strings matching `^__.*REQUIRED.*__$`

## Output

The command prints JSON:

```json
{
  "status": "pass | pass_with_warnings | fail",
  "mode": "compatibility | generator",
  "stage": "draft | final",
  "errors": [],
  "warnings": [],
  "placeholders": [],
  "dependencies": [],
  "summary": {
    "fields": 0,
    "views": 0,
    "customForms": 0,
    "workflows": 0,
    "sampleRecords": 0,
    "lookupRelationships": 0
  }
}
```

## Current Limitations

- It validates known `.ydl` structures learned from the NHIC exports; uncommon Yeeflow list features may need new rules.
- It does not yet accept a separate dependency mapping file.
- It does not prove that external lookup targets exist in a live Yeeflow environment.
- It reports AI and HTTP/API workflow nodes, but does not validate runtime credentials or agent availability.
- It does not build, import, or modify any package.

## Recommended Workflow

1. Inspect exports with `inspect-ydl-package.js`.
2. Extract reusable metadata with `extract-ydl-metadata.js`.
3. Validate real exports in `compatibility` mode.
4. Validate generated decoded list drafts with `--mode generator --stage draft`.
5. Validate final candidates with `--mode generator --stage final`.
6. Stop before wrapper build if final validation fails, placeholders remain, or dependencies are unresolved.
