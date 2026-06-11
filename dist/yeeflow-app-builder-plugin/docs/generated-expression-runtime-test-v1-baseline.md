# Generated Expression Runtime Test v1 Baseline

## Summary

`Expression Runtime Test v1` is the first generated Yeeflow app package dedicated to expression runtime proof.

The runtime-tested import was renamed in Yeeflow to `Expression Runtime Test v1 Patch` to avoid a duplicate app-name conflict from the first isolation import.

Generated package:

- `<downloads>/Expression Runtime Test v1.generated.yap`

Generator and generated decoded outputs:

- `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/generate-expression-runtime-test-v1.mjs`
- `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/expression-runtime-test-v1-app-def.json`
- `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/expression-runtime-test-v1-approval-form-def.json`
- `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/expression-runtime-test-v1-products-list-def.json`
- `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/expression-runtime-test-v1-request-list-def.json`
- `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates/expression-runtime-test-v1-generation-report.json`

## Resources

- App shell: one root app with dashboard-style overview page.
- Source list: `Reference Products`
- Target list: `Expression Test Requests`
- Approval form: `Expression Runtime Test v1`
- Workflow: request submission, set request number, Finance Review, ContentList persistence, end event.

The final patched package uses ID family `462` and form key `ERT1B`.

## Runtime Result

Runtime status: passed for the patched v1 package.

Verified in `https://<yourdomain>.yeeflow.com/`:

- app imported successfully
- app opened successfully
- `Reference Products` opened without `datas/query` 400
- `Expression Test Requests` opened without `datas/query` 400
- source sample records loaded, including active and inactive products
- approval form opened
- lookup filter showed only active products: `Standard Laptop` and `Docking Station`; inactive `Retired Monitor` was hidden
- lookup selection worked
- lookup addition/autofill populated readable values:
  - Product Name
  - Product Code
  - Unit Price
- calculated control updated `Subtotal = Quantity * Unit Price`
- dynamic display rule showed `High Value Reason` when Total Amount was greater than 10000
- future Required Date value submitted successfully
- request number generated as a readable Yeeflow flow number rather than raw JSON
- Finance Review task opened
- Finance Review approval completed
- workflow completed
- ContentList created a persisted target record with readable values:
  - Request No
  - Product Name
  - Quantity
  - Approval Status
  - Created From Workflow

Observed persisted target row:

- Request No: `20550891502681579672026051500001`
- Product Name: `Standard Laptop`
- Quantity: `2.00`
- Approval Status: `Approved`
- Created From Workflow: `ON`

## Expression Contexts Proven

### Calculated Control

Runtime-proven:

- `Subtotal = Quantity * Unit Price`
- Generated as Yeeflow expression token array on a calculated control.

### Dynamic Display Rule

Runtime-proven:

- `High Value Reason` appears when `Total Amount > 10000`.

### Lookup Filter Condition

Runtime-proven:

- Product lookup filters packaged source list records to `Active == true`.
- Inactive source record remained visible in the source list but was hidden from the lookup dropdown.

### Request Number

Runtime-proven:

- Request number generation using the proven Yeeflow FlowNo expression-button pattern.

Not runtime-proven:

- assigning raw expression token JSON directly into a `SetVariableTask` text value.

### ContentList Persistence

Runtime-proven:

- ContentList persisted readable lookup/autofill values and workflow summary values to the target request list after approval.

## First Isolation Findings

The first generated import used raw expression token JSON for request-number generation in a `SetVariableTask`. Runtime displayed the JSON token array literally instead of evaluating it.

Rule learned:

- Do not set a text variable to `JSON.stringify(expressionTokens)` in `SetVariableTask`.
- Use the proven FlowNo expression-button pattern for request numbers until an export-backed SetVariable expression-token pattern is available.

The first generated import also attempted a numeric workflow branch condition. Runtime routed to the normal reviewer path instead of the intended Finance path and later errored after approval.

Rule learned:

- Local expression-token validation is not runtime proof for workflow transition wrappers.
- Numeric workflow branch conditions need a separate export-backed workflow-condition learning pass.
- For generated runtime baselines, keep workflow routing simple unless the exact transition condition wrapper has been studied from a working export.

## Deferred Items

- Negative custom validation path for past Required Date values was not exercised in this pass.
- Conditional workflow branching by `Total Amount >= 5000` remains deferred.
- Request-number generation using `concat(dateFormat(now()), UniqueID())` remains a token recipe, not a runtime-proven `SetVariableTask` assignment shape.

## Validation

Local validation passed before runtime import:

- `node --check generate-expression-runtime-test-v1.mjs`
- `node scripts/smoke-expression-validation.mjs`
- `node validate-yap-package.js expression-runtime-test-v1-app-def.json --mode generator --stage final`
- `node validate-yap-graph.js expression-runtime-test-v1-app-def.json --mode generator --stage final`
- `node validate-ywf-def.js expression-runtime-test-v1-approval-form-def.json --mode final`
- `node validate-ydl-list.js expression-runtime-test-v1-products-list-def.json --mode generator --stage final`
- `node validate-ydl-list.js expression-runtime-test-v1-request-list-def.json --mode generator --stage final`
- `node workflow-action-config-validator.js expression-runtime-test-v1-app-def.json`
- `node build-yap-wrapper.js expression-runtime-test-v1-app-def.json "Expression Runtime Test v1.generated.yap" --title "Expression Runtime Test v1" --description "Expression runtime proof package"`

Warnings were reviewed and accepted for known schema-supported controls such as `flex_grid`, requester identity display, and calculated control classification.

## Generator Rules Confirmed

- Preserve the source list and target list native Title field metadata.
- Use readable lookup summary/autofill variables for user-facing persistence.
- Keep lookup source records packaged in the same `.yap` when testing lookup filters.
- Include internal source sample IDs in `ReplaceIds`.
- Validate expression token arrays locally, but document runtime status separately for each expression context.
- Prefer a simple workflow path until transition condition wrappers are export-backed.
