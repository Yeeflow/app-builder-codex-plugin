# Yeeflow Application Generation Review Checklist

Use this checklist before packaging, after local validation, and after runtime testing for generated Yeeflow applications. It is a review aid for future generation tasks; it does not replace the package/form/list/workflow validators.

## 1. Scope And Package Type

- [ ] The requested app type is clear: new/cloned `.yap` package or existing-app `.yapk` upgrade package.
- [ ] For new/cloned `.yap`, the package uses a fresh ID family and a fresh safe FlowKey/form key.
- [ ] For existing-app upgrades, `.yapk` is treated as read-only/server-generated unless a valid Yeeflow Version management baseline and signing/encoding proof exists.
- [ ] The app does not include dead configuration lists; every v1 list is used by forms, workflow, dashboard, reports, or documented runtime proof.
- [ ] Master/reference lists named in the requirement are real active lists, not placeholder concepts. Each one has an owner, fields, views/forms, and sample/reference rows when lookups depend on it.
- [ ] Line items have an explicit persistence model: workflow sublist summary only, direct child-row persistence, or a separate transaction item list.
- [ ] Availability/stock/capacity logic is clearly classified as manual review only, query-based availability, or inventory/reservation based.
- [ ] Review-only availability is not described as true stock decrement, reservation, or inventory control.
- [ ] Dashboard scope is meaningful for v1 and runtime-safe, or explicitly deferred.
- [ ] Dashboard KPI/summary/report/queue/chart promises are mapped to functional dashboard controls, not static Text placeholders.
- [ ] Business-critical capabilities are either implemented in v1 or marked as required runtime proof items with fallback behavior.

## 2. Local Validation Gate

- [ ] Newly generated `.yap` uses strict generator/import-readiness validation, not compatibility validation.
- [ ] Package wrapper validates with `validate-yap-package.js --mode generator --stage final`.
- [ ] App graph validates with `validate-yap-graph.js --mode generator --stage final`.
- [ ] `scripts/inspect-yap-import-readiness.mjs` passes when available.
- [ ] `scripts/inspect-yap-schema-standard.mjs` and `scripts/inspect-app-creation-rules.mjs` pass.
- [ ] Approval form definitions validate.
- [ ] Data list definitions validate.
- [ ] Every generated child data list also passes standalone `validate-ydl-list`; app-level package validation alone is not accepted.
- [ ] Every generated Type `1` data list includes `ListModel.ListType = 1`.
- [ ] Every generated Type `1` data list keeps native `Title` metadata as `Status = 0`, `IsSystem = true`, `IsIndex = true`, and `FieldIndex = 0`.
- [ ] Duplicate field names/internal names are absent.
- [ ] Duplicate display names inside a data list are absent or explicitly accepted as a materialization risk.
- [ ] Every generated child-list `FieldID` is unique across the whole `.yap`, not only within its own list.
- [ ] Every generated field's `ListID` equals its parent data-list `ListID`.
- [ ] `TenantID`, `CreatedBy`, and `ModifiedBy` retain real baseline metadata and are not included in `Resource.ReplaceIds`.
- [ ] Root Type `103` dashboard/page layout is owned by the root app/ListSet `ListID`, and its navigation entry points to an existing root layout.
- [ ] Root/custom page/form/dashboard `LayoutInResources[].ID` and `RefId` match the owning `LayoutID` where inline resources are used.
- [ ] Data-view columns resolve to real fields or explicitly allowed system fields; stale pseudo-field columns are removed before handoff.
- [ ] Dashboard dynamic-display rules and filters reference resolvable controls, fields, and page filter variables.
- [ ] `scripts/inspect-yap-materialization.mjs` passes before Yeeflow runtime import.
- [ ] Lookup targets, display fields, dependency maps, and sample lookup target rows resolve.
- [ ] Referenced master/reference lists are present and non-empty when form lookup selection is part of v1.
- [ ] Generated data-list custom forms include current-standard `Edit Item` and `View Item`; New/Edit maps to `Edit Item`, View maps to `View Item`.
- [ ] Workflow action configuration validates.
- [ ] Expression smoke checks cover generated formulas, query filters, workflow conditions, and sublist summaries where applicable.
- [ ] Dashboard structure inspection confirms KPI/count/total cards use `summary` controls with matching `exts`, queue/report sections use `data-list` or proven `collection` controls, planned chart sections use real chart controls when the chart model is known, and no KPI value is hardcoded as Text `0`, `0.00`, `N/A`, or placeholder content.
- [ ] The package is not sent to Yeeflow runtime testing until local validation passes, unless the task is explicitly an isolation/proof experiment.

