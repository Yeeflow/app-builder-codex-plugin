# Yeeflow Form Actions Phase 2 Query/Submit Study

Source export studied read-only: `<downloads>/Form Actions Phase 1 Test v1 Runtime.yap`.

Focus approval form: `Form Actions Phase 1 Test v1`.

Focus submission page: `Submit Form Actions Test`.

## Summary

The manually updated runtime export adds the second export-backed form action pattern for approval forms. It extends Phase 1 button/page-load/temp-variable patterns with `querydata` steps and `submit` steps.

Phase 2 export-backed patterns found:

- `querydata` multiple-item query mapped directly into a form `list` variable.
- `querydata` single-item query mapped directly into workflow variables.
- `querydata` multiple-item query stored into a temp collection variable with explicit selected fields.
- query total count stored into a temp variable.
- `arraySum` used against the temp query-result collection.
- `JSONStringfy` used to display a temp query-result collection.
- `submit` step with default submit behavior.
- `submit` step configured as Save changes with `attrs.submitType = "3"`.

The export contains UI/action labels mentioning `vLookup`, but no `vLookup` expression token was found. Treat `vLookup` as UI-observed only until a future export provides the actual token shape.

## Form Action Location

Actions remain on the submission page:

```text
def.pageurls[0].formdef.actions[]
```

Button click wiring remains:

```text
action_button.attrs.control_action = "<form action id>"
```

Page load wiring remains:

```text
page.formdef.formAction.onLoad = "<form action id>"
```

## Query Data Step Shape

Observed step type:

```json
{
  "type": "querydata",
  "name": "Query Multiple items",
  "attrs": {
    "querydata_list": {
      "AppID": 41,
      "ListSetID": "2055176306075381761",
      "ListID": "2055176313546620929",
      "ListType": 1
    },
    "querydata_sorts": [
      { "SortName": "Created", "SortByDesc": true }
    ],
    "querydata_type": "multiple",
    "querydata_fieldmap": {
      "Title": "field_Title",
      "Text1": "field_RequestTitle",
      "Text3": "field_Approvalstatus"
    },
    "querydata_listname": "FormActions",
    "querydata_vartype": "list",
    "querydata_listname_parent": "__variables_",
    "querydata_fields": null,
    "querydata_totalcount": "var_TotalQueryItems",
    "querydata_totalparent": "__temp_",
    "querydata_pagesize": 200
  }
}
```

Important property meanings:

| Property | Meaning |
| --- | --- |
| `querydata_list` | Source list reference. In this export it points to an internal packaged child data list. |
| `querydata_type` | Query mode. Observed values: `multiple`, `single`. |
| `querydata_sorts` | Sort list. Observed sort by `Created` descending. |
| `querydata_fieldmap` | Maps source field names to target workflow/list variable ids. |
| `querydata_listname` | Target variable id for list/collection output, without prefix. |
| `querydata_vartype` | Target output type hint. Observed values: `list`, `text`, and empty string for single-item mapping. |
| `querydata_listname_parent` | Variable namespace prefix. Observed values: `__variables_`, `__temp_`, and empty string. |
| `querydata_fields` | Explicit selected fields for temp collection output. May be `null` when fieldmap drives direct list-variable mapping. |
| `querydata_totalcount` | Target count variable id, without prefix. |
| `querydata_totalparent` | Count variable namespace prefix. Observed `__temp_`. |
| `querydata_pagesize` | Maximum result count requested. Observed `200` and `300`. |

## Query Multiple Items To Sub List

Action: `Load Multiple Test Requests`.

Button: `Load Multiple Test Requests`.

The query step:

- reads from the packaged child data list
- uses `querydata_type = "multiple"`
- maps source `Title`, `Text1`, and `Text3` to row fields in the `FormActions` list variable
- sets result count into temp variable `var_TotalQueryItems`
- uses `querydata_listname = "FormActions"`
- uses `querydata_listname_parent = "__variables_"`
- leaves `querydata_fields = null`

Generation rules:

- Use direct list-variable output when the UI needs query rows in a form `list`/sub list.
- Map source fields explicitly in `querydata_fieldmap`.
- Ensure every target row field id exists in the list variable and list control.
- Store total count into a temp number/text variable when the count is display-only.
- Do not assume all source fields are returned when `querydata_fields` is explicit or when fieldmap is narrow.

## Query Single Item To Variables

Action: `Load Single Test Request`.

Button: `Load Single Test Request`.

The query step:

- uses `querydata_type = "single"`
- maps selected source fields directly into workflow variables:
  - `Title` -> `QueryTitle`
  - `Text1` -> `QueryRequestTitle`
  - `Text2` -> `QueryFinalNotes`
  - `Text3` -> `QueryApprovalStatus`
