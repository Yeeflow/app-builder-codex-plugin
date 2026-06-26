# Workflow Actions Batch Runtime Baseline

## Purpose

This focused runtime baseline proves import/open/designer/publish behavior for the recently learned workflow actions:

- Claim Task / `CandidateTask`
- Set variable / `SetVariableTask`
- Set data list / `ContentList`
- Signal event / `SignalEvent`

This is not workflow execution proof. No approval request was submitted, no data-list record was created, no task was claimed, no task operation was run, no recall/terminate event was triggered, no Set variable mutation was executed, no Set data list add/edit/remove action was executed, and no email was sent.

## Package

| Item | Value |
|---|---|
| Generated app | `Workflow Actions Batch Runtime Baseline` |
| Generator | `tools/generators/generate-workflow-actions-batch-runtime-baseline.mjs` |
| Generated package | `/Users/Renger/Documents/Codex Projects/AI Agent and Copilot templates - runtime/workflow-actions-batch-runtime-baseline.v1.yap` |
| Import-test copy | `/Users/Renger/Downloads/workflow-actions-batch-runtime-baseline.v1.yap` |
| Source model | `/Users/Renger/Downloads/Workflow Actions Runtime Baseline (6)_Signal event.yap` |
| Branch | `codex/workflow-actions-batch-runtime-baseline` |
| Proof date | 2026-05-24 |

The generated `.yap` package is ignored and must remain uncommitted.

## Generated Resources

| Resource | Purpose |
|---|---|
| `Workflow Action Batch Approval Test` | Approval-form host for Claim Task, Set variable, Set data list, and Signal event proof. |
| `Purchase Requests Batch Runtime Test` | Data-list host for Claim Task, Set variable with list-field value, and Set data list current/select proof. |
| `Products Batch Runtime Test` | Selected target data list for Set data list add/edit/remove and cleanup configurations. |
| `Save Sub Items Batch Runtime Test` | Target list for sub-list/detail-row to multiple-record mapping shape. |
| `Batch Variable Target Approval` | Structural target for another-approval-workflow Set variable configuration. |

## Local Validation

| Check | Result |
|---|---|
| `node --check tools/generators/generate-workflow-actions-batch-runtime-baseline.mjs` | passed |
| package validation in compatibility mode | passed with warnings, 0 errors |
| graph validation in compatibility mode | passed with warnings, 0 unresolved edges/cycles |
| workflow action config validation | passed |
| Claim Task inspector | passed; 2 `CandidateTask` nodes found |
| Set variable inspector | passed; 3 `SetVariableTask` nodes found |
| Set data list inspector | passed; 8 `ContentList` nodes found |
| Signal event inspector | passed; 1 `SignalEvent` node found |
| task form inspector | passed |
| expression smoke check | passed |
| wrapper round trip | passed |
| `git diff --check` | passed |
| `git fsck --no-reflogs` | passed |

Expected warnings remain compatibility/runtime-boundary warnings, including tenant-sensitive receiver references, lookup-target placeholders, and runtime-unproven ContentList sub-list/expression behavior.

## Runtime Result

| Area | Result | Proof label | Evidence |
|---|---|---|---|
| Package import | succeeded | import-proven | Yeeflow imported the generated `.yap` and showed the app. |
| App open | succeeded | open-proven | `Workflow Actions Batch Runtime Baseline` opened in Yeeflow. |
| Approval form open | succeeded | open-proven | `Workflow Action Batch Approval Test` opened. |
| Approval form designer | succeeded | designer-proven | Form designer opened. |
| Approval workflow designer | succeeded | designer-proven | Workflow rendered with Claim Task, Set variable, Set data list, Signal event, and End nodes. |
| Approval workflow publish | succeeded | publish-proven | Publish dialog completed with success message. |
| Data list open | succeeded | open-proven | `Purchase Requests Batch Runtime Test` opened with fields visible and no runtime record creation. |
| Data-list workflow designer | succeeded | designer-proven | Data-list workflow rendered with Claim Task, Set variable, Set data list current/select nodes, and End node. |
| Data-list workflow publish | succeeded | publish-proven | Publish dialog completed with success message. |

