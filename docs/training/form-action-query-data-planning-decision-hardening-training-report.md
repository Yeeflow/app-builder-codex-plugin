# Form Action Query Data Planning Decision Hardening Training Report

## Scope

This focused training closes planning gaps found while generating two independent applications: a Campaign/Event application with dependent-field and editable Sub List loading, and a Customer Service Dashboard with count/latest/chained-customer reads plus a recent-record list.

The existing v1.1-v1.4 export-backed templates remain valid. The failures were in business capability selection, cross-section plan consistency, and readiness orchestration.

## Failure Classes

1. A count-only query placed `Count only` in Page Size. The Query Data validator already rejected it, but the generation workflow ran only resource-order validation.
2. A Dashboard planned `Query Data -> temp collection/JSON -> Collection`. Collection/Data Table cannot consume that temp payload; the correct business solution was a Collection bound directly to the Data List.
3. A Campaign Plan used ambiguous targets such as `page temp collection / import buffer` instead of the exact `multiple_to_list_sublist` current-record target.
4. Related-record plans used ambiguous Lookup values without explicitly requiring the target record `ListDataID`.
5. Generation Readiness did not automatically call the Query Data planning validator or require a standard planning table.

## Promoted Rules

- Choose native capability before Query Data mode.
- Use direct Collection/Data Table binding for read-only multi-row display.
- Reserve Query-to-Sub-list for persisted editable working copies.
- Require a declared consumer for every temp collection/JSON result.
- Reject temp JSON/temp collection dataset-control consumers.
- Reject ambiguous result targets and ambiguous Lookup identity mappings.
- Automatically run the Query Data plan validator from Generation Readiness.
- Fail readiness when Query Data intent exists without the standard planning table.

## Regression Coverage

Positive cases cover workflow variables, temp variables, editable current-record Sub Lists, Document Library form hosts, count-only output, and temp JSON consumed through `JSONStringfy`.

Negative cases cover Public Form/report hosts, stale count mappings, invalid pagination, read-only Sub List misuse, ambiguous import buffers, temp JSON feeding Collection, unconsumed temp JSON, ambiguous Lookup ID mappings, readiness orchestration failures, and missing planning tables.

The corrected Campaign/Event plan passes integrated Generation Readiness with six Query Data rows. The corrected Customer Service Dashboard plan passes with three Query Data rows and a direct Data List-backed Collection for recent records. Both reports confirm `queryDataPlan.validatorRan: true` with no Query Data findings.

## Proof Boundary

This training is planning- and validator-proven. It does not claim runtime Query Data execution, returned-row accuracy, current-user filtering, Lookup runtime values, or Custom Code rendering without the separate runtime proof required by the existing standard.
