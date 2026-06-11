# Runtime Test Checklist

Use this checklist as a minimum runtime pass. Add app-specific checks from requirements, screenshots, SOPs, and known risk areas.

## Import And Navigation

- Import/open app package.
- Confirm app name, menus, pages, and permissions.
- Confirm dashboards, data lists, approval forms, and workflows appear.

## Data Lists

- Confirm every expected list materializes.
- Confirm field labels, types, required flags, choices, lookups, defaults, and calculated values.
- Create and edit sample records.
- Filter and search representative fields.
- Confirm child-list or `ContentList` values persist after save/reopen.

## Approval Forms

- Open requester form.
- Validate required fields and conditional sections.
- Submit happy-path request.
- Open reviewer task page.
- Approve and reject representative requests.
- Confirm status, comments, audit/history, and task URL behavior.

## Workflow Branches

- Approve path.
- Reject path.
- Revise/resubmit path when present.
- Conditional routing path.
- Notification and list-update side effects.
- Error or incomplete-input behavior.

## Dashboards

- Confirm dashboard renders.
- Confirm every KPI, chart, table, and filter is data-bound.
- Add or change sample records and verify values update.
- Confirm no static mockup KPI is accepted as proof.

## Expressions And Query Data

- Test calculated fields.
- Test filter expressions with matching and non-matching records.
- Test lookup and query data controls.
- Record expression errors or empty-result behavior.

## Custom Code Controls

- Confirm runtime context: dashboard, application page, approval form, or public form.
- Test SDK calls and returned data.
- Test user interaction, save/submit behavior, loading state, and error state.
- Claim support only for contexts actually tested.

## Lifecycle Scenarios

- Family Quota Usage or entitlement calculation.
- Audit lifecycle creation and review.
- Status transitions across request, approval, rejection, cancellation, and renewal.
- Reopen completed record and confirm persisted state.
