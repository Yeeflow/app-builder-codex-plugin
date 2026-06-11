# Employee Family Implant v1 Core Patch Study

Source export: `/Users/Renger/Downloads/Employee Family Implant v1 Core Patch 20260516.yap`

Date studied: 2026-05-16

Scope: decoded read-only. Focused on the approval form `Implant Application Request`, its submit page, form actions, requester/applicant controls, and product/amount controls. The uploaded export was not modified.

## Package Slice

- Package title: `Employee Family Implant v1 Core Patch 20260516`
- Approval form: `Implant Application Request`
- Form key: `2055498859039047685`
- Pages: `Submit Implant Application`, `HR Review`, `Finance/Ben2055498859039047685ts Review`
- Submit page on-load action: `e40b42b5-b0d4-495e-add7-c3362050e4cd`
- Large numeric IDs were preserved as strings in the inspection output.

## getUserAttr Root Cause

The user-fixed first Set variable step is `Snapshot applicant name from current user on new request` inside `Initialize requester applicant snapshot defaults`.

Working export-backed shape from the fixed step:

```json
{
  "type": "func",
  "func": "getUserAttr",
  "params": [
    [
      {
        "id": "CurrentUser",
        "exprType": "application",
        "valueType": "string",
        "type": "expr",
        "name": "Context:Current User"
      }
    ],
    {
      "key": "Name_CN",
      "label": "Name"
    },
    []
  ]
}
```

The generated broken sibling steps still use the same function but wrap the attribute descriptor in an array:

```json
{
  "type": "func",
  "func": "getUserAttr",
  "params": [
    [
      {
        "id": "CurrentUser",
        "exprType": "application",
        "valueType": "string",
        "type": "expr",
        "name": "Context:Current User"
      }
    ],
    [
      {
        "key": "EmployeeNo",
        "label": "Employee No."
      }
    ],
    [
      {
        "type": "str",
        "value": "Needs HR Verification"
      }
    ]
  ]
}
```

Exact observed difference:

- Working fixed step: `params[1]` is a direct descriptor object, for example `{ "key": "Name_CN", "label": "Name" }`.
- Broken generated steps: `params[1]` is a one-item array, for example `[{ "key": "EmployeeNo", "label": "Employee No." }]`.
- Working fixed step keeps the user/context argument as an expression-token array: `params[0] = [Context:Current User token]`.
- Working fixed step uses an empty default parameter array: `params[2] = []`. Existing fallback arrays are still structurally valid expression-token arrays, but the attribute descriptor must not be array-wrapped for `getUserAttr`, `getOrgAttr`, or `getLocAttr` profile attribute parameters.

Reusable rule: for Yeeflow profile functions, generate `params` as `[[subjectExpression], { key, label }, fallbackExpressionArray]`. Do not generate `[[subjectExpression], [{ key, label }], fallbackExpressionArray]`.

## RequesterApplicant Logic

The patched export still initializes applicant snapshots from `Context:Current User`. That is allowed only for defaulting/initializing a new request, but the target design now requires applicant logic to use `RequesterApplicant` after it is set.

Generation rule for the corrected app:

1. On a new request, default `RequesterApplicant` from Current User only when it is empty.
2. Populate applicant snapshot variables from `RequesterApplicant` using the export-backed profile function parameter shape.
3. Use applicant snapshot variables for quota, display, workflow routing, and ContentList persistence.
4. Submitted/task pages must not run Current User based applicant snapshot logic, because HR/approver/admin viewers are not necessarily the applicant.

Requester variable token shape to use in expressions:

```json
{
  "exprType": "variable",
  "valueType": "user",
  "id": "RequesterApplicant",
  "type": "expr",
  "name": "Workflow Variables:Requester / Applicant"
}
```

Runtime proof required: direct `getUserAttr(RequesterApplicant, ...)` must be validated in the target approval-form context. If it fails, keep `RequesterApplicant` as the stored applicant and use a reduced snapshot-at-submission proof/fallback instead of reading `Context:Current User` after submission.

## Applicant Snapshot Readonly Pattern

The manually fixed `Applicant Name` control uses the simple export-backed readonly pattern:

```json
{
  "page": "Submit Implant Application",
  "path": "$.pageurls[0].formdef.children[0].children[0].children[0].children[1].children[1].children[1]",
  "type": "input",
  "label": "Applicant Name",
  "binding": "ApplicantEmployeeName",
  "nv_label": "Applicant Name control",
  "readonly": true,
  "attrs": [
    "placeholder"
  ]
}
```

