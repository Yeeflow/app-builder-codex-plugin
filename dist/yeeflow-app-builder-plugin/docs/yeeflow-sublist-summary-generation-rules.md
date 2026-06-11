# Yeeflow Sublist Summary Generation Rules

Use these rules when generating approval-form `list` / `listref` controls with calculated row fields and summary values.

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
- `attrs.list_field: true`
- `attrs.list_field_binding`: top-level list variable id
- `attrs.list_control_id`: parent list control id

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

Rules:

- Numeric summaries should bind to `number` variables.
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
