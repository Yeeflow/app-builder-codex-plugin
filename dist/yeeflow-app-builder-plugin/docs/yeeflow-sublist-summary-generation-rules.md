# Yeeflow Sublist Summary Generation Rules

Use these rules when generating Approval Form or Data List Form `list` controls with calculated row fields and summary values.

Data List distinction: persisted Data List Sub list fields store their row schema in stringified field `Rules["list-variables"]`, and custom Data List forms rebuild `attrs.list-variables/list-fields` from that schema. Their nested column controls require `control.label`, but the official Data List export does not require Approval Form's fixed-title `label_var: null`. See `docs/standards/data-list-form-field-layouts-v1.1-standard.md`.

Source evidence:

- `Approval Form Controls Test v6.yap` export-back study
- `docs/approval-form-sublist-summary-expression-study.md`
- `Expression Sublist Summary Workflow Test v1` generated runtime baseline

## Listref Structure

Every generated sub list must define the row schema in `variables.listref[]`:

```json
{
  "id": "listref-line-items",
  "name": "LineItems",
  "idx": "listref-line-items-idx",
  "fields": [
    { "id": "LineProduct", "name": "Product", "type": "text", "editable": true },
    { "id": "LineQuantity", "name": "Quantity", "type": "number", "editable": true },
    { "id": "LineUnitPrice", "name": "Unit Price", "type": "number", "editable": true },
    { "id": "LineSubTotal", "name": "Sub Total", "type": "number", "editable": true }
  ]
}
```

The top-level form variable for the list uses `type: "list"` and `value` equal to the listref id.

## Row Field Controls

Each row field rendered by the list control lives in `attrs["list-fields"][]`. Each field must have a child `control` object with:

- `binding`: row field id
- `label`: non-empty business-facing table column title
- `label_var: null` when the title is fixed text
- `attrs.list_field: true`
- `attrs.list_field_binding`: top-level list variable id
- `attrs.list_control_id`: parent list control id

`list-fields[].name` is row-field metadata and does not render the table header by itself. The Designer Title setting for a Sub List column serializes to `list-fields[].control.label`; `displayLabel` only controls visibility and cannot replace a missing label. Submission, Task, and Print pages must preserve the same column-title contract, including readonly mirrors.

For calculated row fields, use a `calculated` control and store the expression at `control.attrs.calculated`.

## Current Object Expressions

Use `exprType: "variable_ctx"` to reference the current row object:

```json
{
  "exprType": "variable_ctx",
  "valueType": "number",
  "id": "LineQuantity",
  "ctx": "LineItems",
  "type": "expr",
  "name": "Current object:Quantity"
}
```

`ctx` is the list variable id, not the listref id.

Subtotal formula:

```json
[
  { "exprType": "variable_ctx", "valueType": "number", "id": "LineQuantity", "ctx": "LineItems", "type": "expr", "name": "Current object:Quantity" },
  { "type": "op", "op": "*" },
  { "exprType": "variable_ctx", "valueType": "number", "id": "LineUnitPrice", "ctx": "LineItems", "type": "expr", "name": "Current object:Unit Price" }
]
```

## Summary Configuration

Put summaries on the parent list control:

```json
"list-fields-summary": [
  {
    "id": "summary-quantity-total",
    "field": "LineQuantity",
    "type": "total",
    "display": true,
    "binding": null
  },
  {
    "id": "summary-subtotal-total",
    "field": "LineSubTotal",
    "type": "total",
    "display": true,
    "binding": {
      "prefix": "__variables_",
      "value": "TotalAmount"
    }
  }
]
```

Export-backed summary types:

- `total` for number fields
- `avg` for number fields

Designer-known but not fully export-backed in the current study:

- number: Max, Min, Concat
- text: Concat

Use warning-first validation for non-export-backed summary types until a focused export proves them.

## Summary-To-Variable Binding

When a summary must drive other logic, bind it to a top-level form variable:

```json
{
  "id": "TotalAmount",
  "name": "Total Amount",
  "type": "number",
  "editable": true
}
```

Summary binding:

```json
{
  "prefix": "__variables_",
  "value": "TotalAmount"
}
```

Surface-specific binding prefixes:

- Approval Form persisted/business variable: `__variables_`
- Approval Form page temporary variable: `__temp_` and a matching `variables.tempVars[]` entry
- Data List current-record field: `__list_` and a matching host list field
- Data List page temporary variable: `__temp_` and a matching form-resource `tempVars[]` entry

Do not use `__variables_` on Data List forms or `__list_` on Approval Forms. Summary binding is optional when the value only needs to be displayed in the Sub List footer.

Rules:

- Numeric summaries should bind to `number` variables.
- Data List persisted summary targets must be numeric fields such as `Decimal*`.
- Use readable names such as `TotalAmount`, `TotalQuantity`, and `AverageUnitPrice`.
- Use summary-bound variables for dynamic display, custom validation, ContentList persistence, and workflow routing.
- Do not manually recalculate list totals with top-level expressions when list summary binding is available.

## Workflow Routing With Summary Variables

Use numeric `conditioninfo` wrappers:

```json
{
  "pre": "and",
  "left": {
    "type": 1,
    "value": {
      "exprType": "variable",
      "valueType": "number",
      "id": "TotalAmount",
      "type": "expr"
    }
  },
  "op": "n.>",
  "right": {
    "type": 2,
    "value": [{ "type": "num", "value": "5000" }]
  },
  "group": "number"
}
```

Use `n.>` and `n.<=` for high/normal branch pairs.

Runtime proof: `Expression Sublist Summary Workflow Test v1` successfully routed `USD 6000.00` to Department Manager Approval with `TotalAmount > 5000`, and `USD 17.00` to Line Manager Approval with `TotalAmount <= 5000`.

## Persistence

For Phase 1, persist summary values, not raw line rows:

- `TotalAmount` to a Decimal field
- `TotalQuantity` to a Decimal field if bound
- `AverageUnitPrice` to a Decimal field if bound
- `LineItemsSummary` to a Text field

Direct child-row-to-data-list persistence remains deferred until a focused export/runtime proof exists.

For generated v1 packages, branch-specific ContentList nodes are an acceptable way to persist readable workflow route labels after a summary-based branch. Avoid SetVariable assignment for route labels until its expression/value wrapper is export-backed for the target use.

## Validation Checklist

Before building a package:

- The list variable points to an existing `variables.listref[]`.
- Every rendered row field exists in the listref.
- Calculated row expressions validate as expression token arrays.
- Every `variable_ctx` token references an existing row field in the same list variable context.
- Summary source fields exist.
- Numeric summaries bind to number variables.
- Workflow numeric conditions reference existing number variables.
- Numeric condition right-hand thresholds are numeric literals or numeric expression tokens.
- Runtime tests blur or tab out of edited row cells before asserting summary values, because summary recalculation is event-driven.
