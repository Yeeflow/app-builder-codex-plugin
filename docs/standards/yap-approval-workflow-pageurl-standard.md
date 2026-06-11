# YAP Approval Workflow PageUrl Standard

Official version: 0.6.22

## Canonical Rule

Generated approval-form YAP packages must include complete request-page and task-page registration before the package is returned. `schemas/yap-schema.json` is a must-pass schema, and workflow validators are must-pass generated-final gates.

## Request Page

The request page should use a UUID-shaped `pageurls[].id` unless an export-proven alternative is intentionally documented. It must include:

- non-empty `key`
- non-empty `pageUrl`, `pageurl`, and `PageUrl` aliases
- `type = 1`
- outer `pagetype = 1`
- embedded `formdef.pagetype = 1`

`StartNoneEvent.properties.taskurl`, `taskUrl`, and `TaskUrl` must resolve to the request page id.

## Task Page

The approval task page must include:

- non-empty `key`
- non-empty `pageUrl`, `pageurl`, and `PageUrl` aliases
- `type = 2`
- outer `pagetype = 1`
- embedded `formdef.pagetype = 2`

Real approval workflows must include a task node such as `MultiAssignmentTask`. Task nodes must carry a valid `approveway`, mirrored `taskurl` aliases, and non-empty export-shaped `usertaskassignment`.

Approved and rejected paths should be generated when the approval design requires rejection handling, including `EndRejectEvent`. Approval pages should include workflow controls such as `workflowControlPanel` and `workflowHistory`.

## Proof Boundary

`validate-yap-graph.js` is authoritative for approval workflow graph validation. Generic form/workspace inspectors are structural helpers and must not override a passing graph validator when a real approval workflow routes through assignment tasks instead of the minimal `StartNoneEvent -> EndNoneEvent` pattern.

Generated readiness requires schema pass, generated-final package validation, workflow graph validation, and clear proof-boundary reporting. API acceptance or queued import is not runtime render proof.
