# Generated `.yap` Baseline: Heep Hong IT eWorkflow Option A v8

This document records the Heep Hong IT eWorkflow Option A diagnostic baseline that fixed the data-list grid query failure.

## Working Package

```text
heep-hong-it-eworkflow-option-a.v8.yap
```

Decoded source:

```text
heep-hong-it-eworkflow-option-a-app-def.v8.json
```

Generated form Def:

```text
heep-hong-it-eworkflow-option-a-purchase-requisition-approval-form-def.v8.json
```

## Scope

Option A includes:

- root app shell for `Heep Hong IT eWorkflow`
- `Centers / Departments` data list
- `Funding Sources` data list
- `IT Equipment Catalog` data list
- `IT Purchase Requisitions` data list
- `IT Purchase Requisition` approval form
- internal lookup relationships from the request list/form to master lists
- `ContentList` persistence to `IT Purchase Requisitions`

Option A intentionally excludes New Joiner, IT Access Right, online payment, SSO implementation, CRM integration, reports/dashboards beyond the simple app page, AI Agents/Copilots, document libraries, external connections, and custom code.

## Runtime Failure Found In v7

v7 imported and opened. The app navigation and data-list components were visible. List metadata endpoints returned successfully, including:

- `api/crafts/list/{AppID}/{ListID}`
- `api/crafts/defs/listid`
- `api/crafts/layouts/listid`

But every data-list grid row query failed:

```text
api/crafts/datas/{AppID}/{ListID}/query -> 400
```

The failure persisted with:

- the actual grid columns and `Created` sort
- `Columns: ["Title"]` without sort
- `Columns: []` without sort
- system-only columns without sort
- no imported sample records

This ruled out sample data, a specific visible column, and the grid sort as root causes.

## Root Cause

Generated child data lists were defining `Title` like a normal custom business field:

```json
{
  "FieldName": "Title",
  "Status": 1,
  "IsSystem": false,
  "IsIndex": false
}
```

Yeeflow accepted enough metadata to render list headers, but the backend row-data query path failed.

## Correct Pattern

Every generated data list must preserve `Title` as Yeeflow's native primary/display field:

```json
{
  "FieldName": "Title",
  "Status": 0,
  "IsSystem": true,
  "IsIndex": true
}
```

The display label can still be business-specific:

- `Center / Department Name`
- `Funding Source Name`
- `Equipment Name`
- `Request No.`

The underlying field metadata must remain native/system/indexed. Additional business text fields should use `Text1`, `Text2`, and later slots.

## v8 Result

v8 changed only the generated child data-list `Title` metadata and used a fresh generated namespace:

- ID family: `224...`
- FlowKey/form key: `HHP`
- sample data remained disabled for diagnostic isolation

The user confirmed v8 fixed the data-list query error.

## Validator Rule

Generator/final validation must fail if any generated data list has `FieldName === "Title"` and any of these are true:

- `Status !== 0`
- `IsSystem !== true`
- `IsIndex !== true`

This rule is enforced in:

- `validate-ydl-list.js`
- `validate-yap-package.js`
- `validate-yap-graph.js`

## v9 Purchase Requisition Baseline

v9 extends the working Option A v8 app shell with fuller Purchase Requisition functionality while preserving the native `Title` metadata hard rule for every generated data list.

Generated package:

- Workspace package: `heep-hong-it-eworkflow-option-a.v9.yap`
- Upload copy: `/Users/Renger/Downloads/heep-hong-it-eworkflow-option-a.v9.yap`
- Source generator: `generate-heep-hong-option-a-v9.mjs`
- App definition: `heep-hong-it-eworkflow-option-a-app-def.v9.json`
- Approval form definition: `heep-hong-it-eworkflow-option-a-purchase-requisition-approval-form-def.v9.json`

Generated namespace:

- ID family: `225...`
- FlowKey/form key: `HH9`
- `Data.Forms[].ListID`: `0`
- Sample master data: enabled for master lists only

Included data lists:

1. Centers / Departments
2. Funding Sources
3. IT Equipment Catalog
4. IT Purchase Requisitions
5. IT Purchase Requisition Items

