# Employee & Family Implant Application Management v1 Baseline Note

Generated: 2026-05-16

## Status

This is the **accepted Employee Family Implant v1 runtime baseline**. Acceptance is based on cumulative Yeeflow runtime evidence from the process-design package plus the focused query-filter fix package. The query-filter package fixed the only blocking v1 failure that remained from the deep runtime pass: a second family request now counts the prior approved usage row and recalculates remaining quota correctly.

Update on 2026-05-17: v1 is accepted for the required baseline paths. Non-blocking limitations are documented below and should not start v2/v3 work by themselves.

## Current Package

- Package: `employee-family-implant.v1.yap`
- Decoded app definition: `employee-family-implant-app-def.v1.json`
- Approval form definition: `employee-family-implant-approval-form-def.v1.json`
- Generator: `generate-employee-family-implant-v1.mjs`
- Accepted v1 package: `/Users/Renger/Downloads/Employee Family Implant Query Filter Expression Fix 20260517.yap`
- Earlier accepted manual package: `/Users/Renger/Downloads/Employee Family Implant DateDiff Unit Fix 20260517.yap`
- Latest regenerated process-design package: `/Users/Renger/Downloads/Employee Family Implant Quota Lifecycle Branch Coverage 20260517.yap`
- Latest focused quota-query fix package: `/Users/Renger/Downloads/Employee Family Implant Query Filter Expression Fix 20260517.yap`
- Flow key: `EIA`
- ID family: `641...`

## Query Filter Expression Fix - 2026-05-17

Root cause isolated from `Implant Application Request (5).ywf`: the Query Data step `Load active family quota usage rows from Family Quota Usage` had filter right operands rendered as frontend `<input type="button" ...>` expression-button HTML strings while the filter row was still in direct-value mode. Yeeflow compared the source fields to those literal HTML strings, so existing Family Quota Usage rows were not matched.

Export-backed fix:

- Literal filter values remain primitive values with direct-value mode, for example `right: "Active", showCus: true`.
- Workflow-variable filter values use expression-editor token arrays with `showCus: false`.
- The fixed Family Quota Usage query compares:
  - `Applicant Employee ID == Workflow Variables:Applicant Employee ID`
  - `Quota Cycle Key == Workflow Variables:Quota Cycle Key`

Focused runtime result:

- Imported `/Users/Renger/Downloads/Employee Family Implant Query Filter Expression Fix 20260517.yap`.
- First family request for `Standard Implant Package` amount `2500.00` submitted successfully and created active quota usage.
- Second family request for the same applicant loaded `Used Quota Before = 2500.00`.
- After selecting another `Standard Implant Package` amount `2500.00` and running `Check Family Quota`, the form showed:
  - `Total Application Amount = 2500.00`
  - `Used Quota Before = 2500.00`
  - `Remaining Quota After = 10000.00`
  - `Quota Exceeded = No`
  - `Quota Usage Status = In Progress`

This proves the previous blocking quota aggregation issue is fixed for the focused second-request path. Because the earlier deep runtime pass already proved submit, HR Review, Finance/Benefits routing, usage creation, approval/release update, and persistence paths, the query-filter package is accepted as the v1 runtime baseline.

## V1 Runtime Acceptance Matrix

| Path | Status | Evidence |
|---|---|---|
| Requester / Applicant default and change behavior | Passed | Required identity picker defaults to Current User, remains editable for proxy submission, and has a change action that reruns applicant snapshot and quota logic. |
| Applicant snapshot fields readonly | Passed | Snapshot fields render readonly; HR and Finance pages keep Requester / Applicant readonly. |
| Product sublist lookup/autofill | Passed | Standard and Custom product selections autofilled product name, product type, unit price, quantity, and row subtotal. |
| Row subtotal and Total Application Amount | Passed | Product Selection summary and Total Application Amount updated correctly, including multi-row totals. |
| Family quota check | Passed | Quota check uses Total Application Amount and updates used, remaining, and exceeded values. |
| Second request includes prior usage | Passed | Focused query-filter retest counted the first approved `2500.00` usage row in the second request. |
| Over-quota warning/block | Passed | Over-quota family submit showed the expected submit-time warning/block behavior. |
| Usage creation on submission | Passed | Family request created Family Quota Usage as `In Progress` on submission/start. |
| Usage approval/release update | Passed | HR approval updated usage to `Approved`; HR rejection updated matching usage to `Released`. |
| HR Review route | Passed | Within-quota/non-custom family request submitted, opened HR Review, and proceeded through the standard approved path. |
| Finance/Benefits route | Passed | Custom Package route opened Finance/Benefits Review after HR approval and completed after Finance approval. |
| Implant Applications persistence | Passed | Approved request created readable Implant Applications row. |
| Family Quota Usage persistence | Passed | Family request created and updated readable Family Quota Usage row. |

