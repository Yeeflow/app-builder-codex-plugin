# Yeeflow Temp Variable Generation Rules

Temp variables are page/form runtime state for Yeeflow form actions.

## Export-Backed Shape

Temp variables are listed under the approval form definition:

```json
{
  "variables": {
    "tempVars": [
      { "idx": "uuid", "id": "var_Status" }
    ]
  }
}
```

Expression tokens reference a temp variable by prefixing its id with `__temp_`:

```json
{
  "exprType": "variable",
  "valueType": "string",
  "id": "__temp_var_Status",
  "type": "expr",
  "name": "var_Status"
}
```

## Use Cases

Use temp variables for:

- button interaction state
- temporary status text
- confirm dialog result display
- temporary counters or toggles
- UI-only defaults before values are copied to workflow variables
- query result counts
- query result collections used for client-side display or aggregate expressions

Do not use temp variables as the only source for persisted business data. Copy the value to a workflow variable or persist with an explicit supported action when persistence is required.

## Generation Rules

- Use fresh UUIDs for `idx`.
- Use readable ids such as `var_TempStatus`, `var_DialogResult`, or `var_ClickCount`.
- Use `valueType: "string"` for text-like temp variables in action expressions, matching the Phase 1 export.
- Use `__temp_${id}` only in expression tokens; keep `variables.tempVars[].id` unprefixed.
- Display temp values with the learned Text control standard: `type: "heading"`, inline width, token typography, and plain string color.
- Query data steps may write counts with `querydata_totalcount = "<temp id>"` plus `querydata_totalparent = "__temp_"`.
- Query data steps may write transient collections with `querydata_listname = "<temp id>"` plus `querydata_listname_parent = "__temp_"`.
- Reference query-result temp collections in expression tokens as `__temp_<temp id>`.
- Copy query-derived values into workflow variables before submit when the value must be persisted or used by workflow.

## Validation Rules

Warn when:

- a form action references an unknown `__temp_` variable
- a temp variable is declared but never used
- a temp variable is used in ContentList persistence without an explicit workflow-variable copy
- a generated temp value control uses the old/broken Text control shape
- a query result temp collection is used for persistence without a workflow-variable copy
