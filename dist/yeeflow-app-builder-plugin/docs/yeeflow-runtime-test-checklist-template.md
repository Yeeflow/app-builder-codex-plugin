# Yeeflow Runtime Test Checklist Template

Use this template after local `.yap` validation passes and before claiming runtime proof for a generated Yeeflow application. Treat each item as evidence to collect, not a statement of confidence. Mark every row as `pass`, `fail`, `blocked`, or `not applicable`, and keep exact app/package names, runtime URLs, request numbers, list row IDs, screenshots, and console/network observations when useful.

## Test Run Header

| Field | Value |
| --- | --- |
| Application name |  |
| Package path |  |
| Package type | `.yap` new/cloned app / `.yapk` existing-app upgrade package |
| Runtime tenant |  |
| Import date |  |
| Imported app name |  |
| Runtime tester |  |
| Local validation summary |  |
| Known deferred items |  |

## Runtime Checklist

| # | Area | Result | Evidence / notes |
| --- | --- | --- | --- |
| 1 | App import/open |  | Import the package, open the imported app, confirm the left navigation and default/home route load without a blank shell or fatal browser console error. |
| 2 | Dashboards render |  | Open every generated dashboard page. Confirm KPI cards, charts, tables, filters, and action buttons render with expected labels, spacing, and data source bindings. Page render alone is not proof when the plan promised KPIs, queues, reports, analytics, trends, or charts. |
| 3 | Data lists open without `datas/query` 400 |  | Open every generated data list page and custom list view. Watch the network panel for `datas/query` 400 responses, endless loading states, and first-load refresh caveats. |
| 4 | Approval forms open |  | Open each approval form from the app and from any create/new-request entry point. Confirm the form is published if required, and task pages open after submission. |
| 5 | Requester/applicant logic |  | Verify Current User defaults, proxy applicant behavior, applicant change actions, profile snapshots, readonly applicant fields, and workflow/user expressions use the intended requester/applicant variable. |
| 6 | Product/sublist/summary calculations |  | Add representative sublist rows, commit/blur edited cells, confirm row subtotals, visible summary values, bound total variables, and any policy-critical preflight `arraySum` recalculations. |
| 7 | Form actions |  | Test page-load, on-change, button-click, set-variable, confirm, query-data, submit, and save-changes actions that are included. Confirm valid paths continue to submit and invalid paths block or warn as designed. |
| 8 | Query data filters and expression operands |  | Confirm Query data steps use `attrs.querydata_filters` and return the intended records. For expression operands, verify token-array operands render/evaluate correctly and do not become literal HTML or raw JSON. |
| 9 | Workflow branch coverage |  | Exercise normal, exception, empty, and unexpected routing-variable values. Confirm every gateway branch reaches a valid task/end state and fallback review paths are reachable. |
| 10 | Submit/approve/reject paths |  | Submit at least one valid request, complete each required approval task, and test rejection/cancel paths. Confirm task assignees are valid runtime users/groups and no workflow node errors occur. |
| 11 | Return/resubmission if included |  | If return/rework is in scope, return a request, edit required fields, resubmit, and confirm status, audit trail, and downstream routing are correct. |
| 12 | `ContentList` persistence |  | Confirm create/edit/remove `ContentList` workflow actions write the expected rows and fields after submit, approval, rejection, and final completion. Include readable lookup/profile summaries, not only internal IDs, when reports need readable values. |
| 13 | Usage/audit list lifecycle |  | For quota, benefit, booking, or audit lists, confirm row creation timing, in-progress inclusion, final approval confirmation, rejection release/update, and correlation keys back to the source request. |
| 14 | Dashboard KPI validation |  | Compare dashboard KPI values against source list rows or submitted test requests. Confirm KPI cards are real Summary/data-bound controls, not static Text values such as `0`, `0.00`, `N/A`, or placeholder text. Confirm filter controls change the expected widgets and totals after records are created or updated. |
| 15 | No temp variables used for backend persistence |  | Verify temp variables are only used for frontend form state. Backend persistence, workflow routing, audit rows, and dashboard/report fields must use workflow/form/list variables or persisted fields. |
| 16 | No FlowKey collision |  | Confirm generated FlowKey/form keys do not appear as lowercase substrings of reserved JSON property names such as `prefix`, `suffix`, `field`, `profile`, `workflow`, `variable`, `filter`, `collection`, `condition`, `expression`, `attributes`, `actions`, or `binding`. |
| 17 | No corrupted `prefix` / `pr<id>x` keys |  | Inspect the imported/exported form or package for corrupted binding keys such as `pr205...x`. Pay special attention to sublist summary bindings and variable binding objects. |
| 18 | Form design quality gates |  | Confirm page-level background, `Main` / `Content` / `Form body` / `Form bottom`, header/request summary, two-column field grids, full-row long controls, Action Panel, Flow History, meaningful `nv_label`, and no obvious overlap or caption clutter. |
| 19 | Attachment verification/guidance |  | Verify required upload controls render, accept expected file types when tested, and show clear guidance. If binary persistence to data-list file/image fields is not runtime-proven, document the fallback/manual review rule. |
| 20 | Existing-app package limitation |  | If the target is an existing app, confirm `.yapk` handling is read-only/server-generated. Do not claim Codex-edited `.yapk` upgrade packages are valid unless Yeeflow Version management generated/signed the package or a future proof establishes the encoding/signing model. |
| 21 | Dashboard queues/reports/charts |  | Confirm operational queues and report sections are real data-list/Collection/table controls bound to expected source lists. For chart sections, first create or confirm representative source records: the data source exists, grouping fields have non-empty values, the measure/count field is available, and at least one matching record exists. Classify results separately as chart renders with data, chart model loads but has no data, or chart model fails to load. Do not treat an empty source list as a broken chart model, and do not accept free-text "advanced reporting" as runtime proof. |

## Workflow Branch Matrix

Duplicate this table for each workflow gateway or approval branch.

| Scenario | Input values | Expected branch/task | Actual branch/task | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| Normal |  |  |  |  |  |
| Exception |  |  |  |  |  |
| Empty/missing value |  |  |  |  |  |
| Unexpected value |  |  |  |  |  |

## Persistence Matrix

Use this table for request records, usage records, audit records, dashboard source lists, and any integration-staging lists.

| Event | Expected persisted target | Required fields | Actual row / value | Result | Notes |
| --- | --- | --- | --- | --- | --- |
| Submit |  |  |  |  |  |
| Approve |  |  |  |  |  |
| Reject/cancel |  |  |  |  |  |
| Return/resubmit |  |  |  |  |  |
| Final completion |  |  |  |  |  |

## Evidence Rules

- Do not report runtime proof from local validators alone.
- Record the exact package tested, because later generated packages may differ by IDs, FlowKey, or workflow/action serialization.
- Capture at least one clean app open, one dashboard open, one data-list open, one form open, and one workflow path before marking a generated app runtime-smoke-passed.
- For production-like claims, include submit, approval, rejection, persistence, dashboard KPI refresh, and branch coverage evidence.
- If runtime access is lost or a browser session fails before completing the matrix, report the package as locally validated or partially runtime-tested only.
