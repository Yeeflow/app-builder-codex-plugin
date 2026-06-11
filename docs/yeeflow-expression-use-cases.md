# Yeeflow Expression Use Cases

## Calculated Controls

Use calculated controls for formulas such as `Subtotal = Quantity * Unit Price`. Avoid editable inputs for calculated-looking values.

Recommended expression:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Quantity", "type": "expr", "name": "Workflow Variables:Quantity" },
  { "type": "op", "op": "*" },
  { "exprType": "variable", "valueType": "number", "id": "UnitPrice", "type": "expr", "name": "Workflow Variables:Unit Price" }
]
```

Use `formatNumber` only after calculation when the target is display text. Keep numeric controls numeric while workflow rules or ContentList mappings still need numeric values.

## Dynamic Display Conditions

Use boolean/comparison expressions in `attrs.control_display` wrapper structures learned from exports. The expression itself should use standard variable/operator tokens.

Example: show reason when amount exceeds threshold:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "Amount", "type": "expr", "name": "Workflow Variables:Amount" },
  { "type": "op", "op": ">" },
  { "type": "num", "value": "10000" }
]
```

Screenshot evidence confirms Dynamic display rules are configured from the selected control settings panel. Generators should preserve the export-backed wrapper shape around the nested expression.

## Custom Validation

Use expression tokens when a validation rule needs comparison or empty checks. Keep simple required validation in native required flags when possible.

Example: date must not be earlier than today:

```json
[
  { "type": "func", "func": "dateDiff", "params": [[{ "exprType": "variable", "valueType": "date", "id": "RequiredDate", "type": "expr", "name": "Workflow Variables:Required Date" }], [{ "type": "func", "func": "now", "params": [] }], "day", [{ "type": "bool", "value": false }]] },
  { "type": "op", "op": ">=" },
  { "type": "num", "value": "0" }
]
```

Screenshot evidence confirms Custom validation is a control-level Validation section entry point. Use this for conditional or cross-field validation only; keep simple required validation in native properties.

## Lookup And Data Filters

For lookup filters, preserve the wrapper shape from the target lookup/filter property and validate the expression token array inside it.

Example: only active records:

```json
[
  { "exprType": "variable", "valueType": "boolean", "id": "Active", "type": "expr", "name": "Workflow Variables:Active" },
  { "type": "op", "op": "==" },
  { "type": "bool", "value": true }
]
```

Lookup/data filter screenshots show condition-builder rows with field, operator, value, expression-toggle, delete, and drag controls. The nested expression token model is reusable, but the outer condition row object should be copied from an export-backed lookup/filter pattern.

## Workflow Transition Conditions

Use expression tokens for generated conditional routing only with the export-backed workflow transition operand wrapper. `Implant Application Request (4).ywf` proves each transition condition row can put either side in expression-editor mode with `type: 2`.

Example: route to Finance when total amount is at least 5000:

```json
[
  { "exprType": "variable", "valueType": "number", "id": "TotalAmount", "type": "expr", "name": "Workflow Variables:Total Amount" },
  { "type": "op", "op": ">=" },
  { "type": "num", "value": "5000" }
]
```

Workflow screenshots show transition conditions are configured on selected sequence/transition arrows. Generated workflow conditions must remain Yeeflow expression tokens and must not use raw JavaScript.

Pattern choices:

- Direct variable/field left + static option right: use `left.type = 1`, `right.type = 0`.
- Direct variable/field left + expression right: use `left.type = 1`, `right.type = 2`.
- Expression left + static/date/option right: use `left.type = 2`, `right.type = 0`.
- Expression left + expression right: use `left.type = 2`, `right.type = 2`.

Keep the `dateDiff(..., "year", [])` raw date-unit rule inside transition expression operands; do not wrap the date unit as a string token array.

## String Formatting

Use `concat` or `&` for generated request numbers and display text. Use `formatNumber` for currency-like display strings and `dateFormat` for date labels.

Common recipes:

- request number: prefix + `dateFormat(now(), "YYYYMMDD")` + `UniqueID()`
- normalized text: `upper(trim(value))`
- cleanup: `replace(value, " ", "-", 1)` when all spaces should be replaced

Runtime caution from `Expression Runtime Test v1`: a request-number expression recipe is not automatically a valid `SetVariableTask` value. Serializing the token array into a text variable caused Yeeflow to display the raw JSON. Until a working export proves the SetVariable expression assignment wrapper, use the proven FlowNo expression-button pattern for workflow-generated request numbers.

## Runtime-Proven v1 Contexts

`Expression Runtime Test v1 Patch` proved these contexts together in Yeeflow:

- calculated control: `Quantity * Unit Price`
- dynamic display: show High Value Reason when Total Amount is greater than 10000
- lookup data filter: Active products only
- lookup addition/autofill into readable summary variables
- FlowNo request number generation
- simple Finance Review task
- ContentList persistence of readable request values

