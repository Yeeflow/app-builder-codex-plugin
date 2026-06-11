# Yeeflow Design System First Test Plan

## Purpose

Create the first generated package that proves the Yeeflow Application Design System in runtime.

Do not generate or import the package during the standards-definition phase. This plan defines the next test only.

## Scope

The test app should include:

- one dashboard
- one data list
- `Edit Item` and `View Item` custom list forms
- one approval form
- simple local workflow only
- no external dependencies
- no AI/Copilot
- no document library
- no custom code
- no complex workflow branching

## Proposed App

Name: `Design System Request Tracker`

Purpose: a small internal request tracker used only to prove layout fidelity.

Resources:

- Dashboard: `Overview`
- Data list: `Requests`
- Approval form: `Submit Request`

## Dashboard Requirements

Dashboard page:

- Type `103`
- hidden header
- zero padding
- `Main` -> `Content`
- `Page header`
- `Summary section` with three KPI cards
- `Collection section` showing recent requests from the local list
- `Empty state` copy for no rows

KPI cards:

- Total Requests: primary
- Approved: success
- Pending Review: warning

## Data List Requirements

List: `Requests`

Fields:

- native `Title` as Request No.
- Request Title
- Request Type
- Requested By
- Status
- Needed By
- Notes

Custom forms:

- `Edit Item`
- `View Item`

Both forms use full-width, zero padding, `Main` -> `Content`.

## Approval Form Requirements

Approval form: `Submit Request`

Pages:

- submission page
- reviewer task page

Both pages use:

- full width
- zero padding
- `Main`
- `Content`
- `Form body`
- `Form bottom`
- `workflowControlPanel`
- `workflowHistory`

Workflow:

- Start
- reviewer approval
- approved path creates a request record
- rejected path ends rejected

## Validation

Before runtime testing:

- `node validate-yap-package.js <app-def.json> --mode generator --stage final`
- `node validate-yap-graph.js <app-def.json> --mode generator --stage final`
- `node validate-ywf-def.js <approval-def.json> --mode final`
- `node build-yap-wrapper.js <app-def.json> <output.yap>`
- wrapper round-trip validation

## Runtime Proof

When explicitly requested:

1. Import the package into `https://<yourdomain>.yeeflow.com/`.
2. Confirm the app opens.
3. Confirm dashboard renders.
4. Confirm data list opens.
5. Confirm Edit/View custom forms open.
6. Confirm approval form opens.
7. Submit one request.
8. Complete reviewer task.
9. Confirm approved path creates the request record.
10. Export back and compare shell/layout structures.

## Success Criteria

The design system is considered runtime-proven only after import/open/export-back evidence confirms:

- dashboard shell survived import
- custom list forms survived import
- approval-form `Form body` / `Form bottom` survived import
- Action Panel and Flow History placement survived import
- token-aligned or resolved-equivalent style values did not break rendering
