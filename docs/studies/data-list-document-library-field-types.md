# Data List and Document Library Field Types Learning

Source export: `/Users/Renger/Downloads/Data Lists (2).yap`

Proof boundary: Data List field schemas in this document are export-proven from the two target Type `1` data lists. Document Library applicability is product/user-understanding-backed only in this pass because this export contains no Type `16` document library. Local validation and inspector checks are validator-backed. Import, data entry, Excel export, workflow behavior, and field-creation behavior are not runtime-proven in this pass.

## Inventory Summary

- Target lists: `Data list with fields part A`, `Data list with fields part B`.
- Fields inspected: 92 total, 90 custom, 2 system.
- Export-proven field types found: `autonumber`, `calculated-column`, `checkbox`, `cost-center-picker`, `currency`, `datepicker`, `file-upload`, `hyperlink`, `icon-upload`, `identity-picker`, `input`, `input_number`, `list`, `location-picker`, `lookup`, `metadata`, `mutiple-metadata`, `organization-picker`, `percent`, `radio`, `rate`, `richtext`, `signer`, `switch`, `tag`, `textarea`, `time`.
- Expected but not found in the two target lists: `select`, `flowstatus`. Treat these as product-rule-backed/planning only until a focused export proves their exact settings.
- Export-proven primitive FieldType values: `Bigint`, `Bit`, `Datetime`, `Decimal`, `Text`.
- App Creation Rules check: all target fields satisfy FieldIndex/FieldName suffix synchronization, unique DisplayName/FieldName/InternalName, valid InternalName pattern, and identifier length constraints.

## Field Type Matrix

