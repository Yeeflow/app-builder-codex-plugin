# Set Variable Runtime Preflight Hardening Training Report

## Incident Inputs

The focused runtime proof demonstrated Approval Submission Form Action Set Variable behavior, then stopped a Workflow `SetVariableTask` candidate before signing. The candidate passed Set Variable plan, Approval publish-readiness, and workflow layout gates, but `validate-generated-yapk-export-shape.mjs` emitted `APPROVAL_WORKFLOW_TASKURL_MISSING` and `APPROVAL_TASK_ASSIGNEE_METADATA_MISSING` for the system Set Variable node.

The same run also showed that the App Plan used `Approval Submission` / `Approval Form`, while the shared materializer matched only the literal `Approval`. Valid planned actions could therefore be accepted by planning validation and silently omitted during generation. A focused upgrade also required manual removal of an unchanged installed Form report and its matching navigation item.

## Learned Contracts

1. Human task validation is stencil-specific. Only `MultiAssignmentTask` and `CandidateTask` require assignee and task-page metadata. A `SetVariableTask` requires workflow-variable settings, never fabricated human-task metadata.
2. Form Action Set Variable Host Type uses one shared alias-to-canonical contract across planning and materialization. Unknown or contradictory host values are hard errors; planned records cannot be silently ignored because of vocabulary drift.
3. Focused non-Report upgrades materialize scope before signing. Only unchanged installed Form reports are omitted automatically. New or changed reports remain present and are rejected unless report scope and proof are declared.
4. Every approval-aware validator must share the same human-task classification. Upgrade scope validation must not reintroduce broad `/task/i` matching; it resolves `MultiAssignmentTask` / `CandidateTask` routes through referenced SequenceFlows and treats `SetVariableTask` as a system action.
5. Approval page shell checks inspect semantic `name` / `nv_label` recursively so canonical `Main > Content` nesting with UUID control IDs passes. Focused upgrade wrappers replace missing or numeric PackageId metadata with a new UUID and clear the stale signature before signing.

## Regression Proof

- `test-generated-yapk-export-shape-materialization-gates.mjs` proves a real `MultiAssignmentTask` still requires assignee metadata while `SetVariableTask` does not require assignee or `taskurl`.
- `test-set-variable-golden-reference-gates.mjs` proves Approval aliases materialize, unsupported Host Type fails planning, and conflicting canonical hosts fail materialization.
- `test-yapk-upgrade-scope-hard-gates.mjs` proves unchanged report/navigation omission and proves changed reports are not hidden.
- The upgrade-scope suite also proves nested UUID-ID `Main > Content`, SequenceFlow-resolved Approved/Rejected paths, SetVariableTask exclusion from human-task gates, and numeric PackageId replacement.
- The original runtime candidate `query-data-runtime-baseline-0951-20260712.set-variable-v1.3-report-omitted.yapk` passes the corrected generated-export-shape validator.

## Proof Boundary

These results remove false pre-signing blockers and close silent materialization gaps. They do not execute the Workflow `SetVariableTask`, prove live variable mutation, or prove Version Management success for a future upgrade. Those remain separate runtime proof steps.
