# Approval Form Sublist Summary Expression Study

Source export: `<downloads>/Approval Form Controls Test v6.yap`

Date studied: 2026-05-15

Scope: approval form and workflow only. The uploaded export was decoded read-only and the original `.yap` was not modified.

## What Changed In The Export

The updated `Approval Form Controls Test v6` form extends the prior lookup/list proof with advanced listref behavior:

- `Line Items` remains a workflow form `list` control bound to the `LineItems` variable.
- The listref now includes a new number row field: `LineSubTotal` / `Sub Total`.
- The submit-page `Line Items` control renders `LineSubTotal` as a row-level `calculated` control.
- The row calculation uses current object/current row expression tokens.
- The submit-page `Line Items` control has summary configuration for quantity sum, unit price average, and subtotal sum.
- `Sub Total (Sum)` binds to a form-level number variable named `TotalAmount`.
- Workflow sequence conditions read `TotalAmount` as a number variable and branch at `5000`.

The review/task page in the studied export does not render the `LineSubTotal` row field, but the listref still contains the field. This is treated as an allowed readonly-task-page omission when the submit page owns calculation and summary display.

## Current Object Expression Pattern

Current row values inside a sub list expression are represented with `exprType: "variable_ctx"`:

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

Key rules:

- `ctx` is the parent list variable id, not the listref id.
- `id` is the row field id from `variables.listref[].fields[]`.
- `name` uses designer text such as `Current object:Quantity`.
- `valueType` must match the row field type. Number row fields use `number`.
- Row-level expressions differ from normal workflow variables because they use `exprType: "variable_ctx"` instead of `exprType: "variable"`.

Export-backed subtotal expression:

```json
[
  {
    "exprType": "variable_ctx",
    "valueType": "number",
    "id": "LineQuantity",
    "ctx": "LineItems",
    "type": "expr",
    "name": "Current object:Quantity"
  },
  { "type": "op", "op": "*" },
  {
    "exprType": "variable_ctx",
    "valueType": "number",
    "id": "LineUnitPrice",
    "ctx": "LineItems",
    "type": "expr",
    "name": "Current object:Unit Price"
  }
]
```

Generator rule: use row field ids and list variable id directly. Do not use display names as ids, and do not use top-level workflow variable tokens for row calculations.

## Sub List Calculated Field Pattern

`Sub Total` is defined in both places:

- `variables.listref[].fields[]` contains `{ id: "LineSubTotal", name: "Sub Total", type: "number" }`.
- The submit-page list control `attrs["list-fields"][]` contains a row field whose `control.type` is `calculated`.

Observed calculated row control shape:

```json
{
  "id": "08cfcf01-6db6-4ecd-9e05-871528d3cf1d",
  "label": "Sub Total",
  "binding": "LineSubTotal",
  "displayLabel": [null, true],
  "type": "calculated",
  "attrs": {
    "list_field": true,
    "list_field_binding": "LineItems",
    "list_control_id": "2054943200723742745-control-LineItems-submit",
    "calculated": []
  },
  "value": ""
}
```

Required attrs:

- `list_field: true`
- `list_field_binding`: parent list variable id
- `list_control_id`: parent list control id on the current page
- `calculated`: expression token array

Generation rule: a calculated sub list field should be readonly/display-oriented even if the row field itself is listed as editable in `variables.listref`. The runtime treats the calculation as derived from row inputs.

## Summary Configuration Pattern

Summary settings live on the parent list control:

```json
"list-fields-summary": [
  {
    "id": "92f63858-b44e-4381-b842-8b4170627d6a",
    "field": "LineQuantity",
    "type": "total",
    "display": true,
    "binding": null
  },
  {
    "id": "61cc95aa-214d-40b9-864a-0f5c2fae55b7",
    "field": "LineSubTotal",
    "type": "total",
    "display": true,
    "binding": {
      "prefix": "__variables_",
      "value": "TotalAmount"
    }
  },
  {
    "id": "a09b358f-1b38-46c5-b007-ad13a7d0b5eb",
    "field": "LineUnitPrice",
    "type": "avg",
    "display": true,
    "binding": null
  }
]
```

Observed summary type values:

- `total`: displayed as `Sum`
- `avg`: displayed as `Average`

UI-known but not fully export-proven in this file:

- number fields can also offer Max, Min, and Concat in the designer.
- text fields can offer Concat.

Binding rule:

- `binding.prefix` is `__variables_`.
- `binding.value` is the target top-level workflow variable id.
- The target variable should be type `number` for numeric summaries.

## Total Amount Binding Pattern

The form-level variable is:

