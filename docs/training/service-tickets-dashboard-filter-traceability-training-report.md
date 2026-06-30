# Service Tickets Dashboard Filter Traceability Training Report

## Scope

This training round covers the Service Tickets Management validation failure where the Dashboard left-panel Collection had a real Tickets data source and live rows, but rendered no records.

The defect was caused by internally inconsistent generated Dashboard filter wiring:

- The generated Tickets data list did not materialize the planned `Status` business field.
- The left-panel Collection filter consumed filter variables that were not declared in page `filterVars[]`.
- The Priority/Status filter conditions were bound by field position instead of by business field identity, causing Priority to bind to Ticket Number and Status to bind to Requester.
- The generated select-filter conditions could clear the initial Collection result set before the user selected any filter value.

## Root Cause

The generator treated Dashboard filters as visual controls and did not maintain a strict trace from:

1. Functional Spec and App Plan fields.
2. Generated Data List fields.
3. Dashboard filter controls.
4. Page `filterVars[]`.
5. Collection/Summary/Data Table/Data Analytics consumer conditions.

The App Plan parser also treated a cell value of `Status` as a non-resource placeholder. That made legitimate business fields named `Status` disappear from generated lists and Dashboard filter records.

## Generator Rules Added

- `Status` and `Owner`-like business labels are no longer treated as generic non-resource placeholders by the materializer.
- Dashboard filter records can infer required Data List fields when the filter's source resource matches the Data List.
- Filter-derived business fields use their business label as the planning-level key. The final runtime field name is still assigned by generated field materialization.
- Master-detail left-panel select filters are not attached to Collection `attrs.data.filter[]` until an export-proven empty-value bypass contract exists.
- Search-filter/fulltext behavior remains the preferred safe initial filtering path for master-detail Dashboards.

## Validator Rules Added

Runtime binding validation now fails when:

- A Dashboard filter control references a field that is not present on its source list.
- A consumer filter references `__filter_<name>` but page `filterVars[]` does not declare `<name>`.
- A consumer condition field does not match the source field of the filter control that produces the consumed variable.

These checks prevent a generated package from passing merely because the consumer field exists somewhere on the source list.

## Regression Coverage

Added `scripts/test-service-tickets-dashboard-filter-traceability-gates.mjs`.

The regression materializes a Service Tickets master-detail Dashboard from a fixture App Plan and verifies:

- `Priority` remains materialized on Tickets.
- `Status` is inferred from Dashboard filter planning and materialized on Tickets.
- The generated Dashboard does not emit unproven Priority/Status select-filter consumers that can empty the initial Collection.
- Runtime binding validation passes for the generated package.

## Proof Boundary

This training round is local generator and validator coverage only. It does not sign, install, import, upgrade, seed data, or claim browser/runtime proof.
