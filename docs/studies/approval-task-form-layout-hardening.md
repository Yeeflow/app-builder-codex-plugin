# Approval Task Form Layout Hardening

## Source Incident

An AP Approval demo application generated with the Yeeflow App Builder plugin imported successfully, but the approval workflow could not publish. Yeeflow reported:

```text
Configuration error on node Department Budget Approval - Muhammad Sufyan: TaskUrl is null
```

The user-confirmed runtime fix was to use the correct task page shape for Assignment Task workflow nodes. The task page referenced by the assignment node must have outer `pagetype: 1`, the task node should also carry `pagetype: 1`, and the task form reference should be mirrored across `taskurl`, `taskUrl`, and `TaskUrl`.

## Root Cause

The generated approval workflow relied on task page references that were not hardened enough for publish-time validation. Import accepted the package, but workflow publish treated the task page link as missing/null because the task page shape and alias coverage did not match the runtime-accepted task form linkage.

## Fixed Behavior

- Every Assignment Task node references an existing task form/page.
- Every Claim Task node references an existing task form/page.
- The referenced task page is a `pageurls[]` task page and has outer `pagetype: 1`.
- Assignment Task and Claim Task workflow nodes carry `properties.pagetype = 1`.
- `taskurl`, `taskUrl`, and `TaskUrl` are mirrored to the same task page ID.
- Missing/null TaskUrl is a generated-package hard error.
- A task page with outer `pagetype: 2` is a hard error when used by Assignment Task or Claim Task.

## Publish Flag Lesson

Generated approval forms should be published by default unless the user explicitly asks for draft output. Final generated packages should set publish/deploy state consistently:

- `Data.Forms[].Deployed = true`
- `Data.Forms[].Status = 1`
- `DefResource.deployed = true` where present
- `DefResource.status = 1` where present
- `DefResource.published = true` where present

Unpublished generated approval forms are allowed only when an explicit draft mode is requested.

## Layout Quality Lessons

- Grid/flex_grid controls used only for layout should turn off captions by default with `displayLabel: [null, false]`.
- Visible Grid captions should be generated only when the user explicitly asks for a titled grid.
- Use Grid/flex_grid for structured field alignment.
- Use container/card blocks for route summaries, KPI blocks, status chips, and horizontal information blocks.
- Submission forms should focus on submitter inputs and business context.
- Internal routing details, approval routing, budget owner, finance approver, and decision notes should not appear on submission forms unless requested.
- Task/approval pages may show routing details and reviewer decision sections.
- Generated approval forms should include a header/summary section, clear field grouping, containers/cards for business context, aligned input grids, and reviewer-specific task-page sections.

## Validator And Generator Rules Added

The package, graph, workflow-action, and approval-form validators now enforce generated-final readiness for task page references, task-page `pagetype`, task-node `pagetype`, TaskUrl alias mirroring, approval form publish flags, and layout-grid caption quality. Generator guidance now requires published approval forms by default, task-page reference preflight before handoff, caption-off layout grids, container/card route summaries, and no internal approval routing on submit pages unless requested.

## Proof Boundary

- AP demo task pagetype publish fix: user-confirmed externally.
- AP demo packages and generator were available locally and inspected read-only; package artifacts were not committed.
- Validator/generator hardening: implemented locally and covered by synthetic normalized references/checks.
- Broad workflow execution, routing, task action behavior, email delivery, and data mutation are not proven by this study.