During UI inspection, an accidental extra unconnected Claim Task node was briefly dropped in each designer while opening settings. In both cases it was immediately deleted before publishing. The published workflows used the intended generated graph.

## Action Proof Table

| Action | Generated proof target | Runtime result | Proof level | Not proven |
|---|---|---|---|---|
| Claim Task / `CandidateTask` | Approval and data-list Claim Task nodes with receiver/candidate config and task form selection. | Nodes rendered; config panels opened. Approval panel showed candidate receiver and task form. Data-list panel showed direct user, applicant line manager, and Created By line manager candidate expressions plus task form. | designer-proven / publish-proven | claim execution, claim locking, pending-task routing, approve/reject/complete after claim, quick completion, email delivery |
| Set variable / `SetVariableTask` | Approval current-workflow variable setting, another-approval-workflow target setting, and data-list list-field value setting. | Nodes rendered; config panels opened. Current workflow and another workflow settings displayed; data-list variable setting panel displayed current-workflow mode. | designer-proven / publish-proven | variable mutation, another workflow instance mutation, submitted form ID runtime resolution |
| Set data list / `ContentList` | Approval selected-list add/edit/remove/sub-list patterns, Signal-event cleanup branch, data-list current-list mode, and selected-list mode. | Nodes rendered; config panels opened. Selected-list add showed target app/data source and Add. Data-list current-list panel showed Current list and Field Settings. | designer-proven / publish-proven | add/edit/remove execution, current-list mutation, sub-list row iteration, numeric operation execution, document-library mutation |
| Signal event / `SignalEvent` | Approval workflow Signal event with no incoming flow, one outgoing flow, and cancel/revoke eventdefinitions. | Node rendered in approval workflow. Config panel opened with Canceled and Recalled selected. Visual graph showed no incoming line and one outgoing line to cleanup branch. | designer-proven / publish-proven | recall/terminate triggering, event firing, downstream cleanup execution |

## Proof Boundary

Proven:

- generated package imports
- app opens
- approval form opens
- approval form designer opens
- approval workflow designer opens
- data list opens
- data-list workflow designer opens
- target action nodes render
- sampled target action config panels open
- approval and data-list workflows publish successfully

Not tested:

- Claim Task claiming or claim ownership locking
- Pending Tasks or Claim Tasks routing
- approve/reject/complete/reassign/add-assignee execution
- Set variable mutation
- Set data list add/edit/remove mutation
- sub-list row iteration execution
- Signal event recall/terminate triggering
- downstream cleanup execution
- email notification delivery
- Products new-item workflow trigger execution

## Known Warnings And Gaps

- Receiver references remain tenant-sensitive and should not be reused as broad execution proof.
- Another-approval-workflow Set variable target was proven as designer/publish configuration only; no submitted target request was mutated.
- Set data list remove/delete was only opened and published as configuration. Destructive execution remains deferred.
- Sub-list/detail-row mapping was locally validated and published, but row iteration and record count behavior were not executed.
- No document-library Set data list target was included because the export studies did not prove a document-library target shape.

## Recommended Next Steps

Merge this branch after review if the validation and safety scan remain clean. Rebuild the Yeeflow App Builder Plugin after merge so plugin users receive the combined runtime proof, generator, docs, validators/inspectors, and skill guidance.

Future runtime execution should be split into smaller safe baselines:

- Claim Task claim/ownership proof with safe receiver pool
- Set variable mutation proof with disposable approval requests and target form IDs
- Set data list add proof against a disposable target list
- Set data list edit proof against one known disposable row with a narrow filter
- Signal event recall/terminate proof only after disposable request and cleanup target records are prepared
