# Yeeflow YAP Schema Standard

Proof level: product-schema-backed, product-rule-backed, validator-backed after the checks in this branch. This is not runtime-import-proven.

## Sources

- Product schema reference: `/Users/Renger/Downloads/yap-schema.json`
- Latest product schema reference: `/Users/Renger/Downloads/yap-v1-schema_v2.json`
- Product rules reference: `/Users/Renger/Downloads/Yeeflow App Creation Rules.md`
- Requested `/mnt/data/...` attachment paths were not present in this desktop workspace; the same provided files were available from `/Users/Renger/Downloads/`.

## Wrapper

The top-level `.yap` wrapper is a `ListTemplateDownloadResponse` object. The schema requires:

- `Title`
- `Description`
- `IconUrl`
- `IsListSet`
- `Resource`

`Resource` must be a string starting with `[______gizp______]`. The suffix is base64 gzip text that decodes to the resource object.

Hard validation errors:

- missing required wrapper property
- `Resource` not a string
- `Resource` missing the `[______gizp______]` prefix
- `Resource` cannot be base64/gzip decoded
- decoded `Resource` is not valid JSON
- decoded `Resource.Data` is missing or not parseable JSON

## Decoded Resource

Decoded `Resource.Data` is a JSON string containing `ListExportInfo`.

`ListExportInfo.Item` is required. `Childs`, `Forms`, `FormReports`, `DataReports`, `FormNewReports`, `OtherModules`, and app metadata arrays must be arrays when present. The schema uses `additionalProperties: false` in several places, but that should not be enforced globally yet because the schema is a standard reference and existing valid exports may contain product fields that are not fully covered. Unknown properties are warning-level unless product team marks them import-breaking.

## ListExportItem

`ListExportItem` requires:

- `Defs`
- `Layouts`

Both must be arrays. Empty arrays are valid.

Product-team import failure feedback confirmed:

- `Item.Defs: null` is invalid.
- `Item.Layouts: null` is invalid.
- Use `[]` when there are no definitions or layouts.

Hard validation errors:

- missing `Item`
- missing `Defs`
- missing `Layouts`
- `Defs === null`
- `Layouts === null`
- `Defs` not array
- `Layouts` not array
- same rules for every `Childs[]` resource

## CustomListModel

`yap-v1-schema_v2.json` adds schema-backed `CustomListModel` constraints for list-like resources:

- `Flags` is fixed to `1`.
- `Status` is fixed to `1` when present. The v2 schema defines the fixed value, but the field is not marked required; known imported packages may omit it.
- `Type` is limited to:
  - `1` List
  - `16` Document
  - `32` WorkflowReport
  - `64` DataReport
  - `128` EPUser
  - `1024` ListSet

Business Travel runtime practice made `ListModel.Flags = 1` import-sensitive: the package imported after root and child list resources were repaired to include `Flags = 1`. Validators should hard-fail generated packages when `ListModel.Flags` is missing or not `1`.

Follow-up user testing proved the same fixed Business Travel package imports, opens, opens the `Business Travel Request` workflow, and publishes successfully after schema, variable-reference, and publish-safe assignment repairs. That proof is package-specific; workflow execution, request submission, routing, data mutation, and true Finance Manager position assignment remain unproven.

Validation severity:

- `Flags` missing or not `1`: hard error for generated packages.
- `Status` present and not `1`: hard error.
- `Status` missing: warning or accepted, because schema v2 fixes the value but does not require the property and an imported Business Travel package omitted it.
- invalid `Type`: hard error.

## ListDefinitionModel

Schema-backed and app-creation rules remain mandatory for generated list fields:

- `DisplayName`, `FieldName`, and `InternalName` are unique within the same list.
- `DisplayName`, `FieldName`, and `InternalName` are at most 255 characters.
- `InternalName` matches `[a-zA-Z0-9_]`.
- `FieldName` ends with a numeric suffix matching `FieldIndex` for generated non-system fields.
- Supported schema field `Type` values are the 28 product-rule field types.

Compatibility note: the Data List field export-learning milestone found `metadata` as a single metadata field type. Keep `metadata` accepted as export-proven even though the schema/rules 28-type list names `mutiple-metadata`.

## Forms And NoRule

`ProcessFormInfo.Key` must match `[a-zA-Z0-9_]` and stay within 255 characters.

`ProcessFormInfo.NoRule` uses the process number format object:

```json
{
  "Prefix": "test_{date}_{index}",
  "StartIndex": 1,
  "CustomLength": 8,
  "AutoIncrement": 1
}
```

`ProcessFormNoRule` requires `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement`. `Prefix` must include `{index}`.

Hard validation errors:

- malformed or missing required `NoRule` where approval/process form generation requires it
- missing `{index}` in `NoRule.Prefix`
- invalid process key characters

## OtherModules

Schema-backed `OtherModules[]` entries have:

- `Type`
- `Data`

Known types are `Connections`, `Agents`, and `Knowledges`. `Data` should be an array for these modules.

## App Agent/Copilot Resource Permissions

Access app resources is represented by agent/copilot components where:

- component `Type = 2`
- component `SubType = 10`
- `Settings` is JSON
- `Settings.resources` or `Settings.resources.permissions` contains permission groups

Schema-backed bitwise masks:

- `approvalForms`: Submit `1`, ReadTasks `16`, ProcessTasks `32`
- `dataLists`: Submit `1`, Edit `2`, Delete `4`, Read `8`
- `documentLibraries`: Submit `1`, Edit `2`, Delete `4`, Read `8`
- `aiAgents`: Submit `1`

Hard validation errors are appropriate when these groups contain non-integer permissions or bits outside the allowed mask.

Open product conflict:

- `yap-schema.json` says `formReports` and `dataReports` allow `0` or Read `8`.
- Updated `Yeeflow App Creation Rules.md` says `formReports` and `dataReports` allow Submit `1`.

Until product team resolves this conflict, validators should warn on the mismatch for `formReports` and `dataReports`, not hard-fail either `1` or `8`.

## Generator Rules

Generators that emit `.yap`, `.ydl`, or `.ywf` packages must:

- emit `Item.Defs` and `Item.Layouts` as arrays, never `null`
- emit child resource `Defs` and `Layouts` as arrays, never `null`
- emit root and child `ListModel.Flags = 1`
- emit `ListModel.Status = 1` when they choose to include `Status`
- keep `ListModel.Type` within the v2 schema allowed set
- preserve the FieldIndex/FieldName suffix synchronization gate
- keep list identifiers unique and valid
- emit valid process keys
- emit `NoRule` as the required object when approval/process forms need numbering
- include `{index}` in `NoRule.Prefix`
- keep app resource permission flags within schema-backed bitwise masks
- pass schema-standard validation before import attempts

## Proof Boundary

This branch is product-schema-backed and product-rule-backed. Validator and generator guidance is hardened. Runtime import/open behavior is not proven by this pass and requires a focused import test later, especially for a package that previously failed with `Item.Defs: null`.
