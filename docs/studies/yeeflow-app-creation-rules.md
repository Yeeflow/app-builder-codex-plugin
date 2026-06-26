# Yeeflow App Creation Rules

Source: product-team rules document, `/Users/Renger/Downloads/Yeeflow App Creation Rules.md`.

Note: the user-provided `/mnt/data/Yeeflow App Creation Rules.md` path was not present in this local workspace; the same named Downloads file was readable and used as the product-rule source. The original reference document was not modified.

Proof labels used here:

- `product-rule-backed`: directly from the product-team rules document or product-team issue feedback.
- `validator-backed`: implemented in local validators or the focused inspector.
- `local-generation-fixed`: generated package source was patched and local validation can prove the generated shape.
- `not runtime-import-proven`: no broad runtime import/open test was run in this pass.

## Supported List Field Types

`product-rule-backed`

The supported list field `Type` values are:

| Category | Type values |
| --- | --- |
| Text and input | `input`, `textarea`, `richtext`, `hyperlink` |
| Numeric and financial | `input_number`, `currency`, `percent`, `calculated-column`, `rate` |
| Selection and choice | `switch`, `checkbox`, `radio`, `select`, `tag` |
| Date and time | `datepicker`, `time` |
| Identity and organization | `identity-picker`, `organization-picker`, `cost-center-picker`, `signer` |
| Uploads and media | `file-upload`, `icon-upload` |
| Advanced and system | `lookup`, `mutiple-metadata`, `location-picker`, `flowstatus`, `autonumber`, `list` |

Unknown `Type` values are warning-first because older export evidence can contain uncommon or product-internal controls.

## Primitive Length Constraints

`product-rule-backed`

Underlying primitive field type constraints:

| Primitive `FieldType` | Length range |
| --- | --- |
| `Text` | 1-300 characters |
| `Bit` | 1-50 characters |
| `Decimal` | 1-200 characters |
| `Datetime` | 1-200 characters |

These are product rules. This pass did not add broad value-length hard failures because generated packages usually define schemas, not user-entered values. Identifier limits below are enforced directly.

## Identifier Rules

`product-rule-backed`, `validator-backed`

Within a single list:

- `DisplayName` must be unique.
- `FieldName` must be unique.
- `InternalName` must be unique.
- `InternalName` may contain only letters, numbers, and underscores: `[a-zA-Z0-9_]`.
- `DisplayName`, `FieldName`, and `InternalName` must each be at most 255 characters.

Generated-package validation treats duplicate identifiers, invalid `InternalName`, and over-length identifiers as hard errors.

## FieldIndex And FieldName Synchronization

`product-rule-backed`, `validator-backed`

For generated non-system list fields, the numeric suffix at the absolute end of `FieldName` must match `FieldIndex`.

Examples:

- Valid: `FieldIndex: 11`, `FieldName: "Text11"`.
- Invalid: `FieldIndex: 11`, `FieldName: "Text6"`.

System/native fields such as `Title` are excluded from this suffix rule. `Title` keeps `FieldIndex: 0` and native metadata.

Known failure verified read-only:

- Package: `/Users/Renger/Downloads/Workflow Actions Runtime Baseline (1).yap`.
- List: `Purchase Requests Runtime Test`.
- Product-reported blocker: users could not create a manual new field and saw "The value for the field already exists, please enter a new value."
- Verified mismatches include `FieldIndex: 11` with `FieldName: "Text6"`, plus additional mismatched typed storage names in the same generated list.
- Proof: `product-rule-backed`, `validator-backed`; not runtime-fixed in this pass.

## Process Key Rules

`product-rule-backed`, `validator-backed`

Process keys, including `Data.Forms[].Key`, `FlowKey` when present, and decoded workflow `defkey`, must:

- contain only letters, numbers, and underscores: `[a-zA-Z0-9_]`;
- be at most 255 characters.

Generated-package validation treats invalid process keys as hard errors.

## Approval Form NoRule

`product-rule-backed`, `validator-backed`

Approval form `Forms[].NoRule` must be an object:

```json
{
  "Prefix": "test_{date}_{index}",
  "StartIndex": 1,
  "CustomLength": 8,
  "AutoIncrement": 1
}
```

`NoRule.Prefix` may use these dynamic placeholders:

- Date placeholders: `{date}`, `{yyyy}`, `{yy}`, `{mm}`, `{dd}`, `{yymmdd}`, `{mmdd}`.
- Sequence placeholder: `{index}`.

Strict rule: `NoRule.Prefix` must include `{index}` anywhere in the prefix string.

Known failure verified read-only:

- Package: `/Users/Renger/Downloads/form-report-runtime-baseline.v1.yap`.
- Form: `Form Report Source Approval`.
- Verified shape: `Forms[0].NoRule` is boolean `true`.
- Required shape: object with `Prefix`, `StartIndex`, `CustomLength`, and `AutoIncrement`; `Prefix` includes `{index}`.
- Proof: `product-rule-backed`, `validator-backed`; runtime import remains blocked and not fixed by runtime proof in this pass.

## Validator Behavior

`validator-backed`

Hard errors in generated final validation:

- duplicate `DisplayName`, `FieldName`, or `InternalName` within the same list;
- `DisplayName`, `FieldName`, or `InternalName` longer than 255 characters;
- invalid `InternalName` characters;
- generated non-system field with missing or mismatched `FieldName` numeric suffix;
- invalid process key characters;
- process key longer than 255 characters;
- approval form `NoRule` missing or not an object;
- missing `{index}` in `NoRule.Prefix`;
- invalid `NoRule.StartIndex`, `NoRule.CustomLength`, or `NoRule.AutoIncrement`.

Warnings:

- unknown list field `Type`;
- unknown optional `NoRule` fields;
- compatibility-mode cases where legacy exports may need review rather than blocking.

Updated validation surfaces:

- `validate-yap-package.js`
- `validate-ydl-list.js`
- `validate-ywf-def.js`
- `scripts/inspect-app-creation-rules.mjs`

## Generator Guidance

`product-rule-backed`, `validator-backed`

All future generators that create Yeeflow app/list/workflow packages must:

- allocate `FieldIndex` and `FieldName` together;
- ensure the final numeric suffix in `FieldName` equals `FieldIndex`;
- never reuse `DisplayName`, `FieldName`, or `InternalName` inside a list;
- generate `InternalName` values using only `[a-zA-Z0-9_]`;
- emit process keys using only `[a-zA-Z0-9_]`;
- emit approval form `NoRule` as the required object;
- include `{index}` in every generated `NoRule.Prefix`;
- stop before import when these checks fail.

Patched generator sources in this pass:

- `tools/generators/generate-workflow-actions-combined-runtime-baseline.mjs`
- `tools/generators/generate-workflow-actions-batch-runtime-baseline.mjs`

The Form Report runtime baseline generator is not present on current `main`; the previous generated package issue is covered by validator/inspector checks and documented as pending product-feedback/runtime follow-up.

Ignored local fixed package checks:

- `workflow-actions-runtime-baseline-field-rules-fixed.v1.yap` was regenerated from the combined workflow-actions generator. App creation rule inspector passed with zero findings; package validation and graph validation passed with warnings only. This is local-generation-fixed, not runtime-import-proven.
- `form-report-runtime-baseline-norule-fixed.v1.yap` was produced as an ignored local repair of the blocked Form Report package's `Forms[0].NoRule`. App creation rule inspector passed with warnings only for unsupported `metadata` field `Type` values. Full package validation still fails on pre-existing Form Report field-source resolution errors, so only the NoRule shape is locally fixed; the Form Report runtime baseline remains not runtime-import-proven.

## Proof Boundary

This pass is `product-rule-backed` and `validator-backed`.

It is not runtime-import-proven. A future focused runtime pass should regenerate fixed packages, import them, and only then upgrade proof to import/open/designer/runtime behavior.

## Follow-Up Field Type Expansion From Data Lists (2).yap

`Data Lists (2).yap` export-proves a single metadata data-list custom field with `Type = "metadata"`, `FieldType = "Bigint"`, and Rules containing `source` plus `categoryId`. This is an export-proven addition/exception to the earlier product-team supported type list, which named `mutiple-metadata` but did not name single `metadata`. Validators should accept `metadata` as a known field type while preserving the v0.5.12 generation-blocking gates for FieldIndex/FieldName synchronization, unique identifiers, valid InternalName, valid process keys, and valid NoRule.