## Process-Design Fix Package - 2026-05-17

The latest regenerated package addresses newly found application-design issues:

1. Family Quota Usage is now part of the workflow lifecycle, not a passive list.
   - Family applications create a usage row immediately after workflow start/submission with `UsageStatus = In Progress`.
   - Quota checks query active statuses: `In Progress`, `Occupied`, `Approved`, and `Confirmed`.
   - Final approval models `ContentList edit` to mark the matching usage row `Approved`.
   - Rejection models `ContentList edit` to mark the matching usage row `Released`.
   - Matching uses `ApplicationNo + ApplicantEmployeeID + QuotaCycleNumber` as the v1 correlation key unless a future runtime export proves a stronger form/workflow instance token.
2. Attachment Requirement Rules is no longer idle.
   - The quota/guidance form action derives `AttachmentScenarioProductType`.
   - It queries active Attachment Requirement Rules by `ApplicationType + AttachmentScenarioProductType`.
   - It writes the result into `RequiredAttachmentSummary` for visible guidance and persistence.
3. HR Review branch coverage is tightened.
   - `Approved + HasCustomPackageProduct = No` routes to the standard persistence path.
   - `Approved + HasCustomPackageProduct != No` routes to Finance/Benefits Review, covering `Yes`, empty, and unexpected values.
   - Rejected family requests route through usage release; rejected non-family requests go directly to rejected end.
4. `HasCustomPackageProduct` is displayed readonly/required and derived by form actions from Product Selection/ProductSummary.

Local validation for this process-design package:

- `node --check generate-employee-family-implant-v1.mjs`
- `node --check validate-yap-package.js`
- JSON parse checks: pass
- `validate-ywf-def`: `pass_with_warnings`, 0 errors
- `validate-yap-package`: `pass_with_warnings`, 0 errors
- `validate-yap-graph`: `pass`, 0 errors
- `validate-ywf-def-against-yap`: `pass`, 0 errors
- workflow action config validation: pass, 0 issues
- focused inspection: pass for RequesterApplicant change action, raw `dateDiff` unit, usage lifecycle nodes, attachment rules query, HR fallback branch, and FlowKey safety
- wrapper round trip: pass

Runtime status: this package passed most deep runtime paths and exposed the quota aggregation failure that was later fixed by the query-filter package. Codex imported the package as `Employee & Family Implant Application Management-branch coverage`, confirmed the home dashboard renders, and confirmed the approval form opens with `Requester / Applicant` defaulted and applicant snapshot/quota/attachment guidance visible.

Deep runtime observations on 2026-05-17:

- Family within-quota request with `Standard Implant Package` passed through submit and HR Review.
- Family Quota Usage was created at submission with `Usage Status = In Progress`.
- HR Review approval updated the usage row to `Approved` and created an Implant Applications row.
- A second family request for the same applicant did **not** count the first approved usage row in the quota calculation. Remaining quota showed `12500.00` for another `2500.00` request; expected remaining quota was `10000.00`.
- HR rejection of the second family request updated the usage row to `Released`, with source status `Rejected` and release notes.
- A self custom-package request set `Includes Custom Package Product = Yes`, routed HR Review to Finance/Benefits Review, and completed after Finance approval.
- Attachment matrix guidance rendered, but runtime did not prove the guidance was dynamically driven by the Attachment Requirement Rules list.

