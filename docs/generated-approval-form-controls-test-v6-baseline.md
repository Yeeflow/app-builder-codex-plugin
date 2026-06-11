# Generated Approval Form Controls Test v6 Baseline

Date: 2026-05-14

Package: `Approval Form Controls Test v6.generated.yap`

Purpose: prove generated approval-form lookup and list/listref controls using internal packaged Yeeflow data lists.

## Scope

Included:

- `Reference Products` source data list with sample records.
- `Lookup List Test Requests` target persistence list.
- `Approval Form Controls Test v6` approval form.
- Internal single-select lookup control bound to `Reference Products`.
- Lookup additional-field/autofill mappings for product code, category, and unit price.
- List/listref line item table with product, quantity, unit price, and line note.
- Simple reviewer approval workflow.
- `ContentList` persistence into the target list.

Deferred:

- `lookup-list`
- embedded `data-list` display
- direct child-row-to-data-list persistence
- metadata, multi-metadata, and tag controls

## Local Validation

Commands passed:

- `node --check generate-approval-form-controls-test-v6-lookup-list.mjs`
- `node --check validate-yap-package.js`
- `node --check validate-yap-graph.js`
- `node --check validate-ywf-def.js`
- `node --check validate-ydl-list.js`
- `node --check workflow-action-config-validator.js`
- `node validate-yap-package.js approval-form-controls-test-v6-app-def.json --mode generator --stage final`
- `node validate-yap-graph.js approval-form-controls-test-v6-app-def.json --mode generator --stage final`
- `node validate-ywf-def.js approval-form-controls-test-v6-approval-form-def.json --mode final`
- `node validate-ydl-list.js approval-form-controls-test-v6-products-list-def.json --mode generator --stage final`
- `node validate-ydl-list.js approval-form-controls-test-v6-request-list-def.json --mode generator --stage final`
- `node build-yap-wrapper.js approval-form-controls-test-v6-app-def.json "Approval Form Controls Test v6.generated.yap" --title "Approval Form Controls Test v6" --description "Lookup and list control runtime proof package" --validation-mode generator`

Known warnings:

- `flex_grid` remains schema-supported but locally unclassified by the validator.
- Standalone extracted list defs warn about missing wrapper `ListSetID`.
- Identity-picker current-user usage is environment-dependent but already proven in earlier stages.
- Resolved token hex warnings are accepted for generated IDs.

## Runtime Result

Status: passed.

Runtime URL after import:

- App/listset: `https://<yourdomain>.yeeflow.com#/list-set/<workspace-id>/<listset-id>/<list-id>`
- Target list: `https://<yourdomain>.yeeflow.com#/list-set/<workspace-id>/<listset-id>/<list-id>`

Verified:

- App imported successfully.
- App opened.
- `Reference Products` opened and loaded sample rows.
- `Lookup List Test Requests` opened without `datas/query` 400.
- Approval form opened.
- Lookup dropdown opened and showed packaged products.
- Selected `Standard Laptop`.
- Lookup display value appeared on the form.
- Additional mappings populated:
  - Product Code: `LAP-STD`
  - Product Category: `Hardware`
  - Unit Price: `USD 1,250.00`
- List/listref row rendered.
- Added and edited one line item row:
  - Product: `Standard Laptop`
  - Quantity: `2`
  - Unit Price: `1,250.00`
  - Line Note: `Runtime sublist row`
- Submitted successfully.
- Submitted request detail displayed lookup and list row values.
- Reviewer task opened and displayed lookup and list row values.
- Approval completed successfully.
- `ContentList` created a target row.

## Generator Rules Learned

Use a packaged internal lookup when the source list is included in the same `.yap`.

For lookup display and derived values:

- set the lookup source to the packaged source list
- use the source display field for the picker label
- use `attrs.addition[]` to populate readonly workflow variables for additional fields
- validate every source and target field before wrapper build

Persistence rule:

- Do not map a raw lookup variable to a plain text field when the expected value is the display name.
- In this runtime test, direct lookup-to-text persistence stored the internal local row ID (`2054943200723742740`).
- Persist readable values through addition/autofill variables or explicit summary variables.
- Direct raw lookup persistence is acceptable only when storing the local row ID is intended or the target field is proven lookup-compatible.

List/listref rule:

- A generated list/listref control can render a table, add a row, edit child values, submit, display values on reviewer task, and complete approval.
- Direct child-row-to-data-list persistence is not proven by this baseline.
- For now, persist a text summary through `ContentList` when durable row storage is needed.

## Coverage Update

Promoted:

- `lookup`: proven for internal packaged single-select lookup with addition mappings.
- `list` / `listref`: proven for workflow-form table render/add/edit/review/approval, with text-summary persistence.

Deferred:

- `lookup-list`
- embedded `data-list` display
- metadata / multi-metadata / tag
