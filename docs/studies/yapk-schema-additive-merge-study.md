# YAPK Schema Additive Merge Study

Date: 2026-06-05

Official baseline:
- Plugin: Yeeflow App Builder
- Baseline version: 0.6.9
- Baseline tag: `yeeflow-app-builder-plugin-v0.6.9`
- Baseline commit: `9b8d48520f1af5fab73a9933fee7fa8c2241c135`

Uploaded schema source:
- `/Users/Renger/Downloads/Yapk-Schema/yapk-schema.json`

Canonical schema targets:
- `schemas/yapk-schema.json`
- `dist/yeeflow-app-builder-plugin/schemas/yapk-schema.json`

## Comparison Method

The uploaded schema and official canonical schema were parsed as JSON and compared structurally by JSON pointer. The merge was additive and selective:

- Paths present only in the uploaded schema were candidates for addition.
- Paths present in both schemas with different values were reviewed manually.
- Paths present only in the current official schema were preserved.
- Product/runtime hard gates from v0.6.9 were not weakened.

No blind replacement was performed.

## Merge Table

| Schema path | Current behavior | Uploaded behavior | Merge action |
|---|---|---|---|
| `/$defs/ListGroupInfo/required` | No explicit required list. | Requires `ID`, `Code`, `Name`. | `add_new`: added required list. |
| `/$defs/MetadataCategoryInfo/required` | No explicit required list. | Requires `CategoryID`, `Name`, `Code`, `Status`. | `add_new`: added required list. |
| `/$defs/MetadataInfo/required` | No explicit required list. | Requires `ID`, `ParentID`, `Name`, `Code`, `Status`. | `add_new`: added required list. |
| `/$defs/AppPackageInfo/required` | Requires `FormNewReports`; does not require legacy `FormReports`. | Requires both `FormReports` and `FormNewReports`, but does not define `FormReports` as a property. | `conflict_manual_review`: preserved current product rule. |
| `/$defs/AppPackageInfo/properties/FormReports` | Optional legacy workflow report collection is defined. | Missing from uploaded schema. | `preserve_current`: retained optional legacy property. |
| `/x-yeeflow-standard-additions` | Present with schema v5 hardening guidance and additional definitions. | Missing from uploaded schema. | `preserve_current`: retained full v5 standard-additions block. |

## Major Additions

- `ListGroupInfo.required`
- `MetadataCategoryInfo.required`
- `MetadataInfo.required`

These uploaded constraints are structural schema improvements and do not conflict with the generated-final validation rules.

## Changed Definitions

The only uploaded changed definition was `AppPackageInfo.required`, where the uploaded schema reintroduced `FormReports` as required. That change was not applied because it conflicts with the current product rule.

## Current-Only Content Preserved

- Optional legacy `AppPackageInfo.properties.FormReports`.
- `x-yeeflow-standard-additions`.
- Approval `DefResource` guidance.
- `FormNewReports` current workflow report guidance.
- AppID 30/41 conditional constraints.
- TableCode/IndexCode match rule.
- FieldName suffix equals FieldIndex rule.
- Workflow task page URL guidance.
- Generated-final validator rules that remain stricter than the JSON schema where needed.

## Conflict Resolution

`FormReports` remains optional legacy storage. `FormNewReports` remains the required/current workflow report collection. Generated workflow reports must use `FormNewReports`; generated-final validation must continue to fail packages that only place workflow reports in legacy `FormReports`.

## Validator Impact

The uploaded schema additions are enforceable directly by JSON schema for group and metadata objects. During the merge review, the generated-final validator was also tightened to enforce the canonical AppID 30/41 TableCode/IndexCode matrix:

- AppID `30` requires `TableCode = "setting_c"` and `IndexCode = "setting_c"`.
- AppID `41` requires `TableCode = "flowcraft"` and `IndexCode = "flowcraft"`.
- `TableCode` and `IndexCode` must match.

Existing FormNewReports, workflow task URL, choice-option, data-list, dashboard, workspace layout, and lossless-ID hard gates were preserved.

## Regression Coverage

Added `scripts/test-yapk-schema-additive-merge.mjs` and dist mirror coverage for:

- source and dist YAPK schemas parse and match;
- uploaded required-list additions are present;
- `FormNewReports` is required;
- `FormReports` is not required and remains optional legacy;
- v5 standard additions are preserved;
- AppID 30/41 conditional constraints are preserved;
- AppID 30/41 generated-final storage-code enforcement is covered;
- packages with missing group/metadata required fields fail schema validation.
