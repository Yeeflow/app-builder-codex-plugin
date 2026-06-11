# Generated Expression Sublist Summary Workflow Test v1 Baseline

Date: 2026-05-15

Branch: `feature/expression-sublist-summary-workflow`

Generated package:

- `Expression Sublist Summary Workflow Test v1.generated.yap`
- Runtime-test copy: `<downloads>/Expression Sublist Summary Workflow Test v1.generated.yap`

## Goal

Prove generated support for advanced approval-form sub list/listref behavior:

- current-object expression tokens inside sub list rows
- row-level calculated `Sub Total`
- list summary display for quantity sum, unit price average, and subtotal sum
- summary binding from `Sub Total (Sum)` to top-level `TotalAmount`
- workflow branch conditions using summary-bound numeric variables
- branch-specific `ContentList` persistence

## Generated Resources

- App: `Expression Sublist Summary Workflow Test v1`
- Data list: `Sublist Summary Workflow Requests`
- Approval form: `Expression Sublist Summary Workflow Test v1`
- Approval pages:
  - `Submit Purchase Line Items`
  - `Reviewer Approval`
  - `Department Manager Approval`
  - `Line Manager Approval`
- Workflow:
  - Start
  - Reviewer Approval
  - InclusiveGateway
  - `TotalAmount > 5000` -> Department Manager Approval
  - `TotalAmount <= 5000` -> Line Manager Approval
  - branch-specific ContentList persistence nodes
  - End / EndReject

## Expression Patterns Proven

Sub list row calculation uses `variable_ctx` tokens:

```json
[
  { "exprType": "variable_ctx", "valueType": "number", "id": "LineQuantity", "ctx": "LineItems", "type": "expr", "name": "Current object:Quantity" },
  { "type": "op", "op": "*" },
  { "exprType": "variable_ctx", "valueType": "number", "id": "LineUnitPrice", "ctx": "LineItems", "type": "expr", "name": "Current object:Unit Price" }
]
```

Sub list summaries are configured on `attrs["list-fields-summary"]`; numeric summary binding uses:

```json
{
  "prefix": "__variables_",
  "value": "TotalAmount"
}
```

Workflow branch conditions use numeric `conditioninfo` wrappers with `n.>` and `n.<=` operators and numeric literal token arrays.

## Validation Results

Local checks passed:

- `node --check generate-expression-sublist-summary-workflow-test-v1.mjs`
- `node --check yeeflow-expression-utils.js`
- `node --check validate-ywf-def.js`
- `node --check scripts/smoke-expression-validation.mjs`
- `node scripts/smoke-expression-validation.mjs`
- `node validate-yap-package.js expression-sublist-summary-workflow-test-v1-app-def.json --mode generator --stage final`
- `node validate-yap-graph.js expression-sublist-summary-workflow-test-v1-app-def.json --mode generator --stage final`
- `node validate-ywf-def.js expression-sublist-summary-workflow-test-v1-approval-form-def.json --mode final`
- `node validate-ydl-list.js expression-sublist-summary-workflow-test-v1-request-list-def.json --mode generator --stage final`
- `node workflow-action-config-validator.js expression-sublist-summary-workflow-test-v1-app-def.json`
- `node build-yap-wrapper.js expression-sublist-summary-workflow-test-v1-app-def.json "Expression Sublist Summary Workflow Test v1.generated.yap" --title "Expression Sublist Summary Workflow Test v1" --description "Sublist summary workflow runtime proof package" --validation-mode generator`

Package, graph, form, list, workflow action, expression smoke, and wrapper round-trip checks passed. Remaining warnings are expected generator-stage warnings for flex-grid schema classification, identity-picker environment sensitivity, and token-like hex strings.

## Runtime Result

Runtime status: passed.

Runtime site: `https://<yourdomain>.yeeflow.com/`

Verified:

- App imported.
- App opened.
- Target data list opened without `datas/query` 400.
- Approval form opened.
- Added line items.
- Row-level `Sub Total = Quantity * Unit Price` calculated.
- Quantity Sum displayed.
- Unit Price Average displayed.
- Sub Total Sum displayed.
- `TotalAmount` received the Sub Total Sum value.
- Low branch test:
  - Line totals: `2` and `15`
  - Total Amount: `USD 17.00`
  - Routed to `Line Manager Approval`
  - Approval completed
  - ContentList record persisted with `Workflow Route = Line Manager Approval`
- High branch test:
  - Line total: `6000`
  - Total Amount: `USD 6000.00`
  - Routed to `Department Manager Approval`
  - Approval completed
  - ContentList record persisted with `Workflow Route = Department Manager Approval`

Target list persistence verified:

| Request Title | Total Amount | Workflow Route | Approval Status | Created From Workflow |
| --- | ---: | --- | --- | --- |
| High branch subtotal summary test | USD 6000.00 | Department Manager Approval | Approved | ON |
| Low branch subtotal summary test | USD 17.00 | Line Manager Approval | Approved | ON |

## Runtime Notes

- Summary recalculation is runtime event-driven. During manual entry, a summary value may update only after the edited row field loses focus or the row value is otherwise committed.
- The generated workflow uses branch-specific ContentList nodes to persist `Workflow Route`, avoiding unproven SetVariable expression assignment for this baseline.
- Direct child-row-to-data-list persistence remains deferred; this baseline persists readable summary fields and a line-items text summary.

## Generator Status

Promote as runtime-proven for generated approval apps:

- `variable_ctx` current-object row expressions
- row-level calculated sub list fields
- `total` and `avg` sub list summaries
- summary-to-variable binding via `__variables_`
- summary-bound numeric workflow branch conditions
- branch-specific ContentList persistence after summary-based routing