The quota aggregation root cause was later fixed by the Query Filter Expression package above. Keep the branch-coverage package result as historical evidence of the failure mode; use the query-filter package as the accepted v1 package.

## Patch Learning Applied

1. `getUserAttr`, `getOrgAttr`, and `getLocAttr` now use the export-backed direct attribute descriptor object shape: `params[1] = { "key": "...", "label": "..." }`.
2. Applicant profile snapshot expressions use `RequesterApplicant`, not `Context:Current User`, after the applicant is initialized.
3. `RequesterApplicant` is a required identity-picker control with Default value = Current User. There is no redundant page-load Set variable step that writes `RequesterApplicant` from Current User.
4. Applicant snapshot controls are readonly by default. Review/task pages must not overwrite applicant snapshots with the current viewer.
5. Product Selection is now a `ProductSelectionItems` sublist/listref with row lookup, readonly autofill fields, quantity, row subtotal, and summary-bound `TotalApplicationAmount`.
6. Quota checks, Finance/Benefits routing, and ContentList persistence use `TotalApplicationAmount`; quota and submit preflight actions also recalculate the amount from `ProductSelectionItems` with `arraySum(ProductSelectionItems, "ProductRowSubtotal", [], [])` so policy logic is not dependent on delayed UI summary commits.
7. Page-load initialization calls Family Quota Check after applicant snapshots are set.
8. Submit is wired through `formdef.formAction.onSubmit` to `Check and Submit the form`; that action calls Family Quota Check first, warns when family quota is exceeded, and submits only when valid or not a family request.
9. Product Selection subtotal summary binding uses the export-backed compact shape `{ "prefix": "__variables_", "value": "TotalApplicationAmount" }`; no unsupported extra target metadata is generated.
10. FlowKey `EFI` is avoided because Yeeflow import replacement can corrupt the reserved `prefix` key into `pr<runtimeFlowKey>x`. The current package uses safe FlowKey `EIA`, and wrapper inspection found no corrupted `pr<id>x` binding keys.
11. Conditional warning/confirm steps before submit use step-level `continue: true` when the valid path should skip the warning and continue to the following Submit form step. This is the export-backed shape for designer checkbox `Continue next step when condition is not met`.

## What Passed Locally

- `node --check generate-employee-family-implant-v1.mjs`
- `node --check validate-ywf-def.js`
- JSON parse checks for app/form/spec/report artifacts
- expression smoke tests, including the direct descriptor rejection test
- generated expression audit: 7 `getUserAttr` hits, 0 wrapped descriptors, 0 Current User profile reads, 7 RequesterApplicant profile reads
- applicant snapshot readonly audit: 0 editable snapshot issues
- `validate-ywf-def`: `pass_with_warnings`, 0 errors
- `validate-yap-package`: `pass_with_warnings`, 0 errors
- `validate-yap-graph`: `pass`, 0 errors
- `validate-ywf-def-against-yap`: `pass`, 0 errors
- workflow action config validation
- focused inspection: RequesterApplicant required/default-current-user present, no redundant default Set variable, page-load quota call present, submit-time quota call present, 0 Current User applicant profile reads, Product Selection summary binding present
- focused FlowKey/sum inspection: FlowKey `EIA`, `ProductSelectionItems` summary binding contains literal `prefix`, and no corrupted `pr<id>x` keys were found
- focused condition-flow inspection: `Check and Submit the form` -> `Warn when family quota is exceeded` has `continue: true`, allowing valid family requests to reach the following submit step
- child data-list validation: all five lists `pass_with_warnings`, 0 errors
- `build-yap-wrapper` round trip: `pass`, decoded source matches wrapper round trip
- wrapped `.yap` package and graph validation

## Remaining Local Warnings

The remaining local warnings are known schema/design-system warnings for generated controls such as `text-editor`, `flex_grid`, `identity-picker`, `file-upload`, `action_button`, calculated row controls, and resolved style token colors. No local warning currently indicates the original patched-export root causes.

## Runtime Result

Fresh runtime app: `Employee & Family Implant Application Management - FlowKey safe binding fix`

