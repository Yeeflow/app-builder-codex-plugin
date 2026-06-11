# Workflow Assignment Task Generation Rules

## Scope

These rules cover Yeeflow approval workflow `MultiAssignmentTask` assignee, task type, due-date, reminder, and Start-action-adjacent generation guidance learned from `Test ABC.yap`, `Test ABC (1).yap`, `Test ABC (2).yap`, and `Test ABC (3).yap`.

Proof boundary:

- Shapes in this document are `export-proven` unless explicitly marked otherwise.
- Validator checks are warning-first and `validator-backed` only after local validation.
- Assignment task runtime routing is not `runtime-proven` until a focused runtime baseline passes.
- Help Center behavior can guide terminology and expected behavior, but generated assignee configurations should use export-proven shapes unless a shape is explicitly marked product-documented but not export-proven.

## Export-Proven Storage

Assignment task assignees are stored on `MultiAssignmentTask` nodes under:

```text
properties.usertaskassignment
```

The value is an array of assignee entries.

Every entry found in `Test ABC.yap` includes:

- `type`
- `method`
- `title`

Some methods also include:

- `value`
- `position`

Common task approval settings found alongside assignees:

- `properties.tasktype`
- `properties.approveway`
- `properties.approvepercentage`
- `properties.duedatedefinition`
- `properties.duedatetype`
- `properties.duedateexpress`
- `properties.isfromworkcalendar`
- `properties.notifyrules`
- `properties.taskurl`
- `properties.isenabledemail`
- `properties.isallowreassign`
- `properties.isallowsign`
- `properties.allowskip`

## Export-Proven Methods

| Method | Type | Meaning | Required fields found | Runtime dependencies | Generation safety |
|---|---|---|---|---|---|
| `direct` | `user` | specific direct user | `value`, `title` | valid target-tenant user | tenant-sensitive; avoid broad generation |
| `expression` | `user` | expression editor user assignee | `value`, `title` | applicant/user context or expression result | export-proven shape, runtime routing unproven |
| `position` | `position` | direct job position | `position`, `title` | valid position assignment | requires target org/reference data |
| `positionorg` | `position` | job position by selected department | `position`, `value`, `title` | valid department and position assignment | requires target org/reference data |
| `positionorgexpr` | `position` | job position by applicant/current department | `position`, `value`, `title` | applicant context, department hierarchy, position assignment | requires runtime proof |
| `positionloc` | `position` | job position by selected location | `position`, `value`, `title` | valid location and position assignment | requires target org/reference data |
| `positionlocexpr` | `position` | job position by applicant/current location | `position`, `value`, `title` | applicant context, location data, position assignment | requires runtime proof |
| `expression` | `user` with expression data `type=usergroup`, `prop=Users_ID` | all users in a user group | `value`, `title` | valid user group membership | export-proven in `Test ABC (1).yap`; API Operator can confirm group/member category through documented read-only endpoints |
| `expression` | `user` with expression data `type=position`, `prop=Users_ID` | all users in a job position | `value`, `title` | valid position assignment and position membership | requires target org/reference data and runtime proof |

## Safe Generation Rules

Use these rules for generated packages:

