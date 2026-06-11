# Runtime Test Lifecycle

Use this lifecycle after local validation says a Yeeflow package is safe to import. Runtime testing proves behavior in Yeeflow; it is not a substitute for package validation.

## 1. Prepare

- Record package path, version, branch, commit, and validator results.
- Define the test tenant/environment and note any missing permissions, connectors, or sample data constraints.
- Prepare minimal sample records that exercise required states without exposing customer or tenant-specific runtime data.
- Decide which behavior must be proven before baseline acceptance.

## 2. Import And Open Smoke

- Import or open the generated app package in Yeeflow.
- Confirm the app shell, navigation, pages, lists, forms, and workflow entries are visible.
- If import fails, classify as `blocked by package/materialization` unless the failure is clearly environment configuration.
- If open succeeds but functional tests are not run, do not classify beyond render-level proof.

## 3. Data Lists And Materialization

- Confirm each expected list exists after import.
- Confirm fields materialize with correct labels, types, lookups, choices, required flags, and parent relationships.
- Create, edit, view, filter, and delete or archive sample records when the scenario permits.
- Check `ContentList` and child-table persistence by saving, reopening, and reviewing submitted values.

## 4. Forms And Actions

- Open each approval form and data-entry form.
- Test required fields, conditional visibility, calculated/default values, form actions, query data controls, filter expressions, and task URLs.
- Submit at least one happy-path request and one representative validation/error path.
- Review task/review pages as the assigned reviewer.

## 5. Workflows

- Exercise every required workflow branch: approve, reject, revise, cancel, conditional routing, escalation, notification, and update actions where applicable.
- Verify workflow variables, set-variable actions, list-item updates, task assignment, and status transitions.
- Record branches not executed as `not tested` or `partially proven`, not runtime-proven.

## 6. Dashboards

- Confirm dashboards render without broken controls.
- Confirm KPIs, charts, tables, and filters are data-bound to Yeeflow lists or workflow data.
- Change or add sample data and verify dashboard values respond.
- Reject static KPI mockups or placeholder charts as baseline proof.

## 7. Custom Code

- Test each custom code control in the exact claimed runtime context, such as dashboard, application page, approval form, or public form.
- Verify SDK calls, query results, callback refs, event handlers, save behavior, and error states.
- Do not claim public form support unless public form runtime testing was performed.

## 8. Domain Lifecycle Tests

For quota, audit, family, or entitlement scenarios, include lifecycle-style checks:

- initial request creation
- quota/usage calculation
- approval/rejection side effects
- audit log or history persistence
- renewal, cancellation, or adjustment where required
- reopen/review after workflow completion

## 9. Baseline Decision

Accept a baseline only when the required user journeys are runtime-proven and documented. If any critical journey is blocked or not tested, record a partial baseline or a rejected baseline with the exact blocker.
