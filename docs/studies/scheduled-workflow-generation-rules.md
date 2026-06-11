# Scheduled Workflow Generation Rules

Source export: `/Users/Renger/Downloads/AI Agent and Copilot Local Resource Baseline8.yap`

Classification: generation guidance from export-proven structure plus generated import/open/designer runtime proof for the safe local baseline. A later user-confirmed function test passed, but the exact execution scope is not yet documented, so schedule trigger execution, email delivery, manual run behavior, and AI execution should not be claimed separately from that result.

## Minimal Shape

To generate a Scheduled Workflow resource, include an app-level `Data.Forms[]` entry with:

- `Name`
- `Key`
- `AppID`
- `ListID = 0`
- `ProcModelID`
- `DefResource` JSON string
- `WorkflowType = 3`
- `Settings` JSON string
- `Deployed` value aligned to intended runtime behavior

The `DefResource` should include:

- `childshapes[]`
- `variables.basic`, `variables.listref`, `variables.filter`
- `pageurls[]`
- `defkey`
- `workflowType = 3`
- `AppListSetID`
- graph position/zoom metadata

## Safe Baseline Decision

The safe baseline branch generated `scheduled-workflow-safe-runtime-baseline.v1.yap` and proved import/open/designer rendering in Yeeflow. Use this as the current minimal generated Scheduled Workflow baseline:

- app: `Scheduled Workflow Safe Runtime Baseline`
- local list: `Runtime Ideas`
- AI Agent: `Email generation`
- Scheduled Workflow: `Safe scheduled idea summary`
- workflow graph: `Start -> QueryData -> AI -> MailTask -> End`
- schedule: far-future weekly Monday/Wednesday, `11:59PM`, with `Deployed = false`
- recipient: `<REDACTED_SAFE_TEST_EMAIL>`
- no external connections or credentials

The generated package imported, opened, displayed the local list, listed the Scheduled Workflow resource, opened the workflow detail page, rendered recurrence settings and variables, opened the workflow designer, and opened the `QueryData`, `AI`, and `MailTask` configuration panels. User-confirmed function test passed; exact execution scope not yet documented.

Do not claim that a non-deployed or far-future schedule can never execute under all tenant/runtime conditions. Treat this as an import/open-safe runtime baseline, not an execution baseline.

## Candidate Execution Baseline

Only after explicit safe test scope is available, generate a separate execution baseline:

- one harmless local data list
- one local AI Agent with no external tools
- one Scheduled Workflow with `QueryData`, `AI`, and `MailTask`
- safe test recipient controlled by the test tenant
- schedule disabled until manually triggered, or configured for a clearly safe manual execution path
- explicit confirmation before running the workflow
- fresh ID family and fresh workflow node IDs

## Validator Gates

- package validation
- graph validation
- workflow action configuration validation
- scheduled recurrence settings validation
- `QueryData` list reference validation
- `AI` Agent reference validation
- `MailTask` recipient risk scan
- expression/button HTML reference scan
- ReplaceIds scope check
- raw export and secret scan

For import/open-safe generated baselines, an `AI` workflow node that resolves to a bundled local Agent and contains no credentials should be reported as a runtime-sensitive dependency, not as a package-blocking validation error. Missing Agent references, unresolved `QueryData` list targets, unsafe recipients, embedded secrets, or credential-bearing external actions remain blockers.

## Start and Assignment Task Action Addendum

`Workflow Actions Runtime Baseline (1).yap` adds a quick export-proven Scheduled Workflow comparison for Start and Assignment Task actions:

- one Scheduled Workflow resource with `WorkflowType = 3`, `ListID = 0`, parseable schedule `Settings`, and parseable `DefResource`
- one `StartNoneEvent` with zero incoming flows, one outgoing flow, `isenabledemail`, `to`, `subject`, `html`, and `taskurl`
- no `terminate`, `terminate-conditions`, or `revoke-conditions` fields on the scheduled Start action
- one `MultiAssignmentTask` with `properties.usertaskassignment[]`
- the scheduled Assignment Task uses one applicant-line-manager expression assignee
- the scheduled Assignment Task has absent `tasktype`, `approveway = "allapprove"`, `approvepercentage = 100`, absent `issequential`, `duedatedefinition = 120`, `isenabledemail = false`, and no `notifyrules`

Generation rules from this addendum:

- Preserve Scheduled Workflow Start email fields when present, but do not add approval-form terminate/recall fields unless a scheduled export proves them.
- Preserve Scheduled Workflow Assignment Tasks as the same `MultiAssignmentTask` family, but only treat the applicant-line-manager expression assignee as export-proven for Scheduled Workflow from this source.
- Do not add data-list field or Created By expression sources to Scheduled Workflow Assignment Tasks unless a scheduled export proves a list/query context that provides those values.
- Do not claim Scheduled Workflow task routing, task creation, email delivery, due-date behavior, or appointed-order behavior without focused runtime proof.

Reference:

- `docs/studies/workflow-scheduled-vs-approval-data-list-actions.md`
