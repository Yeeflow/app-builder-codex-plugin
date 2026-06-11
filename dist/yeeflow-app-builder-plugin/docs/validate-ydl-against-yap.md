# validate-ydl-against-yap.js

`validate-ydl-against-yap.js` validates a Yeeflow `.ydl` data-list export or decoded data-list draft against app metadata.

It is read-only. It does not import, modify, or generate `.ydl`, `.yap`, or `.ywf` packages.

## Usage

```bash
node validate-ydl-against-yap.js "./Communication Records.ydl" ./nhic-ydl-metadata.json --mode compatibility
```

Generator-strict mode:

```bash
node validate-ydl-against-yap.js "./generated-list.decoded.json" ./nhic-yap-metadata.json --mode generator
```

## Inputs

The first argument may be:

- a `.ydl` wrapper file
- a decoded Yeeflow data-list package, provided the local inspector can parse it in a future workflow

The second argument is app metadata. Supported shapes:

- metadata from `extract-yap-metadata.js`
- compatible metadata from `extract-ydl-metadata.js`

When using `.ydl`-only metadata, app-level coverage is limited to the supplied list exports. Full `.yap` metadata is preferred for final generator validation.

## Modes

`compatibility`

Use for real historical exports. External dependencies and older structures are reported as warnings/dependencies where possible.

`generator`

Use for generated drafts. Missing lookup targets, unresolved workflow target lists, missing source ListSetID, and other dependency gaps become hard failures.

## Checks

The validator checks:

- source AppID and ListID against metadata
- missing standalone ListSetID as a dependency
- lookup target list existence
- lookup target ListSetID consistency when available
- lookup display field existence
- lookup search field existence
- lookup sample shape vs `multiple`
- custom form bound field references
- custom form lookup/list control dependencies
- custom code controls as risks/dependencies
- view column/filter/sort field references
- list workflow ContentList target lists and field mappings
- QueryData target list references
- AI and HTTP/API workflow nodes
- workflow field expression references where parseable

## Output

The command prints:

```json
{
  "status": "pass | pass_with_warnings | fail",
  "mode": "compatibility | generator",
  "errors": [],
  "warnings": [],
  "dependencies": [],
  "resolvedReferences": {
    "lookupTargets": [],
    "workflowTargets": [],
    "formReferences": [],
    "viewReferences": [],
    "sampleReferences": []
  },
  "summary": {
    "lookupRelationshipsChecked": 0,
    "workflowTargetsChecked": 0,
    "customFormsChecked": 0,
    "viewsChecked": 0,
    "sampleReferencesChecked": 0
  }
}
```

## Limitations

- `.ydl`-derived metadata cannot prove all app-level resources exist unless the related lists were supplied.
- Record-level lookup sample validation is limited unless target list sample records are available in the metadata.
- Workflow expression parsing is best-effort.
- AI agent and HTTP/API dependencies are reported, not validated against a live environment.

## Recommended Use

1. Extract full app metadata from `.yap` when available.
2. Validate generated `.ydl` drafts in `generator` mode.
3. Stop if lookup targets, workflow target lists, field mappings, custom code risks, or placeholders remain unresolved.
4. Use `compatibility` mode only for studying real exports or import/export round-trip differences.
