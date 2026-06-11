# Smart Lookup Picker Runtime Test Plan

Scope: validate `smart-lookup-picker.tsx` when used through Yeeflow Custom Code controls in dashboard, approval-form, and data-list custom-form contexts.

Runtime baseline executed on 2026-05-18 in `https://<yourdomain>.yeeflow.com/` using generated package `custom-code-smart-lookup-picker-test.v1.yap`.

Result: dashboard, approval-form submit/detail, and data-list custom-form contexts passed. Public-form support remains unclaimed because no public form was generated or tested.

## Preconditions

- Import a copy of a test app package into the Yeeflow sandbox.
- Confirm the lookup source list exists and contains searchable records in the configured `displayField`.
- Confirm each output target exists and is text-compatible:
  - dashboard temp variables: `Selected_Value`, `selectedItemsField`, `newItemsField`
  - approval variables: `saveToField`, `selectedItemsField`, `newItemsField`
  - data-list fields: dedicated text fields preferred; avoid using `Title` unless intentionally testing that behavior
- Open browser console/network logging for observable runtime errors.

## Runtime Baseline Evidence

| Context | Runtime result | Evidence |
|---|---|---|
| Dashboard | Passed | Imported `Custom Code Smart Lookup Picker Test`; opened `Smart Lookup Dashboard`; picker rendered; searching `Acme` returned `Acme Clinical Partner`; selecting it updated dashboard temp outputs to combined JSON, selected values, and empty manual values. |
| Approval form | Passed | Opened `Smart Lookup Approval Test`; picker rendered on the submit page; searching `Beacon` returned `Beacon Research Vendor`; selection updated `Picker Combined JSON`, `Picker Selected Values`, and `Picker Manual Values`; submitted request `SLPTEST2026051700001`; request detail persisted the picker values. |
| Data-list custom form | Passed | Opened `Smart Lookup Test Records`; New item custom form rendered the picker; searching `Acme` returned `Acme Clinical Partner`; selection updated list-bound output fields; saving created row `List picker runtime Acme` with persisted combined JSON in the list grid. |
| Public form | Not tested | No public-form control was included in the focused runtime package. Do not claim public-form support from this baseline. |

## Test Cases

| ID | Context | Goal | Steps | Expected Result |
|---|---|---|---|---|
| SLP-001 | Dashboard | Control renders | Open the `smart-lookup-picker` dashboard page | Picker label/input renders with no console error |
| SLP-002 | Dashboard | Parameters pass correctly | Search a known `Title` from the source list | Query returns matching suggestions |
| SLP-003 | Dashboard | Selection/writeback | Select a matched item and inspect temp variable behavior where observable | Combined, selected-only, and manual-only outputs update |
| SLP-004 | Dashboard | Manual entry | Type an unmatched value and add it when manual entry is enabled | Manual chip appears and manual output updates |
| SLP-005 | Approval form | Control renders | Open `Test Picker` submit page | Picker renders with no console error |
| SLP-006 | Approval form | Lookup behavior | Search and select a known source-list record | Selected chip appears and matched output variable updates |
| SLP-007 | Approval form | Submission/persistence | Submit the form after selection | Submission succeeds; mapped variables retain expected JSON/string outputs if used by workflow persistence |
| SLP-008 | Approval form | Task page behavior | Open reviewer task if workflow routes | Control does not mutate readonly values unexpectedly |
| SLP-009 | Data-list form | Control renders | Open `Event Planning` -> `New Item` custom form | Picker renders with no console error |
| SLP-010 | Data-list form | List field writeback | Select a matched item and save the record | Configured list fields persist expected output values |
| SLP-011 | Public form | Compatibility | Only run if a public-form example is generated and approved | Public form renders and respects permissions without exposing restricted data |
| SLP-012 | Error handling | Missing required config | Remove or blank `dataListId` in a focused negative test | Control shows safe incomplete-config behavior and does not crash |
| SLP-013 | Error handling | No search result | Search a known no-result keyword | No-result text appears; no console error |
| SLP-014 | Readonly | Readonly mode | Open any readonly/render-only context | Input is disabled or non-mutating behavior is preserved |

## Executed Test Case Status

| ID | Status | Notes |
|---|---|---|
| SLP-001 | Passed | Dashboard picker rendered. |
| SLP-002 | Passed | Dashboard search returned `Acme Clinical Partner`. |
| SLP-003 | Passed | Dashboard `__temp_` outputs became combined JSON, selected value array, and manual array. |
| SLP-004 | Not run | Manual entry was not part of the focused positive baseline. |
| SLP-005 | Passed | Approval submit-page picker rendered. |
| SLP-006 | Passed | Approval search returned and selected `Beacon Research Vendor`. |
| SLP-007 | Passed | Approval submit succeeded and detail view persisted mapped output values. |
| SLP-008 | Partially covered | Submitted detail/read view showed persisted values; reviewer task interaction was not completed. |
| SLP-009 | Passed | Data-list New item custom form rendered the picker. |
| SLP-010 | Passed | Saved row persisted picker combined JSON in list grid. |
| SLP-011 | Deferred | Public form not tested. |
| SLP-012 | Not run | Negative missing-config test not executed. |
| SLP-013 | Not run | No-result test not executed. |
| SLP-014 | Partially covered | Approval detail rendered persisted value without editing. |

## Evidence To Capture

- App/package name and import date.
- Browser URL and context tested.
- Screenshots or notes showing rendered picker.
- Console/network errors if any.
- Example selected item and saved output values.
- Whether writeback used real setter methods or only local `fieldsValues` fallback.
- Export-back comparison if the app is changed through the designer.

## Pass Criteria

- All configured contexts render without visible or console/runtime errors.
- `dataListId`, `displayField`, and `valueField` resolve correctly.
- Search returns expected records from the source list.
- Matched item selection and manual entry work as configured.
- Writeback updates the intended field, variable, or temp variable in each tested context.
- Form submission or list-record save succeeds when writeback is part of the workflow.
- Public-form support remains unclaimed unless explicitly tested.
