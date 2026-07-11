# Workflow Query Data Action

Original source export: `AI Agent and Copilot Local Resource Baseline8.yap`

Focused extension sources: `Approval form workflow sample-V1.6.yapk`, `Approval form workflow sample-v1.7.yapk`, and `Approval form workflow sample-v1.10.yapk`.

Classification: export-proven action and orchestration shapes only. Query execution was not runtime-tested in this branch.

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

## V1.6 Result Modes

The focused V1.6 export adds three distinct result contracts:

- multiple count-only: empty row target plus `totalCount` number workflow variable;
- single to variables: `fieldMap` maps source fields to workflow variable IDs;
- multiple to List variable: `vartype = "list"`, `listParent = "__variables_"`, `fieldMap` targets ListRef fields, and `fields = null`.

It also proves a Scheduled Workflow chain of `QueryData -> Loop(list) -> MailTask`, plus count branching followed by `InvokeCode -> MailTask`. See `docs/standards/workflow-query-data-golden-reference-standard.md` and `docs/reference/workflow-query-data-golden-references.json`.

## Generation Rules

- Resolve `properties.listid` to an included data list.
- Keep `result.listParent = "__variables_"` when writing to workflow variables.
- For multiple results into a text variable, include `result.fields[]` so the JSON output is shaped intentionally.
- For multiple results into a List variable, use `result.fieldMap`, a declared List variable linked to `variables.listref`, and keep `result.fields = null`.
- Count-only multiple results intentionally omit a row target; validators must not require `listName` when `totalCount` is the only output.
- Single results require a non-empty `fieldMap` to declared, type-compatible workflow variables.
- Use `properties.sorts` for the V1.6 export shape.
- Dynamic Lookup filters compare source `ListDataID` to the stored Lookup identity through expression-token arrays with `showCus: false`.
- Validate filters and sorts as arrays.
- V1.10 proves Data List (`listtype = 1`), Document Library (`16`), and Form Report (`32`) sources. Data Report remains deferred until its focused training round.
- Workflow `sorts[]` and Form Action `querydata_sorts[]` support at most two entries. Preserve `SortName` and boolean `SortByDesc`.
- Preserve large numeric IDs as strings.
- Do not claim query execution proof until a generated package has runtime-tested the workflow safely.

## Export Discrepancy

`Query Campaigns` exports with `filters: []`, although the accompanying business description says it filters by `SelectedCampaign`. The empty filter is not promoted as a Lookup-filter reference. `Get Campaign Owner` is the canonical V1.6 Lookup filter reference.

## V1.7 Data List Workflow Addendum

V1.7 proves a `WorkflowType = 1` count-only QueryData node that filters a related Event lookup by current Campaign `ListDataID`, stores the count in a number workflow variable, branches on `> 0` versus `<= 0`, and then uses ContentList edit/add. It also proves List Loop from a Data List Sub List (`__list_`), multiple-values Loop, fixed-times Loop, current iteration (`LoopIndex`), current item fields (`LoopItem.<field>`), and nested actions under `LoopBody.children[]`.

The two host `FlowMappings[]` rows use `Setting.NewTrigger = true` and non-null FieldName values that resolve to dedicated `flowstatus` fields. This proves that null and resolving flowstatus mappings are valid; a normal business field remains invalid.

## V1.10 Document Library and Form Report Addendum

V1.10 proves a Data List Workflow that queries an included Document Library (`listtype = 16`) and Form Report (`listtype = 32`), stores both multiple-row results in List workflow variables backed by matching ListRef definitions, and saves both result counts. It also proves non-default `pageIndex` values, Page Size values `3` and `1000`, and exactly two sorts per query. The `View event` custom form contains single-result Form Action queries against the same source types. Form Report is a query source, not a Form Action host.