- Do not hardcode tenant-specific direct users by default.
- Use `type=user`, `method=direct` only when the user explicitly supplies or authorizes a valid target-tenant user mapping.
- Redact private IDs in docs and never commit user/org lookup output.
- Prefer applicant/current-user expression routing or an explicit user-selection field when a package must be portable across tenants.
- Use job-position, department, and location assignment only when target-tenant org/reference data is available and authorized.
- Use `yeeflow-api-operator` for read-only org/reference lookup when real users/departments/locations/positions are needed and local credentials are available.
- API lookup may confirm that static exported values correspond to user, department, location, or position categories, but it does not prove runtime workflow routing.
- Use placeholders such as `<USER_REF_CONFIRMED_BY_API>`, `<DEPARTMENT_REF_CONFIRMED_BY_API>`, `<LOCATION_REF_CONFIRMED_BY_API>`, and `<POSITION_REF_CONFIRMED_BY_API>` in committed normalized examples.
- Do not paste API keys into chat and do not save raw API responses.
- Keep generated packages free of private user, department, location, position, tenant, and email data unless explicitly required and safe.
- Preserve multiple assignee entries under `properties.usertaskassignment[]`; mixed source arrays are export-proven in `Test ABC (1).yap`.
- Preserve `properties.issequential=true` for Sequential Appointed Order. Treat absent `issequential` as parallel/default only within the current export-proven boundary.
- Preserve `approveway` and `approvepercentage` together. Export-proven values include `allapprove`, `anyprocess`, `anyapprove`, `anyreject`, and `custompercentage`.
- Generate email notification fields only from export-proven shapes and only when explicitly requested. Do not claim notification delivery without runtime testing.
- Use `yeeflow-api-operator` assignment-routing coverage checks for authorized read-only confirmation of users, groups, group members, locations, positions, and position assignments. Do not invent org object IDs or embed private org data.
- User group assignment can now be API-category-assisted through documented `GET /groups` and `GET /groups/{id}/users`, but group expansion and routing still require runtime proof.
- Preserve absent `tasktype` for approval/default tasks and `tasktype="complete"` for Complete tasks. Do not invent another approval marker until a focused export proves it.
- Preserve due-date settings together. Export-proven due-date types are `hour`, `day`, and `express`; `minute` is product-documented but not export-proven in the studied files.
- Preserve `duedateexpress` when `duedatetype="express"` and keep it as an expression-button shape.
- Preserve `isfromworkcalendar` for day-based working-calendar due dates when found.
- Preserve due-date reminder rules under `notifyrules[]`; export-proven reminder timing values are `relative="0"` for on due date, `relative="-1"` for before due date, and `relative="1"` for after due date.
- Treat `notifyrules[].actiontype="1"` as the export-proven reminder action shape. Do not generate Automatic Treatment due-date actions until an export proves the serialized schema.
- Reminder recipient settings are export-proven only for task-level current task assignee email via `properties.to`; applicant, manager, department-manager, and arbitrary recipient reminder shapes were not found.
- Start action settings from `Test ABC (3).yap` use `StartNoneEvent.properties.terminate`, `terminate-conditions`, `revoke-conditions`, `isenabledemail`, `to`, `subject`, and `html`. Preserve condition rows as operand-wrapper arrays and do not claim terminate/recall/email runtime behavior without focused proof.
- Data-list workflow Start action from `Purchase Requests.ydl` uses `StartNoneEvent.properties.isenabledemail`, `to`, `subject`, `html`, and `taskurl`, but does not include `terminate`, `terminate-conditions`, or `revoke-conditions`. Do not add approval-form terminate/recall fields to data-list workflow Start actions until a data-list export proves them.
- Data-list workflow Assignment Task can reference list item context in assignee expressions. The studied export proves a Created By list-field expression that resolves `LineManager`; preserve this as an expression-button value and never replace it with invented static users.
- Data-list workflow task forms can mix normal task-form controls and list-bound controls. Preserve `isListControl`, list field `identifier`, `InternalName`, `fieldID`, and `____customListFields_` binding.
- Custom list fields can be marked `readonly=true` when the task should not update source list data. Default/native fields such as Created By appear read-only in the studied export; keep broader native-field behavior runtime-pending.
- Lay out generated workflow nodes with non-overlapping coordinates and keep `SequenceFlow` source/target plus node incoming/outgoing references consistent.
- For combined workflow-action baselines, include approval-form and data-list workflows in one package only when each workflow keeps its own Start-action rules, process/list IDs, `FlowMappings[]`, task forms, and sequence-flow references. Remap `Data.Forms[].ProcModelID` and data-list workflow `ListID`/`ProcModelID` completely.
- Scheduled Workflow Assignment Task from `Workflow Actions Runtime Baseline (1).yap` uses the same `MultiAssignmentTask.properties.usertaskassignment[]` family with `WorkflowType = 3`, `ListID = 0`, absent `tasktype`, `approveway="allapprove"`, `approvepercentage=100`, absent `issequential`, `duedatedefinition=120`, and one applicant-line-manager expression assignee. Preserve this as export-proven for Scheduled Workflow only; do not infer Scheduled Workflow support for direct users, positions, groups, Complete task, reminder rules, enabled task email, or data-list field assignee expressions until a scheduled export proves them.
- Scheduled Workflow Start from the same export has email fields but no approval-form terminate/recall fields. Keep Scheduled Workflow Start generation aligned with the data-list-style absence of terminate/recall unless another scheduled export proves those fields.
- Approval workflow task forms from `Workflow Actions Runtime Baseline (2)_Task forms.yap` are stored in `Data.Forms[].DefResource.pageurls[]` beside the submission form. Preserve `pageurls[].type=1` for submission forms and `pageurls[].type=2` for task forms when using this export family.
- Every generated `MultiAssignmentTask` should set `properties.taskurl` to an existing task form page ID. Reusing one task form for multiple Assignment Tasks is export-proven when the task-owner responsibilities match.
- Copied task forms for approve/reject or complete-only review can set copied value-entry controls to `readonly=true`; `WARTB Task` export-proves all copied value controls readonly.
- Task-specific task forms can keep copied request fields readonly and add editable task-owner fields. `WARTB Task2`, `WARTB Task3`, and `WARTB Task4` prove extra editable inputs, number, textarea, and user-picker-style controls on task forms.
- The Action Panel control is `type="workflowControlPanel"` with button behavior derived from the associated Assignment Task type and options. The export does not store explicit Approve/Reject/Complete/Reassign/Add assignee child buttons under the panel.
- Custom task buttons use `type="action_button"` and bind through `attrs.control_action` to a `formdef.actions[].id`. Keep that binding consistent with the button label and Submit form operation.
- Submit form operation shapes found in task forms are: no `submitType` for approval/default submit on Approval tasks, `submitType="2"` for reject, `submitType="4"` for reassign with `forword` and `remark`, `submitType="5"` for add assignee with `forword`, `remark`, and `assignee`, and no `submitType` for complete on Complete tasks. Preserve the export spelling `forword`.
- `Workflow Actions Runtime Baseline (2)_Task forms.yap` contains a custom-button binding mismatch: the visible `Add others to this task` button points to the reject action ID while a separate `Add assignee button clicked` action contains `submitType="5"`. The follow-up `Workflow Action Approval Test.ywf` corrects this binding so the Add others button resolves to the add-assignee action. Use the corrected `.ywf` shape as the positive export-proven reference, and keep validators warning-first when label, bound action, and Submit form operation disagree.
- `generate-workflow-task-form-runtime-baseline.mjs` applies the corrected `.ywf` definition to the studied task-form package family. The resulting package imported, opened, rendered the form designer and workflow designer, showed all four task forms in the selector, showed `WARTB Task3` custom buttons, and published successfully. Treat this as import/open/designer/publish proof only; custom button execution, reassign/add-assignee runtime behavior, Complete task execution, task-owner field persistence, Claim Task task-form behavior, and email delivery remain unproven.

