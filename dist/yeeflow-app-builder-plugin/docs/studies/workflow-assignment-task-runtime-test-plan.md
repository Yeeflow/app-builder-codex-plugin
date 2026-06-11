# Workflow Assignment Task Runtime Test Plan

## Purpose

Plan a future focused runtime baseline for Assignment Task assignee routing. This plan is not runtime proof. The current evidence is export-proven, API-category-assisted, product-documented, and validator-backed only.

## Scope

Use the smallest approval app that can safely test Assignment Task routing classes without exposing private identities. Runtime work must not happen on the export-learning branch unless explicitly requested.

Test scenarios:

| Scenario | Purpose | Data requirement | Proof target |
|---|---|---|---|
| Static single user | Confirm `type=user`, `method=direct` creates a task for a safe user | explicitly authorized safe user | task routes to intended safe assignee |
| Multiple static users | Confirm multiple direct users in `usertaskassignment[]` | two or more safe users | task creation and completion behavior |
| Direct job position | Confirm direct position assignee expansion | safe position with known test member(s) | task routes to position holder(s) |
| Position by department | Confirm selected department + position routing | safe department and position mapping | task routes to matching role |
| Position by location | Confirm selected location + position routing | safe location and position mapping | task routes to matching role |
| Applicant line manager | Confirm applicant context lookup | safe applicant with safe manager | task routes to manager |
| Applicant department manager | Confirm applicant department manager lookup | safe applicant department with manager | task routes to department manager |
| User group expression | Confirm group expansion if safe group exists | disposable or explicitly safe user group | task routes to group members |
| Sequential appointed order | Confirm `issequential=true` order | two safe assignee sources | first assignee receives task before next |
| Parallel/default appointed order | Confirm absent `issequential` fan-out | two safe assignee sources | all applicable assignees receive tasks together |
| Custom percentage completion | Confirm `approveway=custompercentage` + `approvepercentage` | safe multi-assignee task | completion threshold behavior |
| Email notification enabled | Designer/open proof first; delivery only if explicitly scoped | safe notification recipient/sandbox | configuration persists; delivery not assumed |
| Complete task type | Confirm `tasktype=complete` renders and can complete when safe | safe assignee and disposable request | Complete button and outgoing-flow behavior |
| Due date custom hours | Confirm `duedatedefinition` + `duedatetype=hour` persists | no email delivery | designer/open proof first |
| Due date custom days / working days | Confirm `duedatetype=day` and `isfromworkcalendar` persist | working calendar not executed | designer/open proof first |
| Due date expression | Confirm `duedatetype=express` and `duedateexpress` persist | safe date variable | designer/open proof first |
| Due-date reminders | Confirm `notifyrules[]` before/on/after shapes persist | email delivery disabled unless scoped | configuration proof only |
| Start allow terminate | Confirm Start `terminate` and `terminate-conditions` render | disposable request only if later scoped | designer/open proof first |
| Start allow recall | Confirm `revoke-conditions` render | disposable request only if later scoped | designer/open proof first |
| Start email notification | Confirm Start `isenabledemail/to/subject/html` render | no delivery unless scoped | configuration proof only |
| Data-list Start email notification | Confirm data-list Start notification config persists without terminate/recall fields | disposable list workflow package; no delivery unless scoped | designer/open proof first |
| Data-list Created By assignee | Confirm list-item Created By expression can be used as task assignee source | safe created-by record and safe manager mapping | routing proof only when safe |
| Data-list task form list fields | Confirm task form renders custom and native/default list-bound fields | disposable list item | designer/open proof first |
| Data-list readonly custom field | Confirm custom list-bound read-only config persists | disposable list item | designer/open proof first |

## Safety Rules

- Do not use real private users unless explicitly authorized and safe.
- Do not send email unless notification delivery is explicitly scoped and recipients are safe.
- Do not test due-date reminder or Start notification delivery unless safe recipients and delivery scope are explicitly approved.
- Do not commit request records, raw API responses, raw exports, screenshots with private identities, or `.env.local`.
- Use `yeeflow-api-operator` only for authorized read-only lookup of users, departments, locations, positions, groups, group members, and position assignments.
- Use the assignment-routing API coverage helper before runtime setup to confirm that safe target users/groups/positions are readable. This still does not prove workflow routing.

## Validation Before Runtime

Before import or live workflow execution:

- run package validation in compatibility/generator mode as appropriate
- run graph validation
- run workflow action config validation
- run assignment assignee inspection
- run secret/private-data safety scans
- verify generated package contains no private user/org data unless explicitly required and safe

## Proof Boundary

Runtime proof requires import/open plus actual disposable request execution for routing scenarios. Designer visibility, package validation, and API category lookup are not enough to claim routing behavior.

## Baseline Attempt Result

