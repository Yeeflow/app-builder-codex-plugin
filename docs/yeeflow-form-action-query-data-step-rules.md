# Yeeflow Form Action Query Data Step Rules

Use these rules when generating Yeeflow front-end form actions that read records from a list/report/library source into form variables.

## Scope

Export-backed from `Form Actions Phase 1 Test v1 Runtime.yap`:

- query data from a packaged data list
- query multiple items
- query single item
- sort results
- map multiple results to a form `list` variable
- map single result fields to workflow variables
- store total query count in a temp variable
- store selected multiple-query fields in a temp collection variable
- use `arraySum` against the temp query collection

Generated-runtime-proven by `Form Actions Phase 2 Query Submit Test v1`:

- query multiple from a packaged data list
- query multiple result collection mapped into a form list/sub list variable
- query result count copied into a display/workflow variable
- Query data `Data filter -> Condition` using `attrs.querydata_filters`
- query single from a packaged data list
- query single selected-field mapping into workflow variables
- temp query collection aggregation with `arraySum`
- temp query collection display with `JSONStringfy`

Still deferred:

- document library sources
- form report sources
- data report sources
- paging beyond `querydata_pagesize`
- empty-result handling
- `vLookup` function token shape

The first generated runtime test attempted an `Active == true` filter by writing `attrs.querydata_filter`. Runtime still returned the inactive `SRC-003` record because that singular helper attribute did not populate the Query data step's actual `Data filter -> Condition` setting. User follow-up and the patched export confirmed the fix: the runtime filter is stored in `attrs.querydata_filters` (plural).

## Step Type

Use:

```json
{ "type": "querydata" }
```

The step lives in:

```text
page.formdef.actions[].steps[]
```

## Source List

Source list shape:

```json
{
  "querydata_list": {
    "AppID": 41,
    "ListSetID": "2055176306075381761",
    "ListID": "2055176313546620929",
    "ListType": 1
  }
}
```

Rules:

- Use confirmed app/list metadata only.
- Prefer internal packaged source lists for generated test apps.
- Do not guess external list/report/library ids.

## Multiple Query To List Variable

Use when the UI needs to display query rows.

Required pattern:

```json
{
  "querydata_type": "multiple",
  "querydata_fieldmap": {
    "Title": "field_Title",
    "Text1": "field_RequestTitle"
  },
  "querydata_listname": "FormActions",
  "querydata_vartype": "list",
  "querydata_listname_parent": "__variables_",
  "querydata_fields": null
}
```

Rules:

- `querydata_listname` is the form-level list variable id without prefix.
- `querydata_listname_parent = "__variables_"` means the target is a workflow/form variable.
- `querydata_fieldmap` maps source `FieldName` values to target list row field ids.
- Every target field id must exist in `variables.listref[]` and the rendered list control.

## Single Query To Variables

Use when the form needs a few values from one source item.

Pattern:

```json
{
  "querydata_type": "single",
  "querydata_fieldmap": {
    "Title": "QueryTitle",
    "Text1": "QueryRequestTitle"
  },
  "querydata_listname": "",
  "querydata_vartype": "",
  "querydata_listname_parent": ""
}
```

Rules:

- Map source fields directly to workflow variables when values must be submitted, persisted, or used by workflow.
- Use temp variables for transient display-only values.
- Add filters in future generated apps when business logic requires a specific source row.

## Multiple Query To Temp Collection

Use when the query result collection is needed for a client-side aggregate or display.

Pattern:

```json
{
  "querydata_type": "multiple",
  "querydata_fieldmap": null,
  "querydata_listname": "var_CollectionofQueryItems",
  "querydata_vartype": "text",
  "querydata_listname_parent": "__temp_",
  "querydata_fields": [
    { "FieldName": "Title", "Type": "input", "DisplayName": "Title" },
    { "FieldName": "Decimal1", "Type": "input_number", "DisplayName": "Amount" }
  ]
}
```

Rules:

- Use explicit `querydata_fields[]`.
- Reference the temp collection in expressions as `__temp_<querydata_listname>`.
- Copy any final persisted or workflow-relevant value into a workflow variable.

## Total Count

Observed count target:

```json
{
  "querydata_totalcount": "var_TotalQueryItems",
  "querydata_totalparent": "__temp_"
}
```

Rules:

- Use temp variables for display-only query counts.
- Use workflow variables when the count must be submitted, persisted, or used by workflow routing.

## Sorts And Page Size

Observed sort:

```json
{
  "querydata_sorts": [
    { "SortName": "Created", "SortByDesc": true }
  ],
  "querydata_pagesize": 200
}
```

Rules:

- Use explicit sort for deterministic single-item query behavior.
- Keep page sizes modest for generated runtime tests.

