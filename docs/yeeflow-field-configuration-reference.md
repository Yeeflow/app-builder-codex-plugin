# Yeeflow Field Configuration Reference

Sources studied read-only:

- `/Users/Renger/Downloads/field-configurations.json`

The source contains 35 configuration entries covering 27 field/control types.

## Support Groups

| Group | Field/control types |
| --- | --- |
| provenSafe | currency, datepicker, input, input_number, lookup, radio, switch, textarea |
| schemaSupportedRuntimeUnproven | autonumber, checkbox, hyperlink, percent, rate, richtext, tag, time |
| environmentDependent | cost-center-picker, file-upload, icon-upload, identity-picker, location-picker, organization-picker, signer |
| riskyDeferred | calculated-column, list, metadata, mutiple-metadata |
| schemaSupportedUnclassified | - |

## Common Properties

Common data-list field properties include:

- `Type`: Yeeflow field control type.
- `DisplayName`: user-facing field name.
- `DefaultValue`: field default.
- `Rules.required`: required behavior.
- `Rules.placeholder`: input placeholder.
- `IsUnique`: uniqueness constraint.
- `Rules.choices`: choice options.
- `Rules.number_min`, `Rules.number_max`, `Rules.number_step`, `Rules.rounded-to`: numeric settings.
- `Rules.currencyCode`, `Rules.displayFormat`, `Rules.displayThousandths`: currency/number display.
- `Rules.dateformat`, `Rules.date_picker`, `Rules.showtime`, `Rules.minuteStep`: date/time settings.
- `Rules.listid`, `Rules.listsetid`, `Rules.listfield`: lookup metadata when present in generated fields.

## Field Inventory

| Field/control type | Support level | Key property paths |
| --- | --- | --- |
| autonumber | schema-supported-runtime-unproven | DisplayName, Rules.minDigits, Rules.prefix.value, Rules.startNum, Rules.suffix.value, Type |
| calculated-column | risky-deferred | Rules.calculated, Rules.calculated_result.attrs, Rules.calculated_result.type |
| checkbox | schema-supported-runtime-unproven | DefaultValue, DisplayName, Rules.choices, Rules.displayStyle, Rules.placeholder, Rules.required, Type |
| cost-center-picker | environment-dependent | DefaultValue, DisplayName, IsUnique, Rules.identity-maxselection, Rules.multiple, Rules.placeholder, Rules.required, Type |
| currency | proven-safe | DefaultValue, DisplayName, IsUnique, Rules.currencyCode, Rules.displayFormat, Rules.displayThousandths, Rules.number_max, Rules.number_min, Rules.placeholder, Rules.required, Rules.rounded-to, Type |
| datepicker | proven-safe | DefaultValue, DisplayName, IsUnique, Rules.date_picker, Rules.dateformat, Rules.disable_now_button, Rules.minuteStep, Rules.placeholder, Rules.required, Rules.showtime, Type |
| file-upload | environment-dependent | DefaultValue, DisplayName, Rules.file_maxcount, Rules.file_multiple, Rules.file_types.cusValue, Rules.file_types.value, Rules.file_typeslimit, Rules.maxsize, Rules.required, Type |
| hyperlink | schema-supported-runtime-unproven | DefaultValue, DisplayName, Rules.hyperlink_buttonname, Rules.hyperlink_open, Rules.required, Type |
| icon-upload | environment-dependent | DefaultValue, DisplayName, Rules.controlmultiple, Rules.maxselection, Rules.picture_size_limit, Rules.required, Type |
| identity-picker | environment-dependent | DefaultValue, DisplayName, IsUnique, Rules.identity-maxselection, Rules.multiple, Rules.placeholder, Rules.required, Type |
| input | proven-safe | DefaultValue, DisplayName, IsUnique, Rules.allowScan, Rules.encrypt, Rules.input-maxlength, Rules.placeholder, Rules.required, Type |
| input_number | proven-safe | DefaultValue, DisplayName, IsUnique, Rules.displayThousandths, Rules.number_max, Rules.number_min, Rules.number_step, Rules.placeholder, Rules.required, Rules.rounded-to, Type |
| list | risky-deferred | DisplayName, Rules.list-variables, Rules.required, Type |
| location-picker | environment-dependent | DefaultValue, DisplayName, IsUnique, Rules.placeholder, Rules.required, Type |
| lookup | proven-safe | DisplayName, IsUnique, Rules.addition, Rules.appid, Rules.displayStyle, Rules.list_tooltip_field, Rules.listfield, Rules.listfilter, Rules.listid, Rules.listsetid, Rules.max-selection, Rules.multiple, Rules.placeholder, Rules.required, Rules.search-fields, Rules.search-scope, Rules.sort-first.SortByDesc, Rules.sort-first.SortName |
| metadata | risky-deferred | DefaultValue, DisplayName, IsUnique, Rules.categoryId, Rules.metadata-treeselect, Rules.parentId, Rules.placeholder, Rules.required, Rules.source, Type |
| mutiple-metadata | risky-deferred | DefaultValue, DisplayName, Rules.categoryId, Rules.max-selection, Rules.metadata-treeselect, Rules.parentId, Rules.placeholder, Rules.required, Rules.source, Type |
| organization-picker | environment-dependent | DefaultValue, DisplayName, IsUnique, Rules.hierarchical-select, Rules.identity-maxselection, Rules.metadata-treeselect, Rules.multiple, Rules.parentId, Rules.placeholder, Rules.required, Type |
| percent | schema-supported-runtime-unproven | DefaultValue, DisplayName, IsUnique, Rules.number_max, Rules.number_min, Rules.placeholder, Rules.required, Rules.rounded-to, Type |
| radio | proven-safe | DefaultValue, DisplayName, IsUnique, Rules.choices, Rules.color_choices, Rules.displayStyle, Rules.placeholder, Rules.required, Rules.show_color, Type |
| rate | schema-supported-runtime-unproven | DefaultValue, DisplayName, Rules.icon, Rules.rate-allowHalf, Rules.rate-count, Rules.rate-type, Rules.required, Type |
| richtext | schema-supported-runtime-unproven | DisplayName, Rules.required, Rules.richtext-type, Type |
| signer | environment-dependent | DisplayName, Rules.required, Type |
| switch | proven-safe | DefaultValue, DisplayName, IsUnique, Rules.displayStyle, Type |
| tag | schema-supported-runtime-unproven | DisplayName, Rules.category, Rules.customTags, Rules.multiple, Rules.process-field-tag-maxcount, Rules.required, Rules.source, Type |
| textarea | proven-safe | DefaultValue, DisplayName, Rules.input-maxlength, Rules.placeholder, Rules.required, Type |
| time | schema-supported-runtime-unproven | DefaultValue, DisplayName, IsUnique, Rules.dateformat, Rules.minuteStep, Rules.placeholder, Rules.required, Type |

## Generator Guidance

- Preserve native `Title` metadata for generated lists.
- Use Text/input, Text/textarea, Decimal/input_number, Text/radio, Bit/switch, Datetime/datepicker, and local lookup as the safest generated field families.
- Keep file, icon, identity, organization, location, cost-center, signer, metadata, and calculated-column shapes warning-first until focused runtime proof exists.
- Keep lookup sample values blank unless local target sample IDs are proven and included in `ReplaceIds`.