## Runtime-Proof Requirements

Runtime routing claims require a focused baseline that proves:

- imported workflow designer accepts the generated assignment task assignee configuration
- request submission creates a pending task
- the pending task routes to the intended safe assignee class
- approval/complete outcomes route through expected sequence flows
- no private identities are exposed in reusable docs

Do not claim runtime behavior from export study alone.

## Focused Baseline Result

`generate-assignment-task-assignee-runtime-baseline.mjs` creates `assignment-task-assignee-runtime-baseline.v1.yap` from the export-proven shapes in `Test ABC (1).yap`. The package is intentionally ignored because it can contain tenant-local copied assignment references.

Local validation of the generated package is validator-backed for 11 Assignment Task nodes covering static user, multiple users, direct position, position by department, position by location, user group, Sequential appointed order, Parallel/default appointed order, `approveway` variants, custom percentage, and email notification configuration.

The first runtime pass imported and opened the generated app and showed Assignment Task designer panels, including Sequential selected for `issequential=true` and an Email Notification Config task panel. Publishing that first package was blocked by a missing-input-line designer error on `Sequential Multiple Assignees`, and no request was submitted. A rebuilt package with native-looking shape IDs and incoming/outgoing flow references passed local validation but hit duplicate import/open interference before clean publish proof.

The V2 runtime package fixed the duplicate-import/process-ID problem by using fresh app/process IDs, fresh form key `ATAR2`, semantic `rt_*` workflow shape IDs, complete `Data.Forms[0].ProcModelID` remapping, and a non-overlapping left-to-right workflow layout. V2 imported, opened, rendered the workflow designer, published successfully, and opened the published form.

Treat V2 as import/open/designer/publish proof only. Do not promote Assignment Task routing, group expansion, position expansion, appointed-order behavior, custom-percentage completion, or email delivery to runtime-proven until a safe request is submitted and observed.

`generate-workflow-actions-combined-runtime-baseline.mjs` extends the publish-proven V2 approach with one data-list workflow and additional Complete task, due-date, reminder, and Start settings. Use it for designer/open/publish proof first. Its `minute` due-date task is exploratory/product-documented because the studied exports proved `hour`, `day`, and `express` but did not prove the minute serialization.