## Data Filter Condition

Correct UI location:

```text
Form actions -> Query data step -> Data filter -> Condition
```

Runtime-proven behavior:

- `Active Equals ON` filters the Query data step result correctly when configured through the `Data filter -> Condition` editor.
- The patched export stores the condition in `attrs.querydata_filters`.
- `Implant Application Request (5).ywf` proved a second Query data filter mode issue: workflow-variable operands must be stored as expression-editor token arrays with `showCus: false`. If the right operand is serialized as a frontend `<input type="button" ...>` HTML string while the row remains in direct-value mode, Yeeflow treats the HTML as a literal string and the condition does not match records.

Export-backed shape:

```json
{
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
}
```

Workflow-variable operand shape:

```json
{
  "querydata_filters": [
    {
      "key": "8e0ee823-d395-45db-838e-5d9c9e2f4015",
      "pre": "and",
      "left": "Text2",
      "op": "0",
      "right": [
        {
          "exprType": "variable",
          "valueType": "text",
          "id": "ApplicantEmployeeID",
          "type": "expr",
          "name": "Workflow Variables:Applicant Employee ID"
        }
      ],
      "showCus": false
    }
  ]
}
```

Field meanings:

- `left`: source list `FieldName`.
- `op`: comparison operator; `0` is the exported Equals operator.
- `right`: comparison value. For direct literal values, use a primitive value such as `"true"` or `"Active"` with `showCus: true`. For workflow variables or calculations, use an expression-token array with `showCus: false`.
- `pre`: condition joiner. Use `and` for the first simple filter.
- `key`: generated UUID-like condition key.
- `showCus`: direct-value mode when `true`; expression-editor mode when `false`.

Known generator mistake:

- `attrs.querydata_filter` singular was generated in the first Phase 2 package but did not populate the designer's Data filter condition and was ignored by runtime.
- Generated HTML button strings such as `<input type="button" data="...Workflow Variables:Applicant Employee ID...">` were placed in `right` with `showCus: true`. The designer displayed a variable-looking button, but runtime compared the list field to that literal HTML string. This caused Employee Family Implant second-request quota checks to miss existing approved usage rows until the filter rows were switched to expression-editor mode.

Generation rule:

- Use `attrs.querydata_filters` plural for Query data Data filter conditions.
- Do not use `attrs.querydata_filter` singular as the final filter implementation.
- For an Active/Bit field, generate `right: "true"` for ON.
- For variable/calculated operands, generate `right` as a Yeeflow expression-token array and set `showCus: false`.
- Do not emit frontend expression-button HTML inside `attrs.querydata_filters[].right`.
- For quota/usage queries, compare stable fields with compatible operand modes. Example: `Applicant Employee ID == Workflow Variables:Applicant Employee ID` and `Quota Cycle Key == Workflow Variables:Quota Cycle Key` both use expression-token `right` values with `showCus: false`.

## Validation Recommendations

Warn when:

- `querydata_list` is missing.
- `querydata_filters[].right` is a string containing `<input`, `&quot;`, or `Workflow Variables:` because this is almost certainly a direct-value-mode HTML operand instead of an expression-editor operand.
- `querydata_filters[].right` is an expression-token array but `showCus` is not `false`.
- `querydata_filters[].right` is a primitive literal but `showCus` is not `true`, unless a future export proves another mode.
- `querydata_type` is not `single` or `multiple`.
- `querydata_fieldmap` maps to missing variables/list row fields.
- `querydata_listname_parent` points to an unknown namespace.
- multiple query collection target is missing.
- `querydata_fields` is empty when an aggregate expression depends on selected fields.
- result count target variable is missing.

Use errors only for structurally invalid JSON.

## Runtime Baseline Status

`Form Actions Phase 2 Query Submit Test v1` plus the patched export and corrected generator retest proved the generated query data surface and filter property:

- Source list and target list opened without `datas/query` 400.
- Source list contained three sample rows: two active rows and one inactive row.
- `Load Multiple Test Requests` with `attrs.querydata_filters` populated a form sub list with only the two active rows and set Loaded Count to `2`.
- `Load Single Test Request` mapped an active returned item into display/workflow variables.
- `arraySum(__temp_var_CollectionofQueryItems, "Amount", [], [])` returned `2000` from the active rows only.
- `JSONStringfy(__temp_var_CollectionofQueryItems)` displayed the filtered collection JSON.
- Submit, reviewer task open, approval completion, and ContentList persistence passed with filtered values.

Filter follow-up:

- The generated `attrs.querydata_filter` singular path was ignored by runtime.
- The patched export and corrected generated retest confirm the correct path is `attrs.querydata_filters` plural.
- `vLookup` remains UI-observed only and is not generation-safe.
