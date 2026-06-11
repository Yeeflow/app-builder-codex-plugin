# Yeeflow data and dashboard patterns

## List query pattern
Use `context.modules.yeeSDKClient.lists.queryItems(...)`.
Prefer a paginated helper for dashboards and large lists.

Typical pattern:
- `listId`
- `dataListId` when needed for runtime compatibility
- `fields`
- `fieldIds` or `selectedFields` when needed for runtime compatibility
- `pageIndex`
- `pageNo` when needed for runtime compatibility
- `pageSize`
- optional `filters`
- optional `sorts`

For configurable lookup/search controls:
- include identity fields such as `ListDataID`
- try the filtered query first, but if a `contains` filter returns no usable rows, run a limited broad fallback query and match locally on the configured display field
- treat empty filtered results as a possible filter-shape mismatch, not always as true no data
- document field id/name assumptions in a code comment

## Common safeguards
- render safe defaults when list id or field ids are missing
- avoid crashing on empty query results
- normalize strings, numbers, dates, and booleans with helper methods
- normalize expression-editor parameter values from primitives, arrays, and object shapes such as `value`, `label`, and `key`
- map field ids dynamically when the request is configurable
- read item values from direct row fields, `values`/`Values`, `fields`/`Fields`, and array-style `fieldValues`/`FieldValues`
- match returned field keys defensively, including case-insensitive keys and variants such as `FieldID`, `fieldCode`, and `ListDataId`
- normalize primitive, array, and object cell values; object cells may use `value`, `fieldValue`, `dataValue`, `valueText`, `text`, `display`, `name`, or `title` style keys

## Dynamic table pattern
For operational tables:
- build row models first
- then merge queried data into those rows
- preserve safe default values such as `0` or `N/A`
- use footer totals for numeric columns when requested
- use explicit row flags like `hasMatchedRecord` when styling matched rows

## Dashboard pattern
`antd` is acceptable for dashboards.
Useful components include:
- `Card`
- `Row`
- `Col`
- `Table`
- `Tag`
- `Progress`
- `Spin`
- `Alert`

Recommended dashboard structure:
1. KPI cards
2. distribution modules
3. trend modules
4. detailed analysis table

Dashboard variable guidance:
- Dashboard temp variables may not save through the same API path as form fields.
- Do not blindly assume `context.setFieldValue()` works for dashboard variables or temp variables.
- When templates write to dashboard variables/temp variables, resolve writable targets separately from expression-editor runtime values and try available variable/temp-variable setters defensively.

## Chart guidance
When charts are requested:
- use chart types only where they improve readability
- pie/donut for limited distributions
- horizontal bars for longer labels
- line/area for time trends
- keep colors restrained and business-readable