- keeps `querydata_listname`, `querydata_vartype`, and `querydata_listname_parent` empty
- stores total count into temp variable `var_TotalQueryItems`

Generation rules:

- Use single-item query when the form needs a few display variables from one source row.
- Map source fields directly into workflow variables when the values must be submitted, persisted, or used by workflow.
- Use temp variables only for transient display values.
- Add a filter before relying on “first row” behavior in generated apps; this export proves shape, not business selection semantics.

## Query Multiple Items To Temp Collection

Action: `Query to get the sum of total amount from data list`.

Button: `Calculate with vLookup function`.

The query step:

- uses `querydata_type = "multiple"`
- stores selected fields into temp variable `var_CollectionofQueryItems`
- uses `querydata_listname_parent = "__temp_"`
- uses `querydata_vartype = "text"`
- selects fields explicitly:
  - `Title`
  - `Decimal1` as display `Amount`
- stores total count into temp variable `var_TotalQueryItems`

The next `setvar` step sets workflow number variable `Sum_Amount_QueryItems` using:

```json
{
  "type": "func",
  "func": "arraySum",
  "params": [
    [
      {
        "exprType": "variable",
        "valueType": "string",
        "id": "__temp_var_CollectionofQueryItems",
        "type": "expr",
        "name": "var_CollectionofQueryItems"
      }
    ],
    [{ "type": "str", "value": "Amount" }],
    [],
    []
  ]
}
```

Generation rules:

- Use explicit `querydata_fields[]` when a temp collection will be used by functions such as `arraySum`.
- The second `arraySum` parameter should use the selected field display/key available in the query result collection. In this export, it is `"Amount"`.
- Store aggregate results into workflow variables when the value must be visible to workflow, task pages, or ContentList.
- Do not use `arraySub`; the export-backed aggregate function is `arraySum`.

## Query Result Display Expressions

The export displays total count with a Text/heading expression:

```json
[
  { "type": "str", "value": "Total items: " },
  { "type": "op", "op": "&" },
  {
    "exprType": "variable",
    "valueType": "string",
    "id": "__temp_var_TotalQueryItems",
    "type": "expr",
    "name": "var_TotalQueryItems"
  }
]
```

The export displays the query collection with this exact function token:

```json
{
  "type": "func",
  "func": "JSONStringfy",
  "params": [
    [
      {
        "exprType": "variable",
        "valueType": "string",
        "id": "__temp_var_CollectionofQueryItems",
        "type": "expr",
        "name": "var_CollectionofQueryItems"
      }
    ]
  ]
}
```

Note the exact export spelling: `JSONStringfy`. The user-facing spelling may appear as `JSONStringify`, but this export does not contain that token. Preserve exact runtime function names until another export proves an alias.

## Submit Form Step

Action: `Submit form with comments`.

Button: `Submit form for testing`.

Minimal observed shape:

```json
{
  "type": "submit"
}
```

The designer UI shows submit types:

- Form Submit / Task Approve / Task Complete
- Save changes
- Execute form validation
- Reject
- Task forward
- Add task assignee

Only default submit and Save changes are configured in this export.

Generation rules:

- Use default `{ "type": "submit" }` for normal form submit / task approve / task complete when no special options are needed.
- Use a separate action button for custom submit actions so the native Action Panel remains available.
- Keep task-context submit types deferred until an export proves the exact options for approve, reject, forward, and add-assignee scenarios.
- Submit form steps apply to approval forms, data-list forms, and public forms; dashboards do not support Submit form steps.

## Save Changes Step

Action: `Save as draft`.

Button: `Save as draft`.

Observed shape:

```json
{
  "type": "submit",
  "name": "Submit with draft",
  "attrs": {
    "submitType": "3",
    "closeForm": true,
    "ignoreValid": true
  }
}
```

Generation rules:

- Treat Save changes as a submit-step mode, not a separate step type.
- Use Save changes for draft-like or intermediate save behavior.
- Do not use Save changes when the requirement is to progress the workflow.
- `ignoreValid = true` means validation can be bypassed; only generate it when draft behavior is intended.

## Temp Variable Usage

New temp variables:

- `var_TotalQueryItems`
- `var_CollectionofQueryItems`

Rules:

- Query count is display-only in this export and stored in a temp variable.
- Query collection is transient and stored in a temp variable before aggregation.
- If a query result must be persisted or used after form close, copy the needed values into workflow variables before submit.
- Do not rely on temp variables for backend persistence.

## Runtime Status

This export is manually updated and runtime-derived. It proves the exported shapes for Phase 2 form action steps, but this pass does not yet prove that Codex can generate a fresh package with these patterns.

Next recommended runtime test: `Form Actions Phase 2 Query Submit Test v1`, focused on query multiple, query single, count, collection-to-sublist mapping, `arraySum`, `JSONStringfy`, Submit form, Save changes, and normal approval completion.
