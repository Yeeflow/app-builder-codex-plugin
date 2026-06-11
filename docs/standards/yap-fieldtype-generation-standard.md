# YAP FieldType Generation Standard

Official version: 0.6.17

## Canonical Rule

Generated YAP data-list fields must treat `schemas/yap-schema.json` as a hard generation rule. `FieldType` is the storage category and must be one of:

- `Text`
- `Bit`
- `Decimal`
- `Datetime`

The generator must fail before returning a package if any generated data-list field emits unsupported `FieldType` values such as `Int`, `Date`, legacy `DateTime`, `Boolean`, `Number`, `Bool`, helper names, or any other non-schema value.

## FieldType Versus Type

`FieldType` is the canonical storage category from the YAP schema. `Type` is the Yeeflow UI/control type.

Helper names such as `cNumber("Int1", ...)` may help choose field names, but they must never leak into `FieldType`.

## FieldName And FieldIndex

The product-team YAP schema now requires storage-code custom field names. Generated custom fields must use:

`FieldName = FieldType + FieldIndex`

Examples:

- `Text1`
- `Decimal1`
- `Bit1`
- `Datetime1`

Business labels belong in `DisplayName`, not `FieldName`. A budget field should use a storage name such as `Decimal1` with `DisplayName = "Budget"`, not `FieldName = "Budget"`.

Custom fields must set `IsSystem = false` and use `FieldIndex >= 1`. The native system title field must be `FieldName = "Title"`, `IsSystem = true`, and `FieldIndex = 0`.

Field indexes must stay within the product schema range for the storage family:

- `Text`: 1-300
- `Bit`: 1-50
- `Decimal`: 1-200
- `Datetime`: 1-200

## Safe Mappings

Use these mappings for generated YAP data-list fields:

| Field kind | FieldType | Type examples |
|---|---|---|
| Numeric, currency, percent | `Decimal` | `input_number`, `currency`, `percent` |
| Boolean/switch | `Bit` | `switch` |
| Date or date-time | `Datetime` | `datepicker` |
| Text-backed controls | `Text` | `input`, `textarea`, `richtext`, `radio`, `select`, `checkbox`, `tag`, `lookup`, `identity-picker`, `file-upload` |

`Datetime` is the canonical storage `FieldType`. `DateTime` is legacy/invalid for generated packages under the current product schema. Date picker and time UI controls still belong in `Type`; they do not change the storage enum spelling.

Generated readiness requires both schema validation against `schemas/yap-schema.json` and generated-final package validation. A schema or FieldType failure is a hard error, not a warning.
