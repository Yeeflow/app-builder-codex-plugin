# Scheduled Workflow Runtime Test Plan

Source export: `<downloads>/AI Agent and Copilot Local Resource Baseline8.yap`

Current milestone: generated import/open/designer runtime baseline is partially proven by Codex-observed testing. The workflow was imported and opened, but Codex did not intentionally run the schedule, send email, or execute AI.

Follow-up result: User-confirmed function test passed; exact execution scope not yet documented.

## Generated Safe Runtime Baseline

Generated artifact, kept out of git: `scheduled-workflow-safe-runtime-baseline.v1.yap`

Generated app: `Scheduled Workflow Safe Runtime Baseline`

Runtime test date: 2026-05-19

Runtime environment: `https://<yourdomain>.yeeflow.com/`

Generated resources:

- one local data list: `Runtime Ideas`
- one AI Agent: `Email generation`
- one Scheduled Workflow: `Safe scheduled idea summary`
- one dashboard/page: `Runtime Baseline`

The generated workflow uses a far-future non-deployed weekly schedule:

- period: `01/01/2099 ~ 31/01/2099`
- repeat: every `1` week
- selected days: Monday and Wednesday
- time: `11:59PM`
- timezone: Singapore Standard Time in package settings

The workflow graph is:

`Start -> Query Data -> AI assistant -> Send Email -> End`

The generated `Send Email` action uses only the reserved safe test recipient `workflow.safe.test@example.com`.

Codex-observed runtime result: partial. Import/open/designer rendering is runtime-proven by Codex; execution was not tested by Codex.

User-confirmed result: User-confirmed function test passed; exact execution scope not yet documented. Until the exact tested path is documented, do not separately claim email delivery, AI Assistant execution, schedule trigger execution, manual run behavior, or workflow-triggered AI Agent execution.

Observed runtime proof:

- package imported into the `AI Generation` workspace
- app appeared as `Scheduled Workflow Safe Runtime Baseline`
- app opened and was not an empty shell
- `Runtime Ideas` opened and rendered two harmless sample rows
- Application Settings showed one Scheduled Workflow resource with key `SWRT`
- Workflow Definition listed `Safe scheduled idea summary` as a Scheduled workflow
- workflow detail page rendered recurrence settings and workflow variables
- variables rendered: `EmailBody`, `EmailSubject`, `QueryAmount`, `QueryItems`, plus system attachment variable
- workflow designer opened
- designer rendered `Query Data`, `AI assistant`, `Send Email`, `Start`, and `End` nodes
- `Query Data` node opened and targeted the local `Runtime Ideas` list
- `AI assistant` node opened, used `Call AI agent`, referenced `Email generation`, accepted `Query Items`, and mapped outputs to `Subject` and `Body Content`
- `Send Email` node opened and displayed `workflow.safe.test@example.com`, `Workflow Variables:Subject`, and `Workflow Variables:Body Content`

Actions intentionally not tested by Codex:

- Publish
- schedule trigger
- manual workflow run
- email send
- AI Assistant execution

## Local Gates

Before any runtime import:

1. Decode the `.yap` with large numeric IDs preserved as strings.
2. Create redacted normalized references.
3. Run package validation in compatibility or generator mode as appropriate.
4. Run graph validation.
5. Confirm `QueryData` list references resolve.
6. Confirm `AI` action Agent references resolve.
7. Confirm fixed email recipients are safe or redacted and not executed.
8. Confirm the schedule cannot run automatically during import/open testing.

## Safe Runtime Checks

Safe checks for a future generated package:

- package imports
- app opens and is not an empty shell
- Scheduled Workflow resource appears
- Scheduled Workflow designer opens
- recurrence settings render correctly
- timezone renders correctly
- working-days-only setting renders correctly when present
- Query data action opens and targets the local list
- AI Assistant action opens and references the local Agent
- Send email action opens and displays safe recipient/subject/body configuration
- workflow variables are visible

## Blocked Checks

Blocked unless explicitly safe:

- triggering the schedule
- running the workflow
- sending email
- executing the AI Assistant action against live AI
- using real recipients
- using tenant/private data in email content

## Classification

Use these labels:

| Label | Meaning |
| --- | --- |
| validation-only | Decode, documentation, and local validation only. |
| partial | Import/open/configuration renders, but schedule/email/AI execution is skipped. |
| runtime-proven | Import/open and explicitly safe non-private execution pass. |
| blocked | Runtime would send real email, call live AI unexpectedly, or execute a schedule unsafely. |

For the `Scheduled Workflow Safe Runtime Baseline`, keep the evidence split explicit:

- Codex-observed proof: import/open/designer rendering.
- User-confirmed proof: function test passed; exact execution scope not yet documented.