The detail list is included. Detail-row persistence is deferred in v9 because the row-to-child-list `ContentList` mapping pattern is not proven enough for a safe generated package. Header persistence remains enabled through one validated `ContentList` node targeting `IT Purchase Requisitions`.

The approval form includes a line-item style `Purchase Requisition Items` section with text/number row fields for:

- Equipment
- Equipment Category
- Quantity
- Assigned Staff Name
- Assigned Staff Email
- Work Allocation / Centre Allocation
- Usage Purpose
- Notes

Row-level equipment lookup inside the line-item table is intentionally deferred until the lookup-in-row pattern is proven by export evidence.

Header fields included:

- Request No.
- Applicant
- Submission Date
- Center / Department lookup
- Center / Department Code
- Funding Source lookup
- Funding Category
- Requested Items Summary
- Request Reason
- New Headcount switch
- Special / Multi Device Reason conditional textarea
- Estimated Quantity / Total Quantity number
- Approval Status
- IT Decision
- Expense Code
- Approved Date
- Created From Workflow

Workflow actions used and validated:

- `StartNoneEvent`
- `SetVariableTask`
- `MultiAssignmentTask`
- `ContentList`
- `SequenceFlow`
- `EndNoneEvent`
- `EndRejectEvent`

Workflow path:

1. Start.
2. Set generated Request No. and initial Approval Status.
3. Supervisor / Department Head approval.
4. IT Review.
5. Approved IT path creates the `IT Purchase Requisitions` header record.
6. Rejected supervisor or IT paths route to `EndRejectEvent`.

Validation result:

- `node --check generate-heep-hong-option-a-v9.mjs`: pass
- `node validate-yap-package.js ./heep-hong-it-eworkflow-option-a-app-def.v9.json --mode generator --stage final`: pass
- `node validate-yap-graph.js ./heep-hong-it-eworkflow-option-a-app-def.v9.json --mode generator --stage final --json ./heep-hong-it-eworkflow-option-a-graph-validation.v9.json --md ./heep-hong-it-eworkflow-option-a-graph-validation.v9.md`: pass
- `node validate-ywf-def.js ./heep-hong-it-eworkflow-option-a-purchase-requisition-approval-form-def.v9.json --mode final`: pass
- Direct `workflow-action-config-validator.js` check against the approval form `childshapes`: pass
- `node build-yap-wrapper.js ./heep-hong-it-eworkflow-option-a-app-def.v9.json ./heep-hong-it-eworkflow-option-a.v9.yap --title "Heep Hong IT eWorkflow Option A v9" --description "Purchase requisition workflow with detail list and two-step approval."`: pass

Validator summary:

- Data lists: `5`
- Approval forms: `1`
- Lookup relationships: `3`
- `ContentList` references: `1`
- Workflow action config: `14` checked, `14` supported, `0` unsupported, `0` partial, `0` unsafe
- Wrapper round trip: `decodedEqualsSource: true`
- Remaining placeholders: `0`

Runtime result on `https://<yourdomain>.yeeflow.com`:

- Import succeeded for the first v9 package.
- App opened.
- Navigation rendered.
- All five data lists opened without the previous `datas/query 400` failure.
- Master sample data loaded:
  - Centers / Departments: `6` rows
  - Funding Sources: `7` rows
  - IT Equipment Catalog: `15` rows
- Empty transaction lists opened:
  - IT Purchase Requisitions
  - IT Purchase Requisition Items
- Purchase Requisition approval form opened.
- Center / Department lookup opened and returned the six master rows.
- Line-item UI rendered with the expected detail columns and `+ Add item`.

Runtime caveat:

The first imported v9 package still displayed inherited `Visitor Access Request` header copy on the form. The local generator and package were patched afterward so the generated form header is now `IT Purchase Requisition`; validators and wrapper round-trip were rerun after that patch. A duplicate-name runtime reimport attempt did not produce a confirmable second imported app, so submit/approval routing and corrected-header runtime proof remain the next runtime-test step.

Deferred or intentionally excluded:

- Detail-row `ContentList` persistence.
- New Joiner workflow.
- Access Right workflow.
- Dashboards and reports.
- AI/Copilot.
- Document library.
- External connections.
- Payment.
- CRM.
- SSO implementation.
- Custom code.