```json
{
  "id": "TotalAmount",
  "name": "Total Amount",
  "type": "number",
  "editable": true
}
```

The submit page displays it as a readonly `input_number`:

```json
{
  "type": "input_number",
  "label": "Total Amount",
  "binding": "TotalAmount",
  "attrs": { "displayThousandths": "1" },
  "readonly": true
}
```

Runtime screenshot evidence showed:

- row totals `2` and `15`
- `Sub Total` summary `Sum: 17.00`
- `Total Amount` displayed as `17.00`

Generation rule: use the list summary binding to set `TotalAmount` for normal summary display and simple downstream reads.

For policy-critical form actions such as quota checks, submit guards, routing thresholds, or persistence that must run immediately after row edits, add an explicit preflight set-variable step that recalculates the same total with `arraySum(<ListVariableId>, "<SubtotalFieldId>", [], [])`. A later Employee & Family Implant runtime test showed the visible sublist sum updating while the separate top-level bound variable was not committed in time for a quota action. The safe pattern is therefore: keep the export-backed summary binding, but recalculate the top-level total in the action before using it for policy decisions.

## Workflow Numeric Condition Pattern

The workflow uses an `InclusiveGateway` after reviewer approval and two numeric sequence conditions:

High value branch:

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

Normal value branch:

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
  "op": "n.<=",
  "right": {
    "type": 2,
    "value": [{ "type": "num", "value": "5000" }]
  },
  "group": "number"
}
```

Important differences from normal expression token arrays:

- Workflow condition wrappers use `conditioninfo[]`.
- Numeric operators are prefixed with `n.`.
- The right-hand numeric literal is stored as an expression token array inside `right.value`.
- The left variable token omits `name` in this export and is still accepted by the designer/runtime wrapper.

Generator rule: for workflow branches based on numeric totals, use the exact `conditioninfo` wrapper shape above and make sure the referenced variable exists and is type `number`.

## Validator Updates

This study promoted warning/error checks for:

- sub list calculated fields with missing or invalid expressions
- `variable_ctx` row expressions that reference missing row fields
- list summary source fields that do not exist
- summary type/field type mismatch
- summary binding target variable missing or non-number for numeric summaries
- workflow numeric right-hand values stored as Yeeflow numeric expression token arrays

The readonly task-page omission of a listref field is warning-level when the submit page contains the calculated/summary field.

## Generator Rules

- Add calculated row fields to `variables.listref[].fields[]`.
- Render calculated row fields on submit pages with `control.type: "calculated"`.
- Use `exprType: "variable_ctx"` for row field references.
- Put summary configuration on the parent list control in `attrs["list-fields-summary"]`.
- Bind numeric summaries to form-level `number` variables.
- Export-backed summary binding for a top-level workflow/form variable is the compact object `{ "prefix": "__variables_", "value": "<VariableId>" }`; do not add name/label/type metadata unless a future export serializes it.
- Display bound summaries through readonly number controls when users need to see the value.
- Use summary-bound variables in workflow numeric `conditioninfo` instead of recalculating line item totals.
- Keep Text controls on the learned standard and inline by default.
- Keep page background on page/form attrs, not on `Main`.

## Known Gaps

- This export proves `total` and `avg` summary configuration. Max, Min, and Concat are UI-known from designer notes but not all are present in the decoded payload.
- Direct line-item child-row persistence to a data list remains deferred.
- InclusiveGateway branch behavior is now generated-package runtime-proven in `Expression Sublist Summary Workflow Test v1` for both `TotalAmount > 5000` and `TotalAmount <= 5000` branches.
- Summary recalculation is event-driven in the runtime UI. During manual entry, summary values may update after the row input blurs or another row value is committed; generated runtime tests should tab/blur out of edited cells before asserting summary values.
- `Employee & Family Implant Application Management_Test.yap` confirmed that a manually reselected Product Selection subtotal binding still exports as `{ "prefix": "__variables_", "value": "TotalApplicationAmount" }`. If runtime does not update a summary-bound variable, inspect row commit/blur timing, source row field type, rendered submit-page control wiring, downstream action timing, and import-time FlowKey replacement before inventing unsupported binding metadata.
- `Implant Application Request (1).ywf` proved one import-time corruption case: generated FlowKey `EFI` was replaced inside the property name `prefix`, producing `pr2055672796649762823x`; the designer-created comparison sublist used the same summary settings but kept `prefix` and worked. Generator-safe rule: avoid FlowKeys/form keys that are substrings of reserved JSON property names such as `prefix`, and add a focused inspection for corrupted summary binding keys before packaging/runtime test.
