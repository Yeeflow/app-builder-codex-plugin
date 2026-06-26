# Approval Workflow Publish Readiness Training Report

## Trigger

Business Travel Request validation found that generated Approval form fields were present, but the Approval workflow could not be published. The Designer reported a missing completion condition on the Review node, and browser inspection showed workflow nodes stacked in the same canvas area.

The failure was not caused by duplicate control IDs. It was caused by incomplete workflow materialization and by validator gaps that treated package signing, upgrade submission, or Version Management updates as stronger proof than they are.

## Root Causes

- `Forms[].DefResource` lacked `flowPage`.
- `variables` was emitted as a flat array instead of `variables.basic/listref/filter`.
- `StartNoneEvent` did not reliably bind the submission page through `taskurl`, `taskUrl`, and `TaskUrl`.
- `MultiAssignmentTask` task page aliases were incomplete.
- `usertaskassignment` was object-shaped instead of an array.
- Approval metadata such as `approveway` and `approvepercentage` was incomplete.
- Rejected paths could terminate at a normal end event instead of `EndRejectEvent`.
- Workflow graph nodes lacked complete references or usable non-overlapping positions.
- Local and live proof boundaries were blurred: API accepted/updated states did not prove that the Designer `ProcModel` / `DefBlob` was repaired.

## Training Changes

- Full-app materialization now emits publish-ready Approval workflow graph structure:
  - `flowPage: []`
  - `variables.basic`, `variables.listref`, and `variables.filter`
  - Submission and task page URL aliases
  - Start -> Assignment Task -> Approved End / Rejected End graph
  - `MultiAssignmentTask` assignment array and approve metadata
  - Distinct node positions and complete graph references
- Added `scripts/validate-approval-workflow-publish-readiness.mjs`.
- Added the new gate to `scripts/yapk-first-generation-preflight.mjs`.
- Added focused regression coverage in `scripts/test-approval-workflow-publish-readiness-gates.mjs`.
- Extended full-app materializer regression coverage so nontrivial generated-final packages must pass the new gate.

## Hard-Gate Contract

Generated-final Approval workflow packages must fail before signing when any of these are true:

- `flowPage` is missing.
- `variables` is flat or lacks `basic/listref/filter` arrays.
- Start or task page URL aliases are missing, mismatched, or point to the wrong page type.
- Assignment task metadata is missing or object-shaped.
- Approve metadata is missing.
- Rejected path does not target `EndRejectEvent`.
- Workflow nodes stack on identical coordinates.
- Graph IDs, source refs, or target refs are incomplete.
- `validate-ywf-def.js --mode final` reports final-mode workflow errors.

## Proof Boundary

Passing this local gate is signing-readiness evidence, not runtime execution proof. After install or upgrade, a live validation run must still prove Designer open/publish behavior for the exact package identity. `apiStatus: 0`, signing success, upgrade submit, and Version Management row updates are not substitutes for that runtime Designer proof.
