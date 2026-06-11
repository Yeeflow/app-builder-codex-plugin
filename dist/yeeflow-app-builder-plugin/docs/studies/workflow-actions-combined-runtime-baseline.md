# Workflow Actions Combined Runtime Baseline

## Purpose

Create a focused generated baseline for workflow-action runtime testing across approval-form workflows and data-list workflows.

This baseline is designed to prove import/open/designer/publish behavior first. It does not claim task routing, due-date reminder delivery, Start notification delivery, Assignment Task notification delivery, group expansion, or position expansion unless a later safe submit test observes those behaviors.

## Generated Package

| Item | Value |
|---|---|
| Generator | `generate-workflow-actions-combined-runtime-baseline.mjs` |
| Generated package | `workflow-actions-combined-runtime-baseline.v1.yap` |
| App title | Workflow Actions Runtime Baseline |
| Approval form | Workflow Action Approval Test |
| Data list | Purchase Requests Runtime Test |
| Data-list workflow | Purchase Requests Runtime Workflow |
| Package commit policy | generated `.yap` is ignored and not committed |
| Email delivery | out of scope |
| Submit/routing | approval first-task routing tested only after safe direct-user target confirmation |

The package clones tenant-local assignee configuration from studied exports. The generated package must remain uncommitted because it can contain tenant-local assignment references.

## Source Inputs

| Source | Role | Proof level |
|---|---|---|
| `<downloads>/Test ABC (1).yap` | Base approval Assignment Task assignee patterns | export-proven |
| `<downloads>/Test ABC (3).yap` | Approval Start settings plus Complete/due-date task shapes | export-proven |
| `<downloads>/Purchase Requests.ydl` | Data-list workflow Start, Assignment Task, and task form shapes | export-proven |
| Existing validators and inspectors | Local structural checks | validator-backed |

## Selected Scenarios

| Area | Scenario | Intended proof target | Runtime result |
|---|---|---|---|
| Approval Start | allow terminate, allow recall, conditions, email notification config | designer/publish proof | designer-visible and publish-proven |
| Approval Assignment Task | Approval task/default task | designer/publish proof | designer-visible and publish-proven |
| Approval Assignment Task | Complete task `tasktype="complete"` | designer/publish proof | package/publish-proven; dedicated runtime execution not tested |
| Approval Assignment Task | static user, multiple assignees, direct position, position by department/location, user group | designer/publish proof | representative panels designer-visible; package published |
| Approval Assignment Task | Sequential and Parallel appointed order | designer/publish proof | representative panel showed Parallel/Sequential controls; package published |
| Approval Assignment Task | `approveway` and custom percentage | designer/publish proof | package/publish-proven; execution thresholds not tested |
| Approval Assignment Task | due-date hours/days and reminder rules | designer/publish proof | package/publish-proven; scheduler/reminder execution not tested |
| Approval Assignment Task | due-date minutes | exploratory designer proof only; product-documented, not export-proven in studied files | package/publish-proven only |
| Approval Assignment Task | email notification config | designer/publish proof, no delivery | package/publish-proven; delivery not tested |
| Data-list Start | email notification config without terminate/recall fields | designer/publish proof | designer-visible and publish-proven; terminate/recall controls not visible |
| Data-list Assignment Task | Created By/list-field assignee expression | designer/publish proof | designer-visible and publish-proven |
| Data-list task form | normal controls plus list-bound controls | designer/open proof | list/add form controls visible; workflow task-form save/edit not tested |
| Data-list task form | read-only custom list-bound field and native/default field display | designer/open proof | configuration package/publish-proven; task runtime editability not tested |

## Intentionally Excluded

- Email delivery, including Start notification, Assignment Task notification, and due-date reminder email.
- Workflow submission/routing beyond the first safe approval direct-user task.
- User group expansion runtime behavior.
- Position expansion runtime behavior.
- Complete task execution behavior.
- Start terminate/recall execution behavior.
- Due-date scheduler/reminder execution behavior.
- Data-list item submission unless it will not route to unexpected real users.

## Runtime Safety Assumptions

- Use import/open/designer/publish as the first proof gate.
- Do not run Yeeflow API write operations.
- Do not print, save, or commit API keys or raw API responses.
- Do not commit generated packages, raw exports, decoded payloads, private users, emails, phone numbers, tenant IDs, or unredacted org/list IDs.
- If a submit test would route a task to a real user unexpectedly, skip submit and keep the result designer/publish-proven only.

## Safe Submit / Routing Proof

Before submitting, the Yeeflow API Operator directory smoke test was run read-only. The API key and base URL were present, but no key value was printed. Directory/reference endpoints were readable with counts only:

| Category | Readable | Count summary |
|---|---:|---|
| Users | yes | 3 total users reported by the search endpoint |
| Departments | yes | 6 returned |
| Locations | yes | 2 returned |
| Positions | yes | 6 returned |