Workflow transition branching by numeric expression remains deferred because the first isolation package did not route as expected. Treat workflow branch conditions as export-wrapper-sensitive.

## User/Profile Expressions

`Expression Runtime Test v1 Patch.yap` and the generated `Expression User Profile Test v1` package prove a focused user/profile expression family in approval forms:

- `getUserAttr(Context:Current User, Name, N/A)` and related current-user attributes render on submission and task pages.
- `getOrgAttr(getUserAttr(Context:Current User, Department, N/A), Name, N/A)` renders the current user's department name.
- Nested `getOrgAttr(..., Parent, ...)` can render the parent department name when tenant organization data exists.
- `getUserAttr(getUserAttr(Context:Current User, Line Manager, N/A), Name, N/A)` can render line manager display text.
- `getLocAttr(getUserAttr(Context:Current User, Location, N/A), Name, N/A)` is valid but environment-dependent when the tenant user has no location value.
- `dateFormat(getUserAttr(Context:Current User, Created Time, N/A), "MMM DD, YYYY")` rendered a formatted current-user Created Time.
- `dateFormat(dateAdd(getUserAttr(Context:Current User, Boarding Date, N/A), "year", 1), "MMM DD, YYYY")` rendered with the generated nested shape, but in the tested tenant the Boarding Date value itself was blank, so treat populated boarding-date arithmetic as data-dependent until tested with a profile that has that attribute.

Generation notes:

- Preserve exact function name `getOrgAttr`; do not generate `getDeptAttr` from the user-facing label.
- Attribute parameters are direct descriptor objects with `key` and `label`, not plain string literals and not one-item expression arrays. The export-backed Set variables fix in `Employee Family Implant v1 Core Patch 20260516` failed with wrapped profile descriptors and worked with a direct descriptor object.
- Context current-user tokens are application tokens, not workflow variable tokens.
- Use fallback arrays such as `[{ "type": "str", "value": "N/A" }]` for optional tenant profile fields.
- Persist readable profile summary values through variables and ContentList only after render proof; do not persist object-shaped profile values directly to text fields.

## List/Sublist Summaries

Use `arraySum`, `arrayCount`, `arrayAverage`, `arrayMin`, and `arrayMax` for list/sublist summary formulas when the list variable and column names are resolved.

For nested objects, use `getAttr(object, "path.to.value", defaultValue)` only after object-shaped values are proven in the target export. For duplicate cleanup, use `removeDuplicates(arrayValue)` only after the array variable is resolved.

## Sub List Current Object And Bound Summaries

The updated `Approval Form Controls Test v6` export proves the native list summary pattern for approval forms.

Use it when an approval form has line items and each row needs a calculated value:

- Row fields: Product, Quantity, Unit Price, Sub Total, Line Note
- Row expression: `Current object:Quantity * Current object:Unit Price`
- Quantity summary: `field = LineQuantity`, `type = total`
- Unit price summary: `field = LineUnitPrice`, `type = avg`
- Total amount summary: `field = LineSubTotal`, `type = total`, bound to `TotalAmount`

Generation notes:

- Current row values use `exprType: "variable_ctx"` and `ctx` equal to the parent list variable id.
- Summary values live in the parent list control `attrs["list-fields-summary"]`.
- Bind summary values to top-level workflow variables when they need to drive display, validation, ContentList persistence, or workflow routing.
- Prefer list summary binding for totals instead of manually recalculating line items with a top-level formula.
- Persist a readable line item summary plus numeric total fields until direct row-to-child-list persistence is separately proven.

Workflow branch example:

- `TotalAmount > 5000` routes to department manager approval.
- `TotalAmount <= 5000` routes to line manager approval.

Use the export-backed workflow `conditioninfo` wrapper with numeric operators such as `n.>` and `n.<=`.

## Query Data Form Action Results

The manually updated `Form Actions Phase 1 Test v1 Runtime.yap` export proves query-result expressions in form actions.

Use cases:

- Load multiple data-list records into a form list variable.
- Load one source record into workflow variables.
- Store a query result count in a temp variable for display.
- Store selected query fields in a temp collection variable for aggregation.
- Use `arraySum` to total a numeric selected field in the temp collection.
- Use `JSONStringfy` to display/debug the temp collection.

Safe aggregate recipe:

```json
[
  {
    "type": "func",
    "func": "arraySum",
    "params": [
      [{ "exprType": "variable", "valueType": "string", "id": "__temp_var_CollectionofQueryItems", "type": "expr", "name": "var_CollectionofQueryItems" }],
      [{ "type": "str", "value": "Amount" }],
      [],
      []
    ]
  }
]
```

Generation notes:

- Select the source fields explicitly in the preceding `querydata` step.
- Use the selected field display/key, such as `"Amount"`, as the `arraySum` column parameter.
- Store the aggregate in a workflow number variable when it must be submitted, persisted, or used by workflow.
- Do not use `arraySub`.
- Do not generate `vLookup` yet; the function label was observed, but the function token was not present in the export.