The combined workflow-actions package imported, opened, rendered approval and data-list workflow designers, and published both workflows successfully. This upgrades the covered shapes to import/open/designer/publish-proven for the generated host package:

- approval Start terminate/recall/condition/email configuration
- representative Assignment Task assignee editor, appointed-order, task-type, and completion-condition panels
- generated Complete task, due-date, reminder, `approveway`, and notification configuration family at package/publish level
- data-list Start email configuration without terminate/recall controls
- data-list Assignment Task mixed direct/expression/list-item assignee configuration including the Created By/list-field expression family
- data-list form/list-field rendering in the imported app

Do not treat this as routing proof. No approval request or data-list item was submitted, no task was completed, no group/position/list-field expansion was observed, no due-date scheduler behavior was observed, and no notification email was sent.

## Product-Documented But Not Export-Proven Here

These were not found in the current exports or remain insufficiently proven:

- direct users only in one multi-user task, without another source type
- workflow variable assignee
- selected department manager as a distinct direct manager shape
- position by department plus location in one entry
- explicit `issequential=false` parallel marker
- quick-completion notification behavior
- notification delivery behavior
- standalone department detail endpoint and standalone position detail endpoint in the public API
- minute due-date unit serialization
- due-date Automatic Treatment action schema
- reminder recipients other than task owner/current assignee
- enabled Start terminate condition behavior
- Start recall runtime behavior
- Start email delivery
- data-list workflow Created By/list-field assignee routing
- data-list workflow task form save/edit behavior for list-bound controls
- scheduled workflow Assignment Task routing and task creation
- scheduled workflow Start email delivery
- scheduled workflow terminate/recall support
- Claim Task task-form association
- custom task-form button runtime execution for approve/reject/reassign/add-assignee/complete
- Action Panel explicit button child schema, because buttons appear derived rather than serialized as child controls in the studied export
- Add-assignee custom button runtime execution, even though the corrected `.ywf` now proves the intended button-to-action binding shape
- task-owner field save/persistence from custom task forms, even though the generated task-form baseline rendered and published

Do not generate these as schema-safe until an export proves their package shape. Do not claim routing-safe until runtime proof exists.

## Validator Rules

Validators should remain warning-first for this feature in compatibility mode:

- warn when `MultiAssignmentTask.properties.usertaskassignment` is missing, not an array, or empty
- warn when an assignee entry is not an object
- warn when `type` or `method` is missing
- warn when method is outside the export-proven method list
- warn when position-based assignments lack `position`
- warn when static direct/department/location assignments lack `value`
- warn when expression-based assignments lack an expression-button-shaped `value`
- warn that direct user assignment is tenant-sensitive
- warn when `tasktype` uses an unknown explicit value
- warn when due-date type, expression, working-calendar, or reminder rule shapes are malformed
- warn when Start action terminate/recall condition or email-notification fields are malformed
- warn when Scheduled Workflow Start action includes approval-only terminate/recall fields unless a scheduled export proves them
- warn when Scheduled Workflow Assignment Task uses list-field/Created By expression sources unless a scheduled export proves a list context for that workflow
- warn when `MultiAssignmentTask.properties.taskurl` is missing or does not resolve to a task form page
- warn when a custom task-form `action_button.attrs.control_action` is missing or does not resolve to `formdef.actions[]`
- warn when a custom button label implies approve/reject/reassign/add-assignee/complete but the resolved Submit form operation differs
- warn when reassign/add-assignee Submit form steps lack user-valued expression sources
- warn when Complete task pages rely only on approval/reject custom operations, or approval/default task pages rely only on complete custom operations

Hard errors should wait until generated-final invalid shapes are proven to fail import/publish/runtime safely and consistently.

## References

Normalized export references:

```text
docs/studies/normalized/workflow-assignment-task-assignees/
```

Study doc:

```text
docs/studies/workflow-assignment-task-assignee-settings.md
```

## Claim Task Addendum

`Workflow Actions Runtime Baseline (3)_Claim task.yap` export-proves that front-end Claim Task maps to internal `CandidateTask` in approval-form and data-list workflows. See `docs/studies/workflow-claim-task-action.md` and normalized refs under `docs/studies/normalized/workflow-claim-task/`.

Generation rules:

