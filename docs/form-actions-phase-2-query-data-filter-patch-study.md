# Form Actions Phase 2 Query Data Filter Patch Study

## Source

Read-only export:

`/Users/Renger/Downloads/Form Actions Phase 2 Query Submit Test v1 Filter Patch.yap`

The app was manually updated in the designer after the first runtime baseline. The user set the Query data step's `Data filter -> Condition` to:

```text
Active Equals ON
```

Runtime result after manual patch: the multiple query returned only active rows (`SRC-002`, `SRC-001`) and Loaded Count became `2`.

## Root Cause

The generated package wrote a singular filter helper:

```json
"querydata_filter": [
  {
    "left": "Bit1",
    "op": "0",
    "right": "ON"
  }
]
```

That property stayed in the patched export, but it did not populate the designer's Query data `Data filter -> Condition` model and runtime ignored it.

## Working Export-Backed Property

The patched export adds a plural property on the same Query data step:

```json
"querydata_filters": [
  {
    "key": "d7bf4cd0-0b69-47f6-9fbd-fc6cee84c78e",
    "pre": "and",
    "left": "Bit1",
    "op": "0",
    "right": "true",
    "showCus": true
  }
]
```

Important details:

- Property name is `querydata_filters`, plural.
- `left` uses the source list field name, such as `Bit1`.
- `op: "0"` is the exported Equals operator.
- Bit/Yes-No ON exports as `right: "true"`, not `right: "ON"`.
- `key` is a UUID-like condition id and should be generated fresh.
- `pre: "and"` and `showCus: true` are present on the working condition.

## Generation Rule

For Query data step Data filters:

- Generate `attrs.querydata_filters`.
- Do not rely on `attrs.querydata_filter`.
- For an Active Bit field, generate:

```json
{
  "key": "<fresh-guid>",
  "pre": "and",
  "left": "Bit1",
  "op": "0",
  "right": "true",
  "showCus": true
}
```

## Runtime Status

Proven by the user-confirmed patched runtime:

- Query data filters work when configured through the Query data step `Data filter -> Condition`.
- `Active Equals ON` filters the source list to active rows only.

The original generated test remains useful as a root-cause baseline: it proves the singular `querydata_filter` path is insufficient.