The generated approval workflow was inspected locally before submit. Its first Assignment Task is `Static User Assignment` with one direct user assignment and no group or position source. The target reference matched a readable user category through API-assisted comparison, but the real user ID, name, and email are intentionally omitted.

One fake approval request was submitted through the published approval form. Yeeflow showed the form submission confirmation, and the Pending tasks list showed a new `Workflow Action Approval Test` task named `Static User Assignment` at the top of the list. This proves the submit path created the first task and routed it to the expected narrow direct-user category for the signed-in safe test context.

The data-list workflow was not submitted. Its first Assignment Task contains mixed assignee sources: a direct user, expression assignees, a user-group source, and a list-item/Created By expression family. Because that could expand beyond one predictable direct test user, data-list submit and Created By/list-field routing remain deferred.

## Local Validation Checklist

| Check | Result |
|---|---|
| Generator syntax check | passed |
| Package generation | passed |
| Package validation | passed with warnings |
| Graph validation | passed with warnings |
| Data-list validation | passed with warnings on standalone extraction |
| Workflow action config validation | covered by package/graph validators and inspectors |
| Assignment Task inspector | passed; 17 Assignment Task nodes found |
| Data-list workflow inspector | passed; one data-list workflow, one Start action, one Assignment Task |
| Wrapper round trip | passed |
| `git diff --check` | passed |
| Safety scan | passed; no raw package, decoded payload, `.env.local`, credentials, or private org data staged |

## Runtime Checklist

| Step | Expected outcome | Result |
|---|---|---|
| Import package | App card appears | passed |
| Open app | App is not empty | passed |
| Open approval form designer | Approval form opens | passed |
| Open approval workflow designer | Workflow nodes render without overlap | passed |
| Inspect approval Start panel | Start settings render | passed; terminate, recall, conditions, and email config visible |
| Inspect approval Assignment Task panels | learned settings render | passed for representative panels; all generated nodes published |
| Publish approval workflow | Publish succeeds if safe | passed |
| Open published approval form | Form opens | passed |
| Open data list | Fields/views render | passed |
| Open data-list workflow designer | Workflow opens | passed |
| Inspect data-list Start panel | email config renders; terminate/recall absent | passed |
| Inspect data-list Assignment Task panel | Created By/list-field assignee and task form render | passed |
| Publish data-list workflow | Publish succeeds if safe | passed |
| Submit approval form request | Fake request submits successfully | passed |
| Confirm first approval task | First task appears in Pending tasks | passed; `Static User Assignment` for `Workflow Action Approval Test` |
| Submit data-list item | Only if first assignee target is narrow and safe | skipped; first data-list task has mixed/broader assignee sources |

## Runtime Result Notes

The imported app opened as `Workflow Actions Runtime Baseline` with the approval form, data list, and overview dashboard available. The approval form rendered the expected request fields and opened from the published form after workflow publish.

The approval workflow designer rendered a readable non-overlapping left-to-right graph. The Start settings panel showed terminate, recall, condition, and email-notification configuration. A representative Assignment Task panel showed the assignee editor, Parallel/Sequential appointed-order controls, task form reference, Approval task / Complete task selector, and completion-condition controls. The approval workflow published successfully. A fake request was submitted after API-assisted safety checks confirmed the first task was a single direct-user assignment. The first pending task was created with the expected `Static User Assignment` label. Later-task routing, completion thresholds, appointed-order execution, Complete task execution, due-date scheduler behavior, and email delivery remain untested.

The data list rendered its fields and views. The data-list workflow designer rendered a Start -> Assignment Task -> End graph. The data-list Start panel showed email-notification configuration and did not show terminate/recall controls. The data-list Assignment Task panel showed mixed assignee sources including a list-item / Created By expression source, a task form reference, appointed-order controls, task type selector, and completion-condition controls. The data-list workflow published successfully. No list item was saved or submitted because the first Assignment Task has mixed direct/expression/user-group/list-item sources, so Created By/list-field routing, manager expansion, group expansion, list-bound task-form save/edit behavior, and email delivery remain untested.

All private assignee/user values observed in the tenant UI are intentionally omitted from this document.

## Proof Boundary Table

| Claim | Current allowed status |
|---|---|
| Package structure passes local validators | validator-backed with warnings |
| Approval Start configuration can import/open/publish | designer/publish-proven |
| Assignment Task configuration can import/open/publish | designer/publish-proven for generated configuration family |
| Data-list Start and Assignment Task configuration can import/open/publish | designer/publish-proven |
| First approval direct static-user routing | runtime-proven for one safe submitted request |
| Group, position, and list-field routing | not tested |
| Sequential/Parallel execution behavior | not tested |
| Complete task execution behavior | not tested |
| Email delivery | not tested |
| Due-date scheduler/reminder execution | not tested |