| Field type | Count | Primitive FieldType | Settings keys found | Required examples | Generation use case | Proof |
|---|---:|---|---|---:|---|---|
| `input` | 3 | `Text` | `allowScan`, `encrypt`, `input-maxlength`, `placeholder`, `required` | 2 | short labels, codes, references, names, searchable text | export-proven |
| `textarea` | 2 | `Text` | `placeholder`, `required` | 1 | notes, comments, plain long descriptions | export-proven |
| `richtext` | 4 | `Text` | `required`, `richtext-choose-toolbar`, `richtext-type` | 1 | formatted instructions, agendas, rich descriptions | export-proven |
| `hyperlink` | 2 | `Text` | `hyperlink_buttonname`, `hyperlink_open`, `required` | 1 | external references and clickable links | export-proven |
| `input_number` | 7 | `Decimal` | `displayThousandths`, `number_max`, `number_min`, `number_step`, `placeholder`, `required`, `rounded-to` | 1 | quantities, scores, measurements | export-proven |
| `currency` | 7 | `Decimal` | `currencyCode`, `displayFormat`, `displayThousandths`, `number_max`, `number_min`, `placeholder`, `required`, `rounded-to` | 1 | money amounts with currency display | export-proven |
| `percent` | 2 | `Decimal` | `number_max`, `number_min`, `placeholder`, `required`, `rounded-to` | 1 | rates, ratios, completion percentages | export-proven |
| `calculated-column` | 6 | `Bit`, `Datetime`, `Decimal`, `Text` | `calculated`, `calculated_result` | 0 | derived values from other fields | export-proven |
| `rate` | 4 | `Decimal` | `icon`, `rate-allowHalf`, `rate-count`, `rate-type`, `required` | 1 | user ratings or quality scores | export-proven |
| `switch` | 2 | `Bit` | `categoryId`, `displayStyle`, `source` | 0 | yes/no flags | export-proven |
| `checkbox` | 2 | `Text` | `choices`, `color_choices`, `displayStyle`, `placeholder`, `required` | 0 | multi-select fixed choices | export-proven |
| `radio` | 4 | `Text` | `choices`, `color_choices`, `displayStyle`, `placeholder`, `required`, `show_color` | 2 | single-select fixed choices | export-proven |
| `select` | 0 | not found | unproven | 0 | single-select dropdown when export-proven | unproven in this export |
| `tag` | 1 | `Text` | `category`, `customTags`, `multiple`, `required`, `source` | 1 | managed tag classification | export-proven |
| `datepicker` | 8 | `Datetime` | `date_picker`, `date_type`, `dateformat`, `disable_now_button`, `minuteStep`, `placeholder`, `required`, `showtime` | 1 | dates or date-time values | export-proven |
| `time` | 3 | `Datetime` | `dateformat`, `minuteStep`, `placeholder`, `required` | 1 | time-of-day values | export-proven |
| `identity-picker` | 4 | `Text` | `identity-maxselection`, `multiple`, `required` | 3 | users/requesters/owners | export-proven |
| `organization-picker` | 5 | `Text` | `identity-maxselection`, `metadata-treeselect`, `multiple`, `parentId`, `required` | 1 | departments or org units | export-proven |
| `cost-center-picker` | 1 | `Text` | `identity-maxselection`, `multiple`, `required` | 1 | cost center ownership/accounting | export-proven |
| `signer` | 1 | `Text` | `placeholder`, `required` | 1 | signature capture | export-proven |
| `file-upload` | 3 | `Text` | `file_multiple`, `file_types`, `file_typeslimit`, `maxsize`, `required`, `ver` | 2 | attachments and documents | export-proven |
| `icon-upload` | 3 | `Text` | `controlmultiple`, `picture_size_limit`, `required` | 1 | images or icons | export-proven |
| `lookup` | 6 | `Text` | `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `multiple`, `placeholder`, `required`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | 2 | reference to another list record | export-proven |
| `metadata` | 3 | `Bigint` | `categoryId`, `metadata-treeselect`, `parentId`, `placeholder`, `required`, `source` | 2 | single metadata taxonomy value | export-proven |
| `mutiple-metadata` | 2 | `Text` | `categoryId`, `max-selection`, `metadata-treeselect`, `placeholder`, `required`, `source` | 2 | multiple metadata taxonomy values | export-proven |
| `location-picker` | 3 | `Text` | `identity-maxselection`, `parentId`, `placeholder`, `required` | 2 | location taxonomy values | export-proven |
| `flowstatus` | 0 | not found | unproven | 0 | workflow/list status where system-proven | unproven in this export |
| `autonumber` | 1 | `Text` | `minDigits`, `prefix`, `startNum`, `suffix` | 0 | generated record numbers | export-proven |
| `list` | 1 | `Text` | `list-variables`, `required` | 1 | nested line items/sub-list details | export-proven |

## Field Families

### Text & Input

- `input`: export-proven with `Text` primitive storage and settings `allowScan`, `encrypt`, `input-maxlength`, `placeholder`, `required`. Use for short labels, codes, references, names, searchable text.
- `textarea`: export-proven with `Text` primitive storage and settings `placeholder`, `required`. Use for notes, comments, plain long descriptions.
- `richtext`: export-proven with `Text` primitive storage and settings `required`, `richtext-choose-toolbar`, `richtext-type`. Use for formatted instructions, agendas, rich descriptions.
- `hyperlink`: export-proven with `Text` primitive storage and settings `hyperlink_buttonname`, `hyperlink_open`, `required`. Use for external references and clickable links.

### Numeric & Financial

- `input_number`: export-proven with `Decimal` primitive storage and settings `displayThousandths`, `number_max`, `number_min`, `number_step`, `placeholder`, `required`, `rounded-to`. Use for quantities, scores, measurements.
- `currency`: export-proven with `Decimal` primitive storage and settings `currencyCode`, `displayFormat`, `displayThousandths`, `number_max`, `number_min`, `placeholder`, `required`, `rounded-to`. Use for money amounts with currency display.
- `percent`: export-proven with `Decimal` primitive storage and settings `number_max`, `number_min`, `placeholder`, `required`, `rounded-to`. Use for rates, ratios, completion percentages.
- `calculated-column`: export-proven with `Bit`, `Datetime`, `Decimal`, `Text` primitive storage and settings `calculated`, `calculated_result`. Use for derived values from other fields.
- `rate`: export-proven with `Decimal` primitive storage and settings `icon`, `rate-allowHalf`, `rate-count`, `rate-type`, `required`. Use for user ratings or quality scores.

### Selection & Choice

- `switch`: export-proven with `Bit` primitive storage and settings `categoryId`, `displayStyle`, `source`. Use for yes/no flags.
- `checkbox`: export-proven with `Text` primitive storage and settings `choices`, `color_choices`, `displayStyle`, `placeholder`, `required`. Use for multi-select fixed choices.
- `radio`: export-proven with `Text` primitive storage and settings `choices`, `color_choices`, `displayStyle`, `placeholder`, `required`, `show_color`. Use for single-select fixed choices.
- `select`: not found; keep product/user-understanding-backed only. Use for single-select dropdown when export-proven.
- `tag`: export-proven with `Text` primitive storage and settings `category`, `customTags`, `multiple`, `required`, `source`. Use for managed tag classification.

### Date & Time

- `datepicker`: export-proven with `Datetime` primitive storage and settings `date_picker`, `date_type`, `dateformat`, `disable_now_button`, `minuteStep`, `placeholder`, `required`, `showtime`. Use for dates or date-time values.
- `time`: export-proven with `Datetime` primitive storage and settings `dateformat`, `minuteStep`, `placeholder`, `required`. Use for time-of-day values.

### Identity & Organization

- `identity-picker`: export-proven with `Text` primitive storage and settings `identity-maxselection`, `multiple`, `required`. Use for users/requesters/owners.
- `organization-picker`: export-proven with `Text` primitive storage and settings `identity-maxselection`, `metadata-treeselect`, `multiple`, `parentId`, `required`. Use for departments or org units.
- `cost-center-picker`: export-proven with `Text` primitive storage and settings `identity-maxselection`, `multiple`, `required`. Use for cost center ownership/accounting.
- `signer`: export-proven with `Text` primitive storage and settings `placeholder`, `required`. Use for signature capture.

### Uploads & Media

- `file-upload`: export-proven with `Text` primitive storage and settings `file_multiple`, `file_types`, `file_typeslimit`, `maxsize`, `required`, `ver`. Use for attachments and documents.
- `icon-upload`: export-proven with `Text` primitive storage and settings `controlmultiple`, `picture_size_limit`, `required`. Use for images or icons.

### Advanced & System

- `lookup`: export-proven with `Text` primitive storage and settings `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `multiple`, `placeholder`, `required`, `search-fields`, `search-scope`, `sort-first`, `sort-second`. Use for reference to another list record.
- `metadata`: export-proven with `Bigint` primitive storage and settings `categoryId`, `metadata-treeselect`, `parentId`, `placeholder`, `required`, `source`. Use for single metadata taxonomy value.
- `mutiple-metadata`: export-proven with `Text` primitive storage and settings `categoryId`, `max-selection`, `metadata-treeselect`, `placeholder`, `required`, `source`. Use for multiple metadata taxonomy values.
- `location-picker`: export-proven with `Text` primitive storage and settings `identity-maxselection`, `parentId`, `placeholder`, `required`. Use for location taxonomy values.
- `flowstatus`: not found; keep product/user-understanding-backed only. Use for workflow/list status where system-proven.
- `autonumber`: export-proven with `Text` primitive storage and settings `minDigits`, `prefix`, `startNum`, `suffix`. Use for generated record numbers.
- `list`: export-proven with `Text` primitive storage and settings `list-variables`, `required`. Use for nested line items/sub-list details.