- Use `CandidateTask` for Claim Task and `MultiAssignmentTask` for Assignment Task.
- Treat `CandidateTask.properties.usertaskassignment[]` as receiver/candidate pool configuration, not direct final assignee ownership.
- Preserve `CandidateTask.properties.taskurl` and validate it resolves to a task-form page.
- Preserve `tasktype="approve"` and `tasktype="complete"` when present.
- Do not generate the config-reference typo `properties.tasktype ` with a trailing space; the export uses `properties.tasktype`.
- Preserve user group, applicant/context, and data-list Created By/list-item receiver expressions as expression-button strings.
- Do not claim claim-pool behavior, claim locking, Pending Tasks ownership after claim, quick completion, or email delivery until focused runtime proof exists.

Claim Task should be recommended when a team/pool can voluntarily claim ownership. Assignment Task should be recommended when known users must take direct action.

## Set Variable Addendum

`Workflow Actions Runtime Baseline (4)_Set variable.yap` export-proves that front-end Set variable maps to internal `SetVariableTask` in approval-form and data-list workflows. See `docs/studies/workflow-set-variable-action.md` and normalized refs under `docs/studies/normalized/workflow-set-variable/`.

Generation rules:

- Use `SetVariableTask` for Set variable and `ContentList` for Set data list.
- Treat `properties.variablesetting[]` as workflow-variable assignments. Each row's `id` is the left-side target workflow variable and `value` is the right-side expression-token array.
- `formtype="current"` targets the current workflow's variables.
- `formtype="custom"` targets another approval form workflow instance and should preserve `properties.data.AppID`, `properties.data.ListSetID`, `properties.data.ProcKey`, and `properties.formids`.
- One Set variable node may set one or multiple workflow variables.
- In data-list workflows, list fields may appear as right-side `exprType="list_field"` values, but Set variable should still target workflow variables.
- Do not use Set variable to write data-list fields; use Set data list / `ContentList` for list record or field mutation.
- Do not claim runtime variable mutation, another-workflow updates, or form-id targeting behavior until focused runtime proof exists.

## Set Data List Addendum

`Workflow Actions Runtime Baseline (5)_Set data list.yap` export-proves that front-end Set data list maps to internal `ContentList` in approval-form and data-list workflows. See `docs/studies/workflow-set-data-list-action.md` and normalized refs under `docs/studies/normalized/workflow-set-data-list/`.

Generation rules:

- Use `ContentList` for Set data list and `SetVariableTask` for Set variable.
- Use Set data list for data-source item/field mutation; do not use Set variable to write data-list fields.
- Preserve `properties.listtype`: `select` for selected data sources, `current` for data-list current-list context.
- Preserve selected target metadata: `properties.appid`, `properties.listsetid`, and `properties.listid`.
- Preserve `properties.type` as `add`, `edit`, or `remove`.
- For add/edit, generate `properties.listdatas[]` entries with `Columns`, `Per`, and expression-token-array `Data`.
- For edit/remove, require explicit safe `properties.wheres[]` filters unless the user deliberately accepts a broad operation. Missing or empty filters should warn strongly.
- Treat `remove` as destructive and require explicit user intent plus disposable or tightly filtered target data before runtime execution.
- Preserve numeric operation codes `Per="0".."4"` from the export. Use codes `1..4` only for number fields when target field metadata is known.
- Preserve approval-form and data-list sub-list/detail-row value expressions when the source and target fields are export-backed.
- Do not claim add/update/delete, current-list mutation, document-library mutation, numeric operation execution, or sub-list row iteration without focused runtime proof.

## Signal Event Addendum

`Workflow Actions Runtime Baseline (6)_Signal event.yap` export-proves that front-end Signal event maps to internal `SignalEvent` in approval-form workflows. See `docs/studies/workflow-signal-event-action.md` and normalized refs under `docs/studies/normalized/workflow-signal-event/`.

Generation rules:

- Use `SignalEvent` only for approval-form Signal event branches unless another workflow host is export-proven.
- Treat Signal event as a special event source with no incoming flow and one or more outgoing flows.
- Preserve `properties.eventdefinitions[]` with `CancelEventDefinition` and/or `RevokeEventDefinition`.
- Use Signal event for recall/terminate compensation logic, often followed by Set data list / `ContentList` cleanup.
- Keep downstream edit/remove filters explicit and safe.
- Do not claim recall/terminate triggering or cleanup mutation without focused runtime proof.
