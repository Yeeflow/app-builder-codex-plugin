# Yeeflow Expression Function Reference

Sources:

- first-pass expression foundation: `expression training data generator.txt`
- second-pass enriched function knowledge base: `expression training data generator_2.txt`
- expression-editor screenshots for UI context and observed function-tab behavior

Use the normalized machine-readable reference in `yeeflow-expression-functions.normalized.json` for validators and generators.
Use `yeeflow-expression-function-knowledge-base.normalized.json` for richer bilingual descriptions, parameter names, business scenarios, and keywords.

## Selection Guidance

Choose functions by business intent before choosing by name:

| Intent | Preferred functions | Notes |
| --- | --- | --- |
| Amount formatting | `formatNumber`, `round`, `fixed` | Use `formatNumber(value, digits, thousandths)` when the result is user-facing text. |
| Deadline or due-date calculation | `dateAdd`, `dateDiff`, `now` | Use `dateAdd` for offset dates and `dateDiff` for overdue/duration checks. |
| Conditional value/text | `iif`, `isTrue`, `isFalse` | Use direct boolean comparisons for routing and display rules where possible. |
| Required-if validation | `isNullOrEmpty`, comparison operators | Native required flags stay preferred for unconditional required fields. |
| Request number generation | `concat` or `&`, `dateFormat`, `now`, `UniqueID` | Preserve exact `UniqueID` capitalization. |
| List/sublist totals | `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, `arrayMax` | Only generate after the list variable and column names are resolved. |
| Safe object attribute access | `getAttr` | Use when nested object path access is proven for the target context. |
| Current user/profile attributes | `getUserAttr`, `getOrgAttr`, `getLocAttr` | Export-backed from `Expression Runtime Test v1 Patch`; use exact exported `getOrgAttr` for department/organization attributes. |
| Text cleanup | `trim`, `replace`, `lower`, `upper` | Useful for normalization and generated summaries. |
| Duplicate removal | `removeDuplicates` | Use for arrays after the array variable is resolved. |

## Enrichment Notes

- The second-pass knowledge base enriched 54 of 55 baseline functions.
- `strIndex` is baseline-only in the second pass. Keep the exact camel-case name and do not rename it to `strindex`.
- The Function tab screenshot shows `addWorkDays` and `addWorkHours`, but the second file does not provide parameter metadata. Treat them as observed but not generation-safe yet.
- Function examples in the knowledge base are human-readable expression strings. Generated packages must convert them to Yeeflow JSON token arrays.
- `Expression Runtime Test v1 Patch.yap` adds export-backed user/profile attribute functions. The user notes mentioned `getDeptAttr`, but the decoded export uses `getOrgAttr`; preserve `getOrgAttr` until `getDeptAttr` is proven by an export.

## Math

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `abs` | 1 | number | Absolute value. |
| `ceil` | 1 | number | Smallest integer not less than value. |
| `fixed` | 2 | number | Truncate to digits. |
| `floor` | 1 | number | Largest integer not greater than value. |
| `log` | 1-2 | number | Natural log or log with base. |
| `max` | 1-4 | number | Maximum input. |
| `min` | 1-4 | number | Minimum input. |
| `pow` | 2 | number | Power. |
| `rand` | 0 | number | Random 0 <= v < 1. |
| `round` | 1-2 | number | Round, optional digits. |

## String And Conversion

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `concat` | 1-4 | text | Concatenate strings. |
| `formatNumber` | 3 | text | Numeric display string. |
| `left` | 2 | text | Leftmost characters. |
| `len` | 1 | number | Array count or text length. |
| `lower` | 1 | text | Lowercase. |
| `number` | 1 | number | Convert to number, invalid/null to 0. |
| `repeat` | 2 | text | Repeat text. |
| `replace` | 4 | text | Replace all/first/last using type 1/0/2. |
| `right` | 2 | text | Rightmost characters. |
| `split` | 2 | array | Split text. |
| `strIndex` | 2-3 | number | Find text position. |
| `subString` | 3 | text | Substring. |
| `text` | 1 | text | Convert to text. |
| `trim` | 1 | text | Trim whitespace. |
| `upper` | 1 | text | Uppercase. |

## Date And Time

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `date` | 3-6 | date | Build date string from year/month/day and optional time. |
| `dateAdd` | 3 | date | Add year/month/day/hour/minute/second interval. |
| `dateDiff` | 4 | number | Difference between two dates. The third date-unit parameter must be a raw lowercase unit string such as `"year"` or `"day"`, not an expression string-token array. |
| `dateFormat` | 2 | text | Format date with tokens such as YYYY, MM, DD, HH, mm, ss. |
| `datePart` | 2 | number | Year, Quarter, Month, dayofweek, day, hour, minute, second. |
| `datePicker` | 2 | date | Date picker expression helper. |
| `day` | 1 | number | Day of month. |
| `hour` | 1 | number | Hour. |
| `minute` | 1 | number | Minute. |
| `month` | 1 | number | Month. |
| `now` | 0 | date | Current date/time. |
| `second` | 1 | number | Second. |
| `weekNum` | 1-2 | number | Week number, optional ISO flag. |
| `year` | 1 | number | Year. |

## Array

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `arrayAverage` | 1-4 | number | Optional column/filter column/filter value. |
| `arrayConcat` | 2 | array | Concatenate two arrays. |
| `arrayCount` | 1-4 | number | Count items/non-empty column values. |
| `arrayIndex` | 2 | number | Index of value, -1 if missing. |
| `arrayMax` | 1-4 | number | Max with optional column/filter. |
| `arrayMin` | 1-4 | number | Min with optional column/filter. |
| `arraySum` | 1-4 | number | Sum with optional column/filter. |
| `join` | 1-2 | text | Join array values. |
| `removeDuplicates` | 1 | array | Unique values. |

## Logical, System, Utility

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `iif` | 3 | unknown | Condition, then, else. |
| `isFalse` | 1 | boolean | False-like check. |
| `isNullOrEmpty` | 1 | boolean | Null or empty string. |
| `isTrue` | 1 | boolean | True-like check. |
| `currentUser` | 0 | text | Current user ID. |
| `UniqueID` | 0 | text | Unique ID. |
| `getAttr` | 2-3 | unknown | Object path lookup with optional default. |
| `JSONStringfy` | 1 | text | Export-backed Phase 2 spelling for serializing a value or query-result collection to JSON text. |

## Query Result Functions

These functions are used with Yeeflow Form Actions Phase 2 Query data steps.

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `arraySum` | 1-4 | number | Runtime-known array aggregate. Phase 2 export uses it against a temp query collection and selected column label `"Amount"`. |
| `JSONStringfy` | 1 | text | Export-backed collection display/debug function. Preserve this exact spelling until another export proves `JSONStringify` as a valid alias. |

Do not use `arraySub`; the aggregate function learned for query-result totals is `arraySum`.

`vLookup` remains deferred. The Phase 2 export contains `vLookup` only in button/action labels, not as an expression token.

## User, Department, And Location Attributes

These functions are export-backed from `Expression Runtime Test v1 Patch.yap` and runtime-tested in `Expression User Profile Test v1`.

| Function | Params | Returns | Notes |
| --- | --- | --- | --- |
| `getUserAttr` | 3 | unknown/text/date/object | `getUserAttr(userOrContext, attrDescriptor, defaultValue)`. The current-user context token uses `exprType: "application"`, `id: "CurrentUser"`, `valueType: "string"`, `type: "expr"`, and `name: "Context:Current User"`. |
| `getOrgAttr` | 3 | unknown/text/object | `getOrgAttr(departmentValue, attrDescriptor, defaultValue)`. Use this exact function for department/organization values; do not generate `getDeptAttr` yet. |
| `getLocAttr` | 3 | unknown/text/object | `getLocAttr(locationValue, attrDescriptor, defaultValue)`. Use only for location values returned from user attributes or other export-backed location expressions. |

Attribute parameters are direct descriptor objects, not plain strings and not one-item expression arrays:

```json
{ "key": "Email", "label": "Email" }
```

Fallback/default parameters are expression arrays, usually:

```json
[{ "type": "str", "value": "N/A" }]
```

Observed `getUserAttr` attributes include `Name_CN`, `SPAccount`, `Email`, `DepartmentID`, `LineManager`, `EmployeeNo`, `IsAdmin`, `Photo`, `JobTitle`, `JobGrade`, `OfficeAddress`, `Phone`, `Mobile`, `Telephone`, `Remark`, `LocationID`, `LastLoginTime`, `ServiceStartDate`, `LatestHireDate`, `Created`, and `CreatedBy`.

Observed `getOrgAttr` attributes include `Name`, `ParentID`, and `Manager`.

Observed `getLocAttr` attributes include `Name` and `Manager`.

Common recipes:

```json
[
  {
    "type": "func",
    "func": "getUserAttr",
    "params": [
      [{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }],
      { "key": "Email", "label": "Email" },
      [{ "type": "str", "value": "N/A" }]
    ]
  }
]
```

```json
[
  {
    "type": "func",
    "func": "getOrgAttr",
    "params": [
      [{ "type": "func", "func": "getUserAttr", "params": [[{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }], { "key": "DepartmentID", "label": "Department" }, [{ "type": "str", "value": "N/A" }]] }],
      { "key": "Name", "label": "Name" },
      [{ "type": "str", "value": "N/A" }]
    ]
  }
]
```

Boarding anniversary recipe:

```json
[
  {
    "type": "func",
    "func": "dateFormat",
    "params": [
      [{ "type": "func", "func": "dateAdd", "params": [[{ "type": "func", "func": "getUserAttr", "params": [[{ "id": "CurrentUser", "exprType": "application", "valueType": "string", "type": "expr", "name": "Context:Current User" }], { "key": "LatestHireDate", "label": "Boarding Date" }, [{ "type": "str", "value": "N/A" }]] }], [{ "type": "str", "value": "year" }], [{ "type": "num", "value": "1" }]] }],
      [{ "type": "str", "value": "MMM DD, YYYY" }]
    ]
  }
]
```

Runtime correction from `Employee Family Implant v1 Core Patch 20260516`: a manually repaired Set variables step worked with `params[1]` as `{ "key": "Name_CN", "label": "Name" }`. Generated siblings that used `[{ "key": "...", "label": "..." }]` remained suspect and should be patched.