## Field Inventory

| Source list | Field placeholder | Type | FieldType | FieldIndex | FieldName | InternalName | Required | Unique | Settings summary | Proof |
|---|---|---|---|---:|---|---|---|---|---|---|
| Data list with fields part A | __DISPLAY_NAME_1__ | `input` | `Text` | 1 | `Title` | __INTERNAL_NAME_1__ | no | no | - | export-proven |
| Data list with fields part A | __DISPLAY_NAME_2__ | `input` | `Text` | 1 | `Text1` | __INTERNAL_NAME_2__ | yes | no | `input-maxlength`, `placeholder`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_3__ | `input` | `Text` | 2 | `Text2` | __INTERNAL_NAME_3__ | yes | yes | `allowScan`, `placeholder`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_4__ | `input` | `Text` | 3 | `Text3` | __INTERNAL_NAME_4__ | no | no | `encrypt`, `placeholder` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_5__ | `textarea` | `Text` | 4 | `Text4` | __INTERNAL_NAME_5__ | no | no | `placeholder` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_6__ | `textarea` | `Text` | 5 | `Text5` | __INTERNAL_NAME_6__ | yes | no | `placeholder`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_7__ | `richtext` | `Text` | 6 | `Text6` | __INTERNAL_NAME_7__ | no | no | - | export-proven |
| Data list with fields part A | __DISPLAY_NAME_8__ | `richtext` | `Text` | 7 | `Text7` | __INTERNAL_NAME_8__ | no | no | `richtext-type` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_9__ | `richtext` | `Text` | 8 | `Text8` | __INTERNAL_NAME_9__ | no | no | `richtext-type` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_10__ | `richtext` | `Text` | 9 | `Text9` | __INTERNAL_NAME_10__ | yes | no | `required`, `richtext-choose-toolbar`, `richtext-type` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_11__ | `input_number` | `Decimal` | 1 | `Decimal1` | __INTERNAL_NAME_11__ | no | no | `placeholder` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_12__ | `input_number` | `Decimal` | 2 | `Decimal2` | __INTERNAL_NAME_12__ | no | yes | - | export-proven |
| Data list with fields part A | __DISPLAY_NAME_13__ | `input_number` | `Decimal` | 3 | `Decimal3` | __INTERNAL_NAME_13__ | no | no | `displayThousandths` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_14__ | `input_number` | `Decimal` | 4 | `Decimal4` | __INTERNAL_NAME_14__ | no | no | `displayThousandths` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_15__ | `input_number` | `Decimal` | 5 | `Decimal5` | __INTERNAL_NAME_15__ | no | no | `displayThousandths` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_16__ | `input_number` | `Decimal` | 6 | `Decimal6` | __INTERNAL_NAME_16__ | yes | no | `required`, `rounded-to` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_17__ | `input_number` | `Decimal` | 7 | `Decimal7` | __INTERNAL_NAME_17__ | no | no | `number_max`, `number_min`, `number_step` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_18__ | `percent` | `Decimal` | 8 | `Decimal8` | __INTERNAL_NAME_18__ | yes | no | `number_max`, `number_min`, `placeholder`, `required`, `rounded-to` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_19__ | `percent` | `Decimal` | 9 | `Decimal9` | __INTERNAL_NAME_19__ | no | no | - | export-proven |
| Data list with fields part A | __DISPLAY_NAME_20__ | `currency` | `Decimal` | 10 | `Decimal10` | __INTERNAL_NAME_20__ | no | no | `currencyCode`, `displayFormat`, `placeholder` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_21__ | `currency` | `Decimal` | 11 | `Decimal11` | __INTERNAL_NAME_21__ | no | no | `currencyCode`, `displayFormat` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_22__ | `currency` | `Decimal` | 12 | `Decimal12` | __INTERNAL_NAME_22__ | no | no | `currencyCode`, `displayFormat` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_23__ | `currency` | `Decimal` | 13 | `Decimal13` | __INTERNAL_NAME_23__ | no | no | `currencyCode`, `displayFormat`, `displayThousandths` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_24__ | `currency` | `Decimal` | 14 | `Decimal14` | __INTERNAL_NAME_24__ | no | no | `currencyCode`, `displayFormat`, `displayThousandths` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_25__ | `currency` | `Decimal` | 15 | `Decimal15` | __INTERNAL_NAME_25__ | no | no | `currencyCode`, `displayFormat`, `displayThousandths`, `rounded-to` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_26__ | `currency` | `Decimal` | 16 | `Decimal16` | __INTERNAL_NAME_26__ | yes | no | `currencyCode`, `displayFormat`, `number_max`, `number_min`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_27__ | `switch` | `Bit` | 1 | `Bit1` | __INTERNAL_NAME_27__ | no | no | `categoryId`, `source` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_28__ | `switch` | `Bit` | 2 | `Bit2` | __INTERNAL_NAME_28__ | no | no | `displayStyle` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_29__ | `radio` | `Text` | 10 | `Text10` | __INTERNAL_NAME_29__ | no | no | `choices`, `color_choices` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_30__ | `radio` | `Text` | 11 | `Text11` | __INTERNAL_NAME_30__ | yes | no | `choices`, `color_choices`, `required`, `show_color` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_31__ | `radio` | `Text` | 12 | `Text12` | __INTERNAL_NAME_31__ | no | no | `choices`, `color_choices` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_32__ | `radio` | `Text` | 13 | `Text13` | __INTERNAL_NAME_32__ | yes | no | `choices`, `color_choices`, `displayStyle`, `placeholder`, `required`, `show_color` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_33__ | `checkbox` | `Text` | 14 | `Text14` | __INTERNAL_NAME_33__ | no | no | `choices`, `color_choices`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_34__ | `checkbox` | `Text` | 15 | `Text15` | __INTERNAL_NAME_34__ | no | no | `choices`, `color_choices`, `displayStyle`, `placeholder` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_35__ | `datepicker` | `Datetime` | 1 | `Datetime1` | __INTERNAL_NAME_35__ | no | no | `placeholder` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_36__ | `datepicker` | `Datetime` | 2 | `Datetime2` | __INTERNAL_NAME_36__ | no | no | `date_picker` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_37__ | `datepicker` | `Datetime` | 3 | `Datetime3` | __INTERNAL_NAME_37__ | no | no | `date_picker` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_38__ | `datepicker` | `Datetime` | 4 | `Datetime4` | __INTERNAL_NAME_38__ | no | no | `showtime` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_39__ | `datepicker` | `Datetime` | 5 | `Datetime5` | __INTERNAL_NAME_39__ | no | no | `dateformat`, `minuteStep`, `showtime` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_40__ | `datepicker` | `Datetime` | 6 | `Datetime6` | __INTERNAL_NAME_40__ | no | no | `dateformat`, `minuteStep`, `showtime` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_41__ | `datepicker` | `Datetime` | 7 | `Datetime7` | __INTERNAL_NAME_41__ | yes | no | `date_type`, `disable_now_button`, `required`, `showtime` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_42__ | `datepicker` | `Datetime` | 8 | `Datetime8` | __INTERNAL_NAME_42__ | no | no | `date_type`, `showtime` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_43__ | `time` | `Datetime` | 9 | `Datetime9` | __INTERNAL_NAME_43__ | yes | no | `placeholder`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_44__ | `time` | `Datetime` | 10 | `Datetime10` | __INTERNAL_NAME_44__ | no | no | `dateformat`, `minuteStep` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_45__ | `time` | `Datetime` | 11 | `Datetime11` | __INTERNAL_NAME_45__ | no | no | `dateformat` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_46__ | `identity-picker` | `Text` | 16 | `Text16` | __INTERNAL_NAME_46__ | no | no | `identity-maxselection` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_47__ | `identity-picker` | `Text` | 17 | `Text17` | __INTERNAL_NAME_47__ | yes | no | `identity-maxselection`, `multiple`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_48__ | `identity-picker` | `Text` | 18 | `Text18` | __INTERNAL_NAME_48__ | yes | no | `identity-maxselection`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_49__ | `identity-picker` | `Text` | 19 | `Text19` | __INTERNAL_NAME_49__ | yes | no | `identity-maxselection`, `multiple`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_50__ | `organization-picker` | `Text` | 20 | `Text20` | __INTERNAL_NAME_50__ | no | no | `identity-maxselection` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_51__ | `organization-picker` | `Text` | 21 | `Text21` | __INTERNAL_NAME_51__ | yes | no | `identity-maxselection`, `metadata-treeselect`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_52__ | `organization-picker` | `Text` | 22 | `Text22` | __INTERNAL_NAME_52__ | no | no | `identity-maxselection`, `metadata-treeselect` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_53__ | `organization-picker` | `Text` | 23 | `Text23` | __INTERNAL_NAME_53__ | no | no | `identity-maxselection`, `metadata-treeselect` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_54__ | `organization-picker` | `Text` | 24 | `Text24` | __INTERNAL_NAME_54__ | no | no | `identity-maxselection`, `metadata-treeselect`, `multiple`, `parentId` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_55__ | `location-picker` | `Text` | 25 | `Text25` | __INTERNAL_NAME_55__ | yes | no | `identity-maxselection`, `parentId`, `placeholder`, `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_56__ | `location-picker` | `Text` | 26 | `Text26` | __INTERNAL_NAME_56__ | no | no | - | export-proven |
| Data list with fields part A | __DISPLAY_NAME_57__ | `location-picker` | `Text` | 27 | `Text27` | __INTERNAL_NAME_57__ | yes | no | `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_58__ | `file-upload` | `Text` | 28 | `Text28` | __INTERNAL_NAME_58__ | no | no | `ver` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_59__ | `file-upload` | `Text` | 29 | `Text29` | __INTERNAL_NAME_59__ | yes | no | `file_multiple`, `maxsize`, `required`, `ver` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_60__ | `file-upload` | `Text` | 30 | `Text30` | __INTERNAL_NAME_60__ | yes | no | `file_multiple`, `file_types`, `file_typeslimit`, `required`, `ver` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_61__ | `icon-upload` | `Text` | 31 | `Text31` | __INTERNAL_NAME_61__ | no | no | - | export-proven |
| Data list with fields part A | __DISPLAY_NAME_62__ | `icon-upload` | `Text` | 32 | `Text32` | __INTERNAL_NAME_62__ | yes | no | `required` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_63__ | `icon-upload` | `Text` | 33 | `Text33` | __INTERNAL_NAME_63__ | no | no | `controlmultiple`, `picture_size_limit` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_64__ | `lookup` | `Text` | 34 | `Text34` | __INTERNAL_NAME_64__ | yes | no | `addition`, `appid`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `placeholder`, `required`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_65__ | `lookup` | `Text` | 35 | `Text35` | __INTERNAL_NAME_65__ | no | no | `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_66__ | `lookup` | `Text` | 36 | `Text36` | __INTERNAL_NAME_66__ | yes | no | `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `multiple`, `required`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_67__ | `lookup` | `Text` | 37 | `Text37` | __INTERNAL_NAME_67__ | no | no | `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `placeholder`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_68__ | `lookup` | `Text` | 38 | `Text38` | __INTERNAL_NAME_68__ | no | no | `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `multiple`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_69__ | `lookup` | `Text` | 39 | `Text39` | __INTERNAL_NAME_69__ | no | no | `addition`, `appid`, `displayStyle`, `list_tooltip_field`, `listfield`, `listfilter`, `listid`, `listsetid`, `max-selection`, `placeholder`, `search-fields`, `search-scope`, `sort-first`, `sort-second` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_70__ | `calculated-column` | `Decimal` | 17 | `Decimal17` | __INTERNAL_NAME_70__ | no | no | `calculated`, `calculated_result` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_71__ | `calculated-column` | `Text` | 40 | `Text40` | __INTERNAL_NAME_71__ | no | no | `calculated`, `calculated_result` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_72__ | `calculated-column` | `Text` | 41 | `Text41` | __INTERNAL_NAME_72__ | no | no | `calculated`, `calculated_result` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_73__ | `calculated-column` | `Decimal` | 18 | `Decimal18` | __INTERNAL_NAME_73__ | no | no | `calculated`, `calculated_result` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_74__ | `calculated-column` | `Datetime` | 12 | `Datetime12` | __INTERNAL_NAME_74__ | no | no | `calculated`, `calculated_result` | export-proven |
| Data list with fields part A | __DISPLAY_NAME_75__ | `calculated-column` | `Bit` | 3 | `Bit3` | __INTERNAL_NAME_75__ | no | no | `calculated`, `calculated_result` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_1__ | `input` | `Text` | 1 | `Title` | __INTERNAL_NAME_1__ | no | no | - | export-proven |
| Data list with fields part B | __DISPLAY_NAME_2__ | `metadata` | `Bigint` | 1 | `Bigint1` | __INTERNAL_NAME_2__ | no | no | `categoryId`, `source` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_3__ | `metadata` | `Bigint` | 2 | `Bigint2` | __INTERNAL_NAME_3__ | yes | no | `categoryId`, `metadata-treeselect`, `parentId`, `placeholder`, `required`, `source` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_4__ | `metadata` | `Bigint` | 3 | `Bigint3` | __INTERNAL_NAME_4__ | yes | no | `categoryId`, `metadata-treeselect`, `required`, `source` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_5__ | `mutiple-metadata` | `Text` | 1 | `Text1` | __INTERNAL_NAME_5__ | yes | no | `categoryId`, `max-selection`, `metadata-treeselect`, `placeholder`, `required`, `source` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_6__ | `mutiple-metadata` | `Text` | 2 | `Text2` | __INTERNAL_NAME_6__ | yes | no | `categoryId`, `metadata-treeselect`, `placeholder`, `required`, `source` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_7__ | `cost-center-picker` | `Text` | 3 | `Text3` | __INTERNAL_NAME_7__ | yes | no | `identity-maxselection`, `multiple`, `required` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_8__ | `rate` | `Decimal` | 1 | `Decimal1` | __INTERNAL_NAME_8__ | no | no | - | export-proven |
| Data list with fields part B | __DISPLAY_NAME_9__ | `rate` | `Decimal` | 2 | `Decimal2` | __INTERNAL_NAME_9__ | no | no | `rate-type` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_10__ | `rate` | `Decimal` | 3 | `Decimal3` | __INTERNAL_NAME_10__ | no | no | `rate-type` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_11__ | `rate` | `Decimal` | 4 | `Decimal4` | __INTERNAL_NAME_11__ | yes | no | `icon`, `rate-allowHalf`, `rate-count`, `rate-type`, `required` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_12__ | `hyperlink` | `Text` | 4 | `Text4` | __INTERNAL_NAME_12__ | no | no | `hyperlink_open` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_13__ | `hyperlink` | `Text` | 5 | `Text5` | __INTERNAL_NAME_13__ | yes | no | `hyperlink_buttonname`, `hyperlink_open`, `required` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_14__ | `signer` | `Text` | 6 | `Text6` | __INTERNAL_NAME_14__ | yes | no | `placeholder`, `required` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_15__ | `tag` | `Text` | 7 | `Text7` | __INTERNAL_NAME_15__ | yes | no | `category`, `customTags`, `multiple`, `required`, `source` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_16__ | `autonumber` | `Text` | 8 | `Text8` | __INTERNAL_NAME_16__ | no | no | `minDigits`, `prefix`, `startNum`, `suffix` | export-proven |
| Data list with fields part B | __DISPLAY_NAME_17__ | `list` | `Text` | 9 | `Text9` | __INTERNAL_NAME_17__ | yes | no | `list-variables`, `required` | export-proven |

