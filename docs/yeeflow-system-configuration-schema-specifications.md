# Yeeflow System Configuration And Schema Specifications

This reference records product schema rules that must be applied whenever Codex generates or changes Yeeflow data lists, processes, or app-resource tool permissions.

## List Field Rules

### Supported Field Types

The system supports the following field `Type` values:

| Category | Field Types | Description |
| --- | --- | --- |
| Text and input | `input`, `textarea`, `richtext`, `hyperlink` | Single-line, multi-line, rich text, and hyperlinks |
| Numeric and financial | `input_number`, `currency`, `percent`, `calculated-column`, `rate` | Numbers, currencies, percentages, formulas, and ratings |
| Selection and choice | `switch`, `checkbox`, `radio`, `select`, `tag` | Toggles, checkboxes, radio buttons, dropdowns, and tags |
| Date and time | `datepicker`, `time` | Date pickers and time pickers |
| Identity and org pickers | `identity-picker`, `organization-picker`, `cost-center-picker`, `signer` | User, department, cost center, and signer selection |
| Uploads and media | `file-upload`, `icon-upload` | File attachments and icon/image uploads |
| Advanced and system | `lookup`, `mutiple-metadata`, `location-picker`, `flowstatus`, `autonumber`, `list` | Relations, metadata, geo-location, workflow status, auto-numbering, and sub-lists |

### Base Field Type Length Constraints

Based on the underlying primitive `FieldType`, field names and values must comply with these validation ranges:

| Primitive FieldType | Length range |
| --- | --- |
| `Text` | 1-300 characters |
| `Bit` | 1-50 characters |
| `Decimal` | 1-200 characters |
| `Datetime` | 1-200 characters |

### Uniqueness And Naming Constraints

- `DisplayName`, `FieldName`, and `InternalName` must each be completely unique within the same list.
- `InternalName` accepts only alphanumeric characters and underscores: `[a-zA-Z0-9_]`.
- `DisplayName`, `FieldName`, and `InternalName` must not exceed 255 characters.

### Index Synchronization Rule

The numeric suffix at the absolute end of the `FieldName` string must match the corresponding `FieldIndex`.

Example: if `FieldName` is `Text2`, then `FieldIndex` must be `2`.

System fields such as `Title` do not use the numeric suffix convention, but the native `Title` field still must be preserved.

### Data Integrity Constraints

- `Resource.Data.Item.Defs` and `Resource.Data.Item.Layouts` cannot be `null`.
- They may be empty arrays.
- Generated YAPK child lists must likewise emit array-shaped `Fields` and `Layouts`; never serialize list field/form containers as `null`.

## Generated Data List Runtime-Add Rules

Runtime evidence from the Vendor Onboarding v4.1 data-list repair pass showed that a generated list can import and render but fail Add/save when its primary display field and default layout metadata do not match Yeeflow's native list shape.

When generating or repairing data lists:

- Preserve a native system `Title` field on every user-facing data list.
- Do not replace the native `Title` field with a custom `Text0` primary field.
- `Title` must use `FieldName: "Title"` and `InternalName: "Title"`.
- For default list behavior, keep `List.LayoutView` as `null` unless an export-proven custom add/edit/view layout route is intentionally configured.
- The default Type `0` view should include `Title` as the first visible field.
- The default Type `0` view must include at least one visible display field. Empty default views make generated lists appear blank and are generated-final failures.
- The default Type `0` view should keep system query fields such as `ListDataID`, `CreatedBy`, `ModifiedBy`, `Created`, and `Modified` where the baseline export uses them.
- Lookup fields must resolve to an included target list and target field.
- Every lookup field must have a selected display field before handoff. The display field should normally be the target list's native `Title` field unless a different export-proven business field is required and exists in the target list.
- Lookup display fields must resolve to actual target-list fields. A lookup display field set to `Text0` is invalid when the generated target list uses the native `Title` field, because `Text0` may not exist or may be an unsafe generated primary-field artifact.
- Seeded lookup sample data must use row IDs from already-seeded target list rows.
- Seed rows for lookup-dependent lists must be generated only after parent/target rows exist. Related sample row lookup values must use the parent row `ListDataID`, not the parent title text or a synthetic placeholder.
- Custom field storage families must align with their `FieldName`: `Text*` uses `FieldType: "Text"`, `Decimal*` uses `FieldType: "Decimal"`, `Datetime*` uses `FieldType: "Datetime"`, `Bigint*` uses `FieldType: "Bigint"`, and `Bit*` uses `FieldType: "Bit"`.
- Do not generate `Datetime*` field names for data-list date fields. Exported working lists use the `Datetime*` storage family.

### Known Lookup Picker Boundary

Vendor Onboarding v4.1 proved that selected lookup display fields, valid lookup target metadata, sample rows, and visible target-list views are necessary but may still not be sufficient for the runtime Add/Edit lookup picker to return records for generated target lists. Until product-team guidance identifies the missing materialization metadata, generated packages must still enforce the strict lookup metadata rules above and record picker no-record behavior as a known product issue instead of weakening the schema.

## Process Key Rules

- Process keys may contain only alphanumeric characters and underscores: `[a-zA-Z0-9_]`.
- Process keys must not exceed 255 characters.

## Process Number Format Object

Number format objects use this schema:

```json
{
  "Prefix": "test_{date}_{index}",
  "StartIndex": 1,
  "CustomLength": 8,
  "AutoIncrement": 1
}
```

The `Prefix` string supports these placeholders:

- `{date}`: standard current date
- `{yyyy}`: 4-digit year
- `{yy}`: 2-digit year
- `{mm}`: 2-digit month
- `{dd}`: 2-digit day
- `{yymmdd}`: short year, month, and day
- `{mmdd}`: month and day
- `{index}`: auto-incrementing sequence number

The `{index}` placeholder is mandatory and must appear somewhere in `Prefix`.

## Agent And Copilot Tool Permissions

When a tool is configured with `Type = 2` and `SubType = 10`, permission settings under `settings -> resources -> permissions` are evaluated with this bitwise enum:

| Name | Value |
| --- | --- |
| Submit | `1` |
| Edit | `2` |
| Delete | `4` |
| Read | `8` |
| ReadTasks | `16` |
| ProcessTasks | `32` |

Allowed resource permission values:

| Resource type | Allowed bitwise values | Meaning |
| --- | --- | --- |
| `approvalForms` | `1`, `16`, `32` | Submit, ReadTasks, ProcessTasks |
| `dataLists` | `1`, `2`, `4`, `8` | Submit, Edit, Delete, Read |
| `documentLibraries` | `1`, `2`, `4`, `8` | Submit, Edit, Delete, Read |
| `formReports` | `1` | Submit |
| `dataReports` | `1` | Submit |
| `aiAgents` | `1` | Submit |

Multiple access states are bundled with bitwise OR. For example, `9` means `Submit` plus `Read`.