Reusable rule: applicant/profile snapshot controls are readonly by default. The only applicant field that may stay editable/selectable on the new request page is `RequesterApplicant`; reviewer/task pages should render `RequesterApplicant` readonly too.

Fields that should be readonly on the submit page after generation:

- `ApplicantEmployeeName`
- `ApplicantEmployeeID`
- `ApplicantDepartment`
- `ApplicantBoardingDate`
- `ApplicantUserStatus`
- `ApplicantEmail`
- `ApplicantLineManager`
- profile/eligibility/status snapshot fields

Autofilled product fields such as product type, unit price, row subtotal, and total amount should also be readonly unless they are intentionally editable business inputs.

## Product Selection Root Cause

The export still has single product controls: `ProductLookup`, `ProductName`, `ProductType`, `UnitPrice`, `Quantity`, and `ApplicationAmount`. There is no product line-item listref in `variables.listref`.

Correct v1 redesign:

- Replace single product fields with a `ProductSelectionItems` sub list.
- Row fields: product lookup, product name, product type, unit price, quantity, row subtotal.
- Product lookup autofills product name/type/unit price per row.
- Row subtotal uses current-object tokens with `exprType: "variable_ctx"`, `ctx: "ProductSelectionItems"`, and row field ids.
- Parent list control uses `attrs["list-fields-summary"]` to sum `ProductRowSubtotal` into `TotalApplicationAmount` using `{ "prefix": "__variables_", "value": "TotalApplicationAmount" }`.
- Quota check, Finance/Benefits routing, ContentList persistence, and Family Quota Usage persistence must use `TotalApplicationAmount`.
- Persist a readable `ProductSummary` text variable for saved application and usage records.

## Promotion Decisions

Promote these reusable learnings:

- Profile function attribute descriptors are direct `{ key, label }` parameters, not one-item expression arrays.
- Applicant snapshot/autofilled fields should render readonly by default.
- Real requirements that allow multiple products should use a sub list with row subtotal and summary binding, not repeated single top-level product fields.

Do not promote as fully proven yet:

- Direct `getUserAttr(RequesterApplicant, ...)` runtime success. The token shape is generation-safe and should be runtime-tested, but it was not the manually fixed expression in the uploaded export.

## Follow-up Study: Employee & Family Implant Application Management_Test

Source export: `/Users/Renger/Downloads/Employee & Family Implant Application Management_Test.yap`

Date studied: 2026-05-16

Scope: decoded read-only. Focused only on `Implant Application Request`, its submit page, form actions, `RequesterApplicant`, Product Selection sublist summary binding, Family Quota Check, and Check and Submit behavior. The uploaded export was not modified.

Inspection artifact: `employee-family-implant-v1-core-patch-inspection.json`

### RequesterApplicant Default Pattern

The user-corrected export proves the preferred requester/applicant defaulting pattern for this application:

```json
{
  "type": "identity-picker",
  "label": "Requester / Applicant",
  "binding": "RequesterApplicant",
  "attrs": {
    "default": "currentUser",
    "placeholder": "Applicant",
    "required": true
  },
  "value": "CurrentUser"
}
```

The previous redundant form-action step `Default RequesterApplicant from current user on new request` is absent in the corrected export. This is the correct shape: the field itself defaults to Current User and is required, so generation should not add a duplicate Set variable step to write `RequesterApplicant = CurrentUser`.

Generation rule:

- Generate `RequesterApplicant` as a required user/identity control with `attrs.default = "currentUser"` and `value = "CurrentUser"` when the applicant should default to the logged-in user.
- Do not generate a duplicate form action Set variable step to default the same variable from Current User.
- Start applicant snapshot initialization from `Snapshot applicant name from RequesterApplicant`.
- Use Current User only as the control default source, not for later applicant profile reads.
- On reviewer/task pages, never overwrite `RequesterApplicant` or applicant snapshot variables from the current viewer.

The corrected export's initialization action has 7 `getUserAttr` profile reads, all based on `RequesterApplicant`, and 0 Current User profile reads.

### Initialization and Family Quota Check Trigger

The submit page uses:

```json
"formAction": {
  "onLoad": "7e76903e-a4a2-470d-b005-30507efbe889",
  "onSubmit": "28e9a6ae-5db8-477f-b2a5-c6173dd414f4"
}
```

The on-load action `Initialize requester applicant snapshot defaults` ends with:

```json
{
  "type": "otheraction",
  "attrs": {
    "control_action": "2055520453245419522-action-check-quota"
  }
}
```