The focused generator `generate-assignment-task-assignee-runtime-baseline.mjs` produced `assignment-task-assignee-runtime-baseline.v1.yap` with 11 Assignment Task nodes and fresh package IDs. Local validation passed with warnings, and the generated package remains ignored/uncommitted.

The first runtime attempt imported and opened the generated app, opened the workflow designer, and showed Assignment Task panels. Sequential appointed order rendered as selected for the sequential task. Parallel/default tasks rendered with Parallel selected when `issequential` was absent. The email notification task opened in the designer, but email delivery was not tested.

Publish was blocked by the designer error `The input line of Sequential Multiple Assignees is missing.` A rebuilt package used native-looking shape IDs plus incoming/outgoing sequence-flow references and passed local validation, but duplicate package/app identity interference prevented a clean second open/publish proof in the same pass.

The V2 follow-up used a unique package identity and full process-model ID remapping. It imported, opened, rendered a non-overlapping left-to-right workflow, published successfully, and opened the published form. Request submission was not run because the copied assignee references can route live tenant users/groups/positions.

Before any request-submit runtime baseline, select safe test-only assignees or explicitly authorized target users/groups/positions. Keep email delivery out of scope unless safe recipients and delivery scope are explicitly approved.

## Complete Task, Due Date, And Start Action Additions

`Test ABC (2).yap` and `Test ABC (3).yap` add export-proven configuration that should be folded into the next focused baseline:

- Complete task designer/open proof for `tasktype="complete"`.
- Complete task submit/complete proof only after safe assignee references are selected.
- Due-date designer/open proof for `hour`, `day`, `express`, and working-calendar flag.
- Due-date reminder configuration proof for before/on/after due date; email delivery remains out of scope by default.
- Start action designer/open proof for allow terminate, allow recall condition rows, and Start email notification configuration.
- Start action runtime proof for terminate/recall/condition gating should be separate from assignee routing unless the package remains small and safe.

`minute` due dates and Automatic Treatment due-date actions should not be included in a schema-proof baseline until a focused export proves their serialized shape.

## Data-List Workflow Additions

`Purchase Requests.ydl` extends the next combined baseline with data-list workflow action coverage:

- Start action should be tested as a data-list workflow Start action, not copied from approval-form workflow Start settings. The studied data-list Start has email notification fields and no terminate/recall fields.
- Assignment Task should include a list-item assignee expression, especially Created By or Created By line manager, only when safe disposable list records and safe user/manager mappings are available.
- Task form designer/open proof should confirm normal task-form controls and list-bound controls render together.
- Custom list fields marked read-only should remain read-only in the designer/opened task form.
- Default/native list fields should remain treated as read-only from export study only until designer/runtime proof confirms broader behavior.

Do not submit data-list workflow records or send notification email until safe test recipients and safe assignee routing are explicitly scoped.

## Scheduled Workflow Start and Assignment Task Follow-Up

`Workflow Actions Runtime Baseline (1).yap` export-proves one Scheduled Workflow with `WorkflowType = 3`, a Start action, and one Assignment Task. This quick study does not run a runtime baseline.

Future Scheduled Workflow runtime proof should be a separate focused pass and should start with configuration-only safety:

- import/open/designer proof for a non-deployed or far-future Scheduled Workflow
- Start action panel proof for email config and absent terminate/recall fields
- Assignment Task panel proof for applicant-line-manager expression assignee
- publish proof only if the schedule is safe, disabled, or far-future and no notification delivery is triggered
- no workflow execution, manual run, task routing, or email delivery unless explicitly scoped with safe recipients and safe assignee targets

Do not combine Scheduled Workflow execution proof with approval/data-list routing proof until each path has a safe test plan.

## Approval Workflow Task Form Follow-Up

`Workflow Actions Runtime Baseline (2)_Task forms.yap` adds export-proven task-form patterns that should be covered by a future focused runtime baseline:

- submission form plus multiple task forms in `Data.Forms[].DefResource.pageurls[]`
- copied readonly task form used for approve/reject or complete-only task review
- task-specific form with copied readonly request fields and additional editable task-owner fields
- standard Action Panel on submission and task forms
- custom buttons replacing Action Panel on approval task forms
- custom complete button replacing Action Panel on complete task forms
- Submit form operations for approve, reject, reassign, add assignee, and complete
- task form association through `MultiAssignmentTask.properties.taskurl`

Runtime scenarios to add:

| Scenario | Purpose | Proof target | Safety note |
|---|---|---|---|
| copied readonly task form | prove task opens with copied controls readonly | designer/open first, then task open if safe | no submit required for first pass |
| editable task-owner fields | prove task form can expose selected editable controls | designer/open first | save/edit behavior needs separate proof |
| standard Action Panel approval | prove derived Approve/Reject panel behavior | task open plus safe approve/reject only if scoped | do not route broad users |
| standard Action Panel complete | prove derived Complete button behavior | task open plus safe complete only if scoped | Complete execution still unproven |
| custom approve/reject buttons | prove action-button to Submit form mapping | execute only with disposable request and safe user | no email delivery |
| custom reassign/add assignee | prove user-picker-backed Submit form operations | execute only with safe target user | never add broad/unknown assignees |
| custom complete button | prove default Submit form complete operation on Complete task | execute only with disposable request | preserve task type compatibility |

