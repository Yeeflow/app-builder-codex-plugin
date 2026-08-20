# Yeeflow App Builder Plugin v1.12.10

## Approval Form Control Closure

- Require the shared Approval Form builder for every bound field and nested Sub List row control.
- Fail closed on unsupported bound control types such as `drop`, missing builder provenance, empty Choice options, Submission/Task control-type drift, and missing editable Sub List placeholders.
- Generate type-aware placeholders for Sub List rows: Enter, Select, or Upload according to control family.
- Add a package and persisted-`DefResource` closure validator to the generated YAPK preflight and a Sales Quotation Approval regression fixture.

## Proof Boundary

This release validates static generation and persisted-definition closure only. It does not claim Designer rendering, request submission, workflow routing, or browser task-action runtime proof.