## 3. Runtime Test Gate

Before claiming runtime proof, complete `docs/yeeflow-runtime-test-checklist-template.md` for the tested package.

Minimum runtime smoke proof:

- [ ] App imports and opens.
- [ ] The app does not open to `Start to build with Components`.
- [ ] Child data lists show their generated custom fields, not only empty list shells.
- [ ] Dashboards render and functional controls are data-bound to expected source lists; page render alone is not dashboard proof.
- [ ] Data lists open without `datas/query` 400 responses.
- [ ] Approval forms open from the app and, when needed, from submitted workflow tasks.
- [ ] At least one valid submit path completes without workflow node errors.

Production-like runtime proof:

- [ ] Requester/applicant logic works for the intended requester and proxy scenarios.
- [ ] Product/sublist row calculations and summary totals update after row commit/blur.
- [ ] Policy-critical totals are recalculated through safe preflight actions before routing, quota, or persistence decisions.
- [ ] Query data filters use the runtime-proven filter shape and return only expected rows.
- [ ] Workflow branches cover normal, exception, empty, and unexpected values.
- [ ] Submit, approve, reject, return, and resubmission paths pass when included.
- [ ] `ContentList` and usage/audit list lifecycle events persist expected rows and readable values.
- [ ] Dashboard KPIs match source list data after runtime records change.
- [ ] Operational queues and advanced reporting sections render real list/table/collection data or empty states from the expected source lists.
- [ ] Chart runtime tests use representative source rows before acceptance. Record whether each chart renders with data, loads with no data, or fails to load; an empty dataset alone is not a chart-model failure.

## 4. Runtime Safety Review

- [ ] Temp variables are used only for frontend form state, not backend persistence, audit records, dashboard sources, or workflow routing that must survive submission.
- [ ] FlowKey/form key text does not collide with reserved JSON property names.
- [ ] Wrapped or export-back inspection shows no corrupted `prefix` / `pr<id>x` binding keys.
- [ ] Requester/applicant variables, profile snapshots, and quota/eligibility calculations use the intended identity variable rather than accidental Current User context after submission.
- [ ] Hardcoded tenant user IDs are avoided unless export-backed and valid for the target tenant.
- [ ] Attachment controls include tested behavior or explicit guidance/fallback when binary persistence is not proven.

## 5. Form Design Quality Gate

- [ ] Approval forms use page-level background and the learned `Main` / `Content` / `Form body` / `Form bottom` shell.
- [ ] Header, request summary, and metric/status rows are present when the business process needs quick review context.
- [ ] Normal fields use two-column grids; long text, upload, rich text, sublist, and guidance controls use full-row layout.
- [ ] Workflow Action Panel and Flow History are placed in `Form bottom`.
- [ ] Text and icon controls use learned inline-width behavior and meaningful designer `nv_label` values.
- [ ] Runtime-sensitive controls have fallback behavior or focused proof notes.
- [ ] The runtime form has no visible caption clutter, overlapping content, unreadable colors, or layout regressions.

## 6. Reporting Language

- [ ] Use "locally validated" when only local validators and wrapper checks passed.
- [ ] Use "runtime smoke-tested" only after import/open/dashboard/list/form and at least one valid workflow path are tested.
- [ ] Use "runtime baseline passed" only when branch, persistence, dashboard KPI, and included return/rejection paths have evidence.
- [ ] List every blocked or deferred runtime item explicitly in the final report.