Before runtime, use the corrected `Workflow Action Approval Test.ywf` binding shape for Add others/Add assignee. The earlier `.yap` binding mismatch showed why this check matters: label, `attrs.control_action`, resolved action name, and Submit form `submitType` must align before any custom button is executed. Runtime execution of Add assignee remains deferred until safe users and task scope are explicitly selected.

The focused `Workflow Task Form Runtime Baseline` package was generated from the task-form `.yap` plus the corrected `.ywf` and imported into Yeeflow. It opened the app, opened the approval form, opened the form designer, rendered the submission form plus all four task forms in the selector, rendered `WARTB Task3` custom buttons including `Add others to this task`, opened the workflow designer, and published successfully. Treat this as import/open/designer/publish proof for task-form configuration only. No approval request was submitted, no task operation was executed, no task-owner fields were saved, no reassign/add-assignee operation was run, no Complete task was completed, and no email was sent.

## Combined Workflow Actions Baseline

The combined generator `generate-workflow-actions-combined-runtime-baseline.mjs` creates `workflow-actions-combined-runtime-baseline.v1.yap` for one approval form plus one child data list. It is intended to prove import/open/designer/publish behavior for the learned approval-form and data-list workflow action settings together.

The generated approval workflow uses a non-overlapping left-to-right graph and appends representative Complete task, due-date, reminder, and Start settings to the previously publish-proven Assignment Task assignee baseline. The generated data-list workflow embeds the studied `Purchase Requests.ydl` Start, Assignment Task, and task-form shapes into the same app package.

Keep this package ignored and uncommitted. Treat copied assignee references as tenant-local and do not submit requests or data-list items until safe assignees are selected.

The combined baseline was manually imported and then tested in Chrome. The app opened, the approval form rendered, the approval workflow designer opened with a non-overlapping graph, the approval Start panel showed terminate/recall/condition/email settings, representative Assignment Task panels showed the assignee editor and task-type/appointed-order controls, and the approval workflow published successfully.

The same imported app exposed the data list, list fields/views, and data-list workflow designer. The data-list Start panel showed email-notification configuration without terminate/recall controls, the data-list Assignment Task panel showed mixed direct/expression/list-item assignee sources including the Created By/list-field expression family, and the data-list workflow published successfully.

The narrow submit/routing pass used Yeeflow API Operator read-only lookup to confirm that directory endpoints were readable and that the approval workflow's first task was one direct-user assignment, not a broad group or position route. One fake approval request was submitted. The submission confirmation appeared, and a new Pending tasks row appeared for `Workflow Action Approval Test` with task label `Static User Assignment`. This is runtime proof for only the first direct static-user assignment route.

No data-list item was submitted because the data-list Assignment Task has mixed direct, expression, user-group, and list-item/Created By assignee sources. Keep data-list routing, group/position/list-field expansion, Complete task execution, due-date reminder execution, Start terminate/recall execution, data-list task-form save/edit behavior, and all email delivery classified as not tested.

## Claim Task Runtime Follow-Up

`Workflow Actions Runtime Baseline (3)_Claim task.yap` adds export-proven Claim Task shapes in approval-form and data-list workflows. This is not runtime proof.

Future focused Claim Task baseline should first prove import/open/designer/publish behavior only:

| Scenario | Purpose | Proof target | Safety note |
|---|---|---|---|
| approval Claim Task, approval type | prove `CandidateTask` with user-group receiver and two outgoing paths renders/publishes | designer/publish | do not claim task |
| approval Claim Task, complete type | prove `CandidateTask` complete task with task form renders/publishes | designer/publish | do not complete task |
| data-list Claim Task, approval type | prove direct/applicant/list-item receiver expressions render/publish | designer/publish | do not create list item until safe receivers are mapped |
| data-list Claim Task, complete type | prove complete task config and email fields render/publish | designer/publish | no email delivery |
| claim execution | prove one receiver can claim and others cannot claim again | runtime execution | defer until safe receiver pool is explicitly selected |

Do not execute claim, approve, reject, complete, quick completion, or email delivery until safe users/groups and disposable records are explicitly scoped.

## Set Variable Runtime Follow-Up

`Workflow Actions Runtime Baseline (4)_Set variable.yap` adds export-proven Set variable shapes in approval-form and data-list workflows. This is not runtime proof.

Future focused Set variable baseline should first prove import/open/designer/publish behavior only:

| Scenario | Purpose | Proof target | Safety note |
|---|---|---|---|
| approval current workflow, single variable | prove `SetVariableTask` with one `variablesetting[]` row renders/publishes | designer/publish | no submit required |
| approval current workflow, multiple variables | prove one action can preserve multiple variable assignments | designer/publish | no submit required |
| approval another workflow | prove target approval form metadata and form id setting render | designer/publish | do not mutate a real submitted request |
| data-list current workflow | prove data-list workflow Set variable targets workflow variables | designer/publish | do not create list item |
| data-list list-field values | prove list fields can appear as right-side expression values | designer/publish | do not claim runtime value mutation |
| execution proof | prove variable value changes after workflow execution | runtime execution | defer until disposable requests/list records and target form IDs are explicitly safe |

Set data list / `ContentList` should be tested separately for data-list field mutation. Do not use Set variable runtime tests to claim list field updates.

## Set Data List Runtime Follow-Up

`Workflow Actions Runtime Baseline (5)_Set data list.yap` adds export-proven Set data list / `ContentList` shapes in approval-form and data-list workflows. This is not runtime proof.

Future focused Set data list baseline should first prove import/open/designer/publish behavior only:

| Scenario | Purpose | Proof target | Safety note |
|---|---|---|---|
| approval selected-list add | prove `ContentList` selected data source and `listdatas[]` mappings render/publish | designer/publish | no request submit needed |
| approval selected-list edit | prove field mappings plus `wheres[]` filter render/publish | designer/publish | do not update records |
| approval selected-list remove | prove delete/remove filter config renders/publishes | designer/publish | destructive execution deferred |
| data-list current list | prove `listtype="current"` in data-list workflow renders/publishes | designer/publish | do not create/update host records |
| data-list selected list | prove data-list workflow can target another list with list-field right-side expressions | designer/publish | no list item creation |
| numeric operations | prove `Per` codes `0..4` display as Value/Increase/Decrease/Multiply/Divide | designer/open | execution pending |
| sub-list to records | prove approval/data-list sub-list field mappings render | designer/open | row iteration not proven |

Execution proof should use disposable data only. Add may be tested first with a dedicated target list. Edit requires one known disposable row and a narrow filter. Remove/delete should remain deferred unless explicitly approved for disposable data. Do not test document-library mutation until a document-library target export proves the shape.

## Signal Event Runtime Follow-Up

`Workflow Actions Runtime Baseline (6)_Signal event.yap` adds export-proven Signal event / `SignalEvent` shape in an approval-form workflow. This is not runtime proof.

Future focused Signal event baseline should first prove import/open/designer/publish behavior only:

| Scenario | Purpose | Proof target | Safety note |
|---|---|---|---|
| approval Signal event node | prove `SignalEvent` with no incoming flow renders in workflow designer | designer/open | do not submit or recall request |
| cancel/terminate event definition | prove `CancelEventDefinition` selection renders | designer/open | do not execute terminate |
| revoke/recall event definition | prove `RevokeEventDefinition` selection renders | designer/open | do not execute recall |
| downstream cleanup action | prove downstream Set data list branch renders/publishes | designer/publish | do not mutate data |
| graph validation | prove Signal event branch is allowed as a separate event-source component | validator/designer | no runtime execution |

Execution proof should be a later separate pass using disposable approval requests and safe target records. Recall/terminate execution, downstream `ContentList` edit/remove mutation, and any email behavior remain deferred until explicitly scoped.

## Batch Workflow Actions Runtime Baseline Result

`Workflow Actions Batch Runtime Baseline` was generated and runtime-tested as a combined designer/open/publish baseline for Claim Task, Set variable, Set data list, and Signal event.

The package imported successfully, the app opened, the approval form opened, the approval form designer opened, the approval workflow designer opened, and the approval workflow published successfully. The approval workflow rendered `CandidateTask`, `SetVariableTask`, `ContentList`, and `SignalEvent` nodes. Sampled panels showed Claim Task receiver/task-form settings, Set variable current and another-workflow settings, Set data list selected-list add settings, Signal event Canceled/Recalled settings, and downstream cleanup Set data list settings.

The data list `Purchase Requests Batch Runtime Test` opened, its workflow designer opened, and the data-list workflow published successfully. The data-list workflow rendered Claim Task, Set variable, current-list Set data list, and selected-list Set data list nodes. Sampled panels showed data-list candidate expressions, current-workflow variable settings, current-list ContentList settings, and selected-list add settings.

Treat this as import/open/designer/publish proof only. Do not claim Claim Task claiming, task routing, approve/reject/complete execution, Set variable mutation, Set data list add/edit/remove execution, sub-list row iteration, Signal event recall/terminate firing, downstream cleanup execution, Products workflow trigger execution, or email delivery from this baseline.
