# Workflow Query Data Action

Source export: `<downloads>/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: export-proven action shape only. Query execution was not runtime-tested in this branch.

## Node Shape

Query data uses workflow node `stencil.id = "QueryData"`.

Observed properties:

| Property | Observed value / pattern |
| --- | --- |
| `name` | `Query Innovation ideas` |
| `appid` | app ID number |
| `listsetid` | containing application/listset ID |
| `listid` | target data list ID |
| `listtype` | `1` for data list |
| `filters` | array, empty in this export |
| `sorts` | array, empty in this export |
| `result.type` | `multiple` |
| `result.pageIndex` | `1` |
| `result.pageSize` | `1000` |
| `result.listName` | target workflow variable ID, `QueryItems` |
| `result.listParent` | `__variables_` |
| `result.vartype` | `text` |
| `result.fields[]` | selected field descriptors |
| `result.totalCount` | count variable ID, `QueryAmount` |
| `result.querycount_prefix` | `__variables_` |

## Target List

The action targets the local `Innovation Ideas` data list. Selected fields include all generated business fields plus system audit fields:

- `Title` / Idea Title
- `Text1` / Category
- `Text2` / Description
- `Text3` / Expected Benefit
- `Text4` / Status
- `Bit1` / Ready for Review
- `CreatedBy`, `Created`, `ModifiedBy`, `Modified`

## Output Variables

The multiple-query result is saved into workflow variable `QueryItems` as text. The result count is saved into numeric variable `QueryAmount`.

## Generation Rules

- Resolve `properties.listid` to an included data list.
- Keep `result.listParent = "__variables_"` when writing to workflow variables.
- For multiple results into a text variable, include `result.fields[]` so the JSON output is shaped intentionally.
- Validate filters and sorts as arrays.
- Preserve large numeric IDs as strings.
- Do not claim query execution proof until a generated package has runtime-tested the workflow safely.
