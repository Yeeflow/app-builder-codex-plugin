# Approval Workflow Condition And Upgrade Proof Training Report

## Trigger

Business Travel Request validation showed two separate issues that must not be collapsed into one success claim:

- The generated Approval workflow could contain fields and still fail Designer publish because Assignment Task completion conditions were emitted as simplified `{ label, value }` objects instead of Designer-readable task Outcome expressions.
- A repaired package could fresh-install and publish successfully, while an existing-app upgrade reported Version Management `Succeed` without the live Designer workflow reflecting the updated `ProcModel` / `DefBlob`.

## Root Causes

- The full-app materializer generated Approved and Rejected `SequenceFlow.properties.conditioninfo[]` rows as simplified labels and values. Designer publish requires a condition row with `left`, `op`, and `right`, where `left` references the current `MultiAssignmentTask` Outcome, `op` is `s.=`, and `right` is the matching task outcome button.
- Applicant line-manager assignment must use the export-proven `ApplicantUserID` + `LineManager` expression shape. Legacy variable shortcuts are not sufficient proof for generated-final Approval workflows.
- The previous upgrade proof boundary treated Version Management final status as stronger evidence than it is. `Succeed` proves package processing, not that the live Approval workflow Designer loaded the new DefBlob or can publish.

## Training Changes

- `scripts/materialize-full-app-generated-final.mjs` now emits:
  - `ApplicantUserID` as a workflow variable.
  - Applicant line-manager assignee expressions based on `ApplicantUserID`.
  - `Line manager approval` Assignment Task naming.
  - Approved and Rejected SequenceFlow condition rows with `key`, `pre`, `left`, `op`, and `right`.
  - `linetype: "rounded"` on outcome transitions.
- `scripts/validate-approval-workflow-publish-readiness.mjs` now rejects:
  - missing Approved/Rejected outgoing flows from each `MultiAssignmentTask`;
  - missing outcome `conditioninfo[]`;
  - simplified `{ label, value }` outcome condition rows;
  - outcome conditions whose `left` does not reference the current task id and Outcome;
  - outcome conditions whose `op` is not `s.=`;
  - Approved paths that do not target `EndNoneEvent`;
  - Rejected paths that do not target `EndRejectEvent`.
- `scripts/inspect-yapk-upgrade-version-row.mjs` now supports Approval workflow upgrade proof:
  - when evidence includes `expectedApprovalWorkflow`, the runtime proof must include a live Designer/DefBlob summary;
  - Designer open and publish-success evidence are required;
  - task, assignee, Approved condition, and Rejected condition summaries must match the upgraded package.

## Regression Coverage

- `scripts/test-approval-workflow-publish-readiness-gates.mjs`
  - passes the materialized package workflow;
  - fails simplified `{ label, value }` Completion conditions;
  - fails outcome conditions that do not reference the current task id.
- `scripts/test-yapk-upgrade-scope-hard-gates.mjs`
  - fails Version Management `Succeed` evidence for Approval workflow upgrades when live DefBlob proof is missing;
  - passes when the runtime proof includes Designer open, publish success, and matching live DefBlob summary.

## Proof Boundary

Fresh install proof and upgrade proof remain separate:

- Fresh install proof can prove that the package content is publish-ready.
- Upgrade proof must prove that the existing live app was actually overwritten.
- API status `0`, `upgrade_submitted`, and Version Management `Succeed` are not runtime Designer proof.
- Browser/Designer evidence must be scoped to the exact package/app/workflow identity under test.
