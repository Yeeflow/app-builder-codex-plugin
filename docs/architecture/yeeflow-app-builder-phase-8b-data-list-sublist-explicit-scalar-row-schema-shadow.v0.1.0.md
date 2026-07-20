# Phase 8B Data List Sublist Explicit Scalar Row-Schema Internal Shadow

## Decision

PHASE_8B_SUBLIST_SCALAR_ROW_SCHEMA_SHADOW_ACCEPTED

Phase 8C distribution-readiness audit is accepted as the next decision point; this does not promote an API or route production behavior.

## Legacy Boundary

dataListSubListVariables has two production callers: buildDataListFormSubListControl and buildFieldRules. Its normalizer supports text, date, number, boolean, user, and file rows. This shadow covers only explicit scalar text/date/number/boolean rows with caller-supplied row IDs. Nested control creation, summaries, temporary variables, and template mutation remain outside the boundary.

## Internal Contract

Materializer Core accepts immutable scalar child descriptors and explicit lossless parent ListID, child ListID, parent FieldID, child FieldID, row-schema ID, ordinal, and template scope values. It returns an immutable row-schema intent plus findings. Local Runtime validates supplied parent/child/template/row-schema relationships and returns fresh Legacy-shaped list-variables rows. It never allocates identities or mutates snapshots.

## Evidence

The versioned corpus contains 21 cases: 6 actual Legacy parity cases, 10 host validation cases covering all ten Phase 8A stable errors, and 5 exclusion cases. The Legacy harness executes the current dataListSubListVariables and normalizeSubListRowType functions in a VM with explicit rows, so identity semantics are compared directly.

## Deferred

- nested control placement
- summaries and temporary variables
- Lookup
- identity user people person
- department
- file image binary
- barcode
- actions and expressions
- Type 0 and Type 1 final layout mutation
- Approval Forms
- Document Libraries
- Dashboards
- workflows

No public API, distribution artifact, adapter, production route, active installation, historical ZIP, protected duplicate, Git publication, or release action changed.