Generation rule: Family Quota Check should run after requester/applicant snapshot initialization and again before submit. The quota check must not depend only on a manual Check Quota button.

### Product Selection Summary Binding

The corrected export contains a `ProductSelectionItems` workflow-form list/listref. Product lookup, product name, product type, unit price, quantity, and row subtotal are row fields. Row subtotal is summarized on the parent list control:

```json
[
  {
    "id": "b6067dec-8b32-43c3-8daf-7cc31b73bf2b",
    "field": "ProductRowSubtotal",
    "type": "total",
    "display": true,
    "binding": {
      "prefix": "__variables_",
      "value": "TotalApplicationAmount"
    }
  }
]
```

The manually reselected working binding still serializes as the compact export-backed shape above. The export does not include additional target variable name, label, or type metadata in `attrs["list-fields-summary"]`.

Observed implication:

- Do not invent extra summary target metadata unless a future export shows it.
- The safe generator rule remains `{ "prefix": "__variables_", "value": "<targetNumberVariableId>" }`.
- Validators should verify that the target variable exists and is numeric, the source row field exists and is numeric, and downstream quota/workflow/persistence uses the summary-bound top-level variable.
- Runtime tests should commit/blur row edits before asserting summary values, because summary recalculation is event-driven in the browser.

Follow-up export `Implant Application Request (1).ywf` exposed the exact root cause for the generated Product Selection summary binding failure. The generated form key was `EFI`; during Yeeflow import/export replacement, the `efi` substring inside the JSON property name `prefix` was replaced, corrupting the summary binding key to `pr2055672796649762823x`:

```json
"binding": {
  "pr2055672796649762823x": "__variables_",
  "value": "TotalApplicationAmount"
}
```

The manually added working `Product Selection1` sub list kept the correct shape:

```json
"binding": {
  "prefix": "__variables_",
  "value": "TotalApplicationAmount"
}
```

Generator rule: do not use generated FlowKeys/form keys that can appear inside reserved JSON property names. In particular, avoid `EFI` because it appears inside `prefix`. Use a FlowKey such as `EIA` for this app, and inspect wrapped package/form exports for corrupted keys matching `pr<id>x` before runtime testing.

Runtime follow-up with `/Users/Renger/Downloads/Employee Family Implant FlowKey Safe Summary Binding Fix 20260516.yap` confirmed the safe FlowKey fix: the imported form displayed Product Selection `Sum: 19500.00`, `Total Application Amount` also displayed `19500.00`, and no manual binding repair was needed. The same run showed Family Quota Check using the total amount (`Remaining Quota After -4500.00`, `Quota Exceeded Yes`) and submit-time over-quota blocking with the expected warning.

Fresh-runtime follow-up: after importing the regenerated package, the Product Selection row subtotal and visible `Sum: 2500.00` updated correctly, but the separate `TotalApplicationAmount` workflow variable was not updated in time for the Family Quota Check action. Because quota and routing are policy-critical, the generator now keeps the export-backed summary binding and also recalculates `TotalApplicationAmount` inside quota/submit preflight actions with `arraySum(ProductSelectionItems, "ProductRowSubtotal", [], [])`. Treat summary binding as the UI/display mechanism and explicit `arraySum` preflight as the safe policy calculation fallback until a future export proves a stronger immediate-commit pattern.

## Query Data Filter Operand Mode - 2026-05-17

Source export: `/Users/Renger/Downloads/Implant Application Request (5).ywf`

The user found that the Query Data step `Load active family quota usage rows from Family Quota Usage` did not match existing Family Quota Usage rows because two filters were visually variable-like but stored as direct literal values.

Broken generated shape:

```json
{
  "left": "Text2",
  "op": "0",
  "right": "<input type=\"button\" data=\"...Workflow Variables:Applicant Employee ID...\">",
  "showCus": true
}
```

Working export-backed shape:

```json
{
  "left": "Text2",
  "op": "0",
  "right": [
    {
      "exprType": "variable",
      "valueType": "text",
      "id": "ApplicantEmployeeID",
      "type": "expr",
      "name": "Workflow Variables:Applicant Employee ID"
    }
  ],
  "showCus": false
}
```

Exact rule:

- Direct literal values use primitive `right` values and `showCus: true`.
- Workflow variables and calculations use expression-token arrays in `right` and `showCus: false`.
- Do not serialize frontend expression-button HTML into `attrs.querydata_filters[].right`.

Runtime proof after generator fix:

- Package: `/Users/Renger/Downloads/Employee Family Implant Query Filter Expression Fix 20260517.yap`
- First family request for `2500.00` created active usage.
- Second family request for the same applicant and quota cycle loaded `Used Quota Before = 2500.00`.
- After adding another `2500.00` product row and running `Check Family Quota`, `Remaining Quota After = 10000.00` and `Quota Exceeded = No`.

This fixed the previous blocking second-request quota aggregation failure.

## Process-Design Follow-Up: Quota Lifecycle, Attachment Rules, and Branch Coverage

Later manual review found three app-planning issues that are reusable application-builder lessons:

1. A usage list must participate in the process.
   - If the business confirms quota is occupied on submission, create a usage row at workflow start/submission, not only after final approval.
   - Future quota checks must include in-progress/occupied and approved/confirmed usage records.
   - Rejection must release/update/delete the matching usage record; final approval should confirm it.
   - Store a correlation key such as application number, request instance key, form instance id, or workflow instance id so later workflow actions can find the same usage row.
2. A configuration list must drive behavior or be deferred.
   - Attachment Requirement Rules should be queried or looked up to drive visible guidance/validation.
   - If strict upload validation is not runtime-safe, show guidance and route uncertain cases to HR verification.
   - Do not include an unused v1 configuration list just because it looks like a good model.
3. Workflow branches need full coverage.
   - If a branch uses `HasCustomPackageProduct`, make that variable required, auto-derived, or guarded by fallback.
   - Cover `Yes`, `No`, empty/null, and unexpected values.
   - For Employee Family Implant v1, `Approved + HasCustomPackageProduct = No` follows the standard path, while `Approved + HasCustomPackageProduct != No` goes to Finance/Benefits Review as a safe fallback.

The regenerated package `/Users/Renger/Downloads/Employee Family Implant Quota Lifecycle Branch Coverage 20260517.yap` applies these rules. Local validation passed. A Yeeflow runtime smoke test also confirmed import, home dashboard render, and approval-form open with requester/applicant snapshot, quota, and attachment guidance visible. The new `ContentList edit` usage approval/release lifecycle still requires workflow runtime proof.

### Check and Submit Action

The corrected export contains `Check and Submit the form` and wires it to submit via `formAction.onSubmit`. However, the exported action currently contains a self-reference placeholder:

```json
{
  "type": "otheraction",
  "attrs": {
    "control_action": "28e9a6ae-5db8-477f-b2a5-c6173dd414f4"
  }
}
```

Do not copy this self-reference. The generator must complete the action with the safe pattern:

1. Call Family Quota Check through `type: "otheraction"`.
2. If `ApplicationType == Family` and `QuotaExceeded == "Yes"`, show a warning/confirmation and do not submit when a safe hard block is available.
3. If not a family request, or quota is not exceeded, run the native `type: "submit"` step.

Validation rule: an `otheraction` step must not call its own parent action. Treat recursive submit/action loops as errors.

Follow-up export `Implant Application Request (2).ywf` proved the missing condition-flow setting for the same submit guard. The designer checkbox `Continue next step when condition is not met` serializes as step-level `continue: true`:

```json
{
  "type": "confirm",
  "name": "Warn when family quota is exceeded",
  "condition": [
    { "id": "ApplicationType", "exprType": "variable" },
    { "type": "op", "op": "==" },
    { "type": "str", "value": "Family" },
    { "type": "op", "op": "and" },
    { "id": "QuotaExceeded", "exprType": "variable" },
    { "type": "op", "op": "==" },
    { "type": "str", "value": "Yes" }
  ],
  "continue": true
}
```

Generator rule: conditional warning/confirm/check steps before a Submit form step usually need `continue: true`; otherwise the valid path can skip the warning but stop before reaching submit. The following submit step should still have its own valid-path condition when the invalid path must remain blocked.

## Follow-up Study: dateDiff Boarding Year Fix

Source export: `/Users/Renger/Downloads/Implant Application Request (3).ywf`

The generated Set variables entry for `ApplicantBoardingYears` used the third `dateDiff` parameter as an expression string-token array: `[{ "type": "str", "value": "Year" }]`. Yeeflow rendered that as `formcraft.formula.datetype.[object Object]` in the expression editor.

The user-corrected export-backed shape uses a raw lowercase string: `"year"`, with the fourth parameter blank as `[]`. The designer displays this as `Year`.

Reusable rule: generate `dateDiff(ApplicantBoardingDate, now(), "year", [])` for Applicant Boarding Years and similar whole-year tenure calculations. Do not wrap the date unit in an expression-token array.