## Export Paths

- Application shell: `Data.Item.ListModel` with child resources under `Data.Childs[]`.
- Target data-list resource: `Data.Childs[]` where `ListModel.Title` matches the target list and `ListModel.Type = 1`.
- Field definitions: `Data.Childs[].Defs[]`.
- Core field metadata: `FieldID`, `ListID`, `FieldName`, `FieldType`, `FieldIndex`, `DisplayName`, `InternalName`, `Type`, `Status`, `Category`, `DefaultValue`, `IsSystem`, `IsUnique`.
- Field settings: stringified JSON in `Defs[].Rules`.
- Sample data: `ListDatas`; not used as runtime proof and not normalized into docs.

## App Creation Rules Interaction

Generation must preserve v0.5.12 gates: FieldName numeric suffix at the end must equal FieldIndex for generated non-system fields, DisplayName/FieldName/InternalName are unique within the same list, InternalName matches `[A-Za-z0-9_]`, and identifier lengths stay <=255. This export also proves single metadata fields use `Type = metadata`, which should be accepted alongside the product-team type list.

## Field-Specific Generation Rules

- Text fields use `TextN` FieldName slots; settings may include `placeholder`, `required`, `input-maxlength`, `allowScan`, `encrypt`, `richtext-type`, and toolbar settings.
- Numeric fields use `DecimalN`; settings include `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `number_step`, `currencyCode`, and `displayFormat`.
- Switch fields use `BitN`; tick-box display uses `displayStyle`, while one export-proven switch also carries metadata-like `source` and `categoryId`.
- Choice fields store options in `Rules.choices`; color data is in `Rules.color_choices`; radio/select-like dropdown behavior uses `displayStyle`; `show_color` controls color display where present.
- Date/time fields use `DatetimeN`; datepicker settings include `showtime`, `dateformat`, `minuteStep`, `date_picker`, `date_type`, and `disable_now_button`. Time fields use `Type = time` with `dateformat` and `minuteStep`.
- Identity, organization, location, and cost center picker fields store as Text, with selection limits in `identity-maxselection`, multi-select in `multiple`, and hierarchy/root constraints through `parentId` or `metadata-treeselect`. Tenant-specific IDs must be redacted and not guessed.
- File and image fields store as Text with upload settings such as `ver`, `maxsize`, `file_multiple`, `file_typeslimit`, `file_types`, `picture_size_limit`, and `controlmultiple`. Runtime storage is not proven.
- Lookup fields require `appid`, `listsetid`, `listid`, and `listfield`; optional settings include tooltip, additions, sorting, filtering, search scope/fields, max selection, display style, placeholder, required, and multiple. Target list and display field should resolve before import.
- Calculated columns require `calculated_result` and `calculated`; result primitives in this export are Decimal, Text, Datetime, and Bit. Referenced fields must exist and use stable internal names/FieldNames.
- Metadata fields use `metadata` + Bigint for single value and `mutiple-metadata` + Text for multiple values; both require `source` and `categoryId`, with optional tree select, parent, placeholder, max selection, required, and default value.
- Tag fields use `Type = tag`, Text storage, `source`, `category`, `customTags`, `multiple`, and `required`.
- Auto number fields use Text storage and `minDigits`, `startNum`, `prefix`, and `suffix`. Do not assume equivalence to approval form `NoRule`; no relation is export-proven here.
- Sub-list fields use `Type = list`, Text storage, and `Rules.list-variables[]`. Nested variable types found: `text`, `number`, `boolean`, `date`, `file`, `metadata`, `user`, `costcenter`, `groupselect`, `location`, `lookup`, `img`, and `mutiple-metadata`. Nested fields do not use top-level FieldIndex/FieldName slots in this export.

## Document Library Applicability

Data List and Document Library custom fields are likely shared or highly similar, but this export has no Type `16` resource. Apply these settings to Document Library only as product/user-understanding-backed guidance until a focused document-library export proves exact `Defs[]` and `Rules` shapes for custom library fields. Keep document-library default fields and upload-file rules from existing Type `16` studies.

## Normalized References

Redacted normalized field refs were created under `docs/studies/normalized/data-list-fields/` for every field type found. Files are synthetic-normalized from export shapes; IDs, user/org/category/list values, labels, placeholders, and sample data are redacted.

## Validator Guidance

Hard errors: duplicate DisplayName/FieldName/InternalName, invalid InternalName, FieldIndex/FieldName suffix mismatch, malformed Rules JSON, missing options for generated choice fields, missing required lookup target metadata, and unresolved generated lookup targets where package-local resolution is required.

Warnings: unknown field types, sparse optional settings, metadata/tag source gaps, calculated-column dependency risks, sub-list nested-field gaps, upload/image runtime storage assumptions, tenant-specific picker IDs, Document Library applicability without Type `16` proof, and any field-specific settings not observed in this export.