Latest package generated for runtime test: `/Users/Renger/Downloads/Employee Family Implant Condition Continue Fix 20260517.yap`

Passed:

1. App imported and opened.
2. Home dashboard rendered.
3. Approval form opened.
4. `RequesterApplicant` defaulted to the current login user and remained the applicant identity.
5. Applicant snapshot fields populated from the requester profile path and rendered readonly.
6. Product Selection sublist rendered.
7. Selecting `Standard Implant Package` autofilled product name, product type, unit price, quantity, and row subtotal.
8. Product Selection displayed `Sum: 2500.00`.
9. `Refresh Product Summary` produced a readable persisted product-line summary.
10. `Check Family Quota` recalculated `Total Application Amount` as `2500.00` and changed `Remaining Quota After` from `15000.00` to `12500.00`.
11. Attachment guidance rendered the confirmed scenario matrix.
12. The FlowKey-safe package imported and opened in Chrome.
13. Product Selection summary binding worked without manual repair: Standard quantity 3 subtotal `7500` plus Custom quantity 2 subtotal `12000` displayed `Sum: 19500.00`, and `Total Application Amount` also displayed `19500.00`.
14. Family Quota Check used `Total Application Amount`: annual quota `15000.00`, remaining quota after `-4500.00`, and quota exceeded `Yes`.
15. Submit-time quota validation ran for the over-quota family case and showed the expected warning/block message.

Later process-design and query-filter runtime tests closed the earlier submit, HR Review, Finance route, persistence, and second-request quota gaps. The remaining items below are non-blocking limitations, not v1 baseline blockers.

## Known V1 Limitations

- Attachment Requirement Rules dynamic query is locally present and visible guidance is runtime-proven; strict upload blocking remains an HR verification fallback for v1.
- The empty/unexpected `HasCustomPackageProduct` fallback branch is modeled and locally inspected but was not forced through a natural runtime UI path.
- High-amount Finance/Benefits routing threshold is not configured as a separate business threshold in v1; v1-proven Finance routing is Custom Package based.
- Submitted Time and Approved Time display on the usage-row detail view may remain blank; this does not block the v1 business baseline.

## Accepted Manual Runtime Baseline - 2026-05-17

Accepted package: `/Users/Renger/Downloads/Employee Family Implant Query Filter Expression Fix 20260517.yap`

User-confirmed runtime pass after fixes:

- Requester / Applicant remains editable, required, and defaults to Current User.
- Requester / Applicant change reruns applicant snapshot initialization and quota calculation for proxy submission.
- Applicant business logic uses RequesterApplicant or applicant snapshot variables, not Context:Current User after initial defaulting.
- Applicant snapshot fields remain readonly.
- Product Selection uses sublist row subtotal, summary binding, and Total Application Amount.
- FlowKey-safe summary binding remains fixed.
- Submit guard uses step-level `continue: true`.
- Family Quota Check runs during initialization and submit.
- Eligibility Date variable/control dependency was removed.
- Applicant Boarding Years number variable was added and calculates correctly.
- Boarding tenure logic sets effective quota to 0 when Applicant Boarding Years = 0, and treats Applicant Boarding Years > 0 as eligible.
- Family Quota Usage includes numeric Quota Cycle No.
- Family usage query uses ApplicantEmployeeID + Quota Cycle No. + UsageStatus.
- Product Selection summary, Total Application Amount, quota check, and submit guard behavior are accepted as runtime-passed by the user.

Critical dateDiff learning:

- Broken generated shape: third parameter `[{ "type": "str", "value": "Year" }]`.
- Broken frontend display: `dateDiff(Workflow Variables:Applicant Boarding Date,now(),formcraft.formula.datetype.[object Object],)`.
- Working export-backed/manual shape: raw third parameter `"year"`.
- Working frontend display: `dateDiff(Workflow Variables:Applicant Boarding Date,now(),Year,)`.
- Correct generator expression: `dateDiff(ApplicantBoardingDate, now(), "year", [])`.

Honest boundary: this section records the user's accepted manual runtime result. Any future tenant-specific profile availability or routing variations should still be verified in the target tenant when changed.
