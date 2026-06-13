# Workflow Assignment Task Assignee Settings

## Purpose

This focused export-learning study documents how Yeeflow approval workflow assignment tasks store assignee settings in `Test ABC.yap`, `Test ABC (1).yap`, and later focused exports for task type/due-date settings.

Proof boundary:

- `product-documented`: described in Yeeflow Help Center behavior references.
- `export-proven`: found in `Test ABC.yap` or `Test ABC (1).yap`.
- `API-category-assisted`: static references were classified with safe read-only Yeeflow API Operator lookup.
- `validator-backed`: checked by local validation after this study.
- `runtime-proven`: not claimed in this study.
- `unproven`: not found or not tested.

This branch does not generate a runtime baseline, does not submit approval requests, and does not run live workflow tasks.

## Sources

Source export:

```text
/Users/Renger/Downloads/Test ABC.yap
/Users/Renger/Downloads/Test ABC (1).yap
/Users/Renger/Downloads/Test ABC (2).yap
```

Reference:

- Yeeflow Help Center: Assignment task action
  https://<yourdomain>.yeeflow.com/<redacted-path>
- Related Yeeflow Help Center behavior reference: Add assignee with Assignee Editor
  https://<yourdomain>.yeeflow.com/<redacted-path>

Source priority:

1. `Test ABC (2).yap` is the latest Assignment Task source of truth for task type, Complete task, due-date, and reminder settings.
2. `Test ABC (1).yap` is the source of truth for multiple-assignee, Appointed Order, approveway, and email notification settings.
3. `Test ABC.yap` is the previous baseline export for comparison.
4. Help Center articles are product-behavior and terminology references.
5. Yeeflow API Operator lookup is only for safe read-only org/reference category support.
6. Existing validators and skills are implementation references.

## Redaction Policy

The raw export and decoded payloads are not committed. Decoding was performed under ignored `tmp/`.

Normalized references redact private org data with placeholders:

- `<REDACTED_USER_ID>`
- `<REDACTED_USER_EMAIL>`
- `<REDACTED_USER_GROUP_ID>`
- `<REDACTED_DEPARTMENT_ID>`
- `<REDACTED_LOCATION_ID>`
- `<REDACTED_POSITION_ID>`
- `<REDACTED_TENANT_ID>`
- `<REDACTED_WORKFLOW_NODE_ID>`
- `<REDACTED_TASK_FORM_PAGE_ID>`
- `<REDACTED_ASSIGNEE_LABEL>`

Raw user names, emails, phones, tenant IDs, department IDs, location IDs, position IDs, workflow node IDs, and task form page IDs must not be copied into reusable docs or normalized references.

## Located Workflow

`Test ABC.yap` decoded successfully with large numeric IDs preserved as strings.

Export-proven structure:

- Application shell: `Test ABC`
- Forms found: `1`
- Approval workflow forms found: `1`
- Approval form name: `ABC`
- Workflow type: `2`
- Workflow nodes found: `29`
- Assignment task nodes found: `9`
- Assignment task node type: `MultiAssignmentTask`
- Sequence flow nodes found: `18`
- Start/end nodes found: `2`

Each assignment task stores assignees under:

```text
properties.usertaskassignment
```

The value is an array. `Test ABC.yap` used one assignee entry per task. `Test ABC (1).yap` proves multiple assignee entries in the same array, including mixed static/direct users, position sources, expression sources, and a user-group expression source.

Common task fields seen on each `MultiAssignmentTask`:

- `properties.duedatedefinition`
- `properties.approveway`
- `properties.approvepercentage`
- `properties.isenabledemail`
- `properties.isallowreassign`
- `properties.isallowsign`
- `properties.allowskip`
- `properties.name`
- `properties.usertaskassignment`
- `properties.taskurl`

Common approval settings in this export:

- `approveway`: `allapprove`
- `approvepercentage`: `100`
- `isenabledemail`: `false`
- `isallowreassign`: `false`
- `isallowsign`: `false`
- `allowskip`: `true`
- `taskurl`: redacted task form page reference

## Assignment Task Inventory

| Task | Node index | Assignee classification | Export-proven entry shape | Expression source | Static references | Approval mode | Runtime dependencies | Confidence |
|---:|---:|---|---|---|---|---|---|---|
| 1 | 9 | applicant department manager | `type=user`, `method=expression`, `value`, `title` | `Applicant:Department:Manager`; outer expression resolves applicant department then `Manager` | none | `allapprove`, `100` | applicant user context, department hierarchy/manager data, user directory data | export-proven |
| 2 | 11 | direct job position | `type=position`, `method=position`, `position`, `title` | none | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | position assignments | export-proven |
| 3 | 13 | direct job position | `type=position`, `method=position`, `position`, `title` | none | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | position assignments | export-proven |
| 4 | 15 | position by selected department | `type=position`, `method=positionorg`, `position`, `value`, `title` | none | `<REDACTED_POSITION_ID>`, `<REDACTED_DEPARTMENT_ID>` | `allapprove`, `100` | position assignments, department hierarchy | export-proven |
| 5 | 18 | position by applicant department | `type=position`, `method=positionorgexpr`, `position`, `value`, `title` | `Applicant:Department`; expression references applicant user context and `OrganizationID` | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | applicant user context, position assignments, department hierarchy | export-proven |
| 6 | 20 | position by selected location | `type=position`, `method=positionloc`, `position`, `value`, `title` | none | `<REDACTED_POSITION_ID>`, `<REDACTED_LOCATION_ID>` | `allapprove`, `100` | position assignments, location assignments | export-proven |
| 7 | 22 | position by applicant location | `type=position`, `method=positionlocexpr`, `position`, `value`, `title` | `Applicant:Location`; expression references applicant user context and `LocationID` | `<REDACTED_POSITION_ID>` | `allapprove`, `100` | applicant user context, position assignments, location assignments | export-proven |
| 8 | 24 | applicant line manager | `type=user`, `method=expression`, `value`, `title` | `Applicant:Line Manager`; expression references applicant user context and `LineManager` | none | `allapprove`, `100` | applicant user context, user directory data | export-proven |
| 9 | 27 | specific user | `type=user`, `method=direct`, `value`, `title` | none | `<REDACTED_USER_ID>` | `allapprove`, `100` | valid target-tenant user | export-proven |

## Normalized References

Created under:

```text
docs/studies/normalized/workflow-assignment-task-assignees/
```

Files:

- `assignment-assignee-inventory.normalized.json`
- `assignment-assignee-specific-user.normalized.json`
- `assignment-assignee-applicant-line-manager.normalized.json`
- `assignment-assignee-department-manager.normalized.json`
- `assignment-assignee-job-position.normalized.json`
- `assignment-assignee-position-by-department.normalized.json`
- `assignment-assignee-position-by-applicant-department.normalized.json`
- `assignment-assignee-position-by-location.normalized.json`
- `assignment-assignee-position-by-applicant-location.normalized.json`

Not created because not found in this export:

- specific multiple users
- generic workflow-variable assignee
- user group assignee
- position by department plus location in one assignee entry
- mixed static plus expression assignee list
- selected department manager as a static department manager entry distinct from position-by-department

## Export-Proven Assignee Patterns

## API-Assisted Org/Reference Interpretation

Proof level: `api-assisted-category-check`

The `yeeflow-api-operator` read-only connectivity helper was originally run with local credentials. Current helper behavior is OAuth-first and does not require `.env.local` for normal read-only checks. Raw API responses were not committed.

API availability:

| Endpoint category | Endpoint | HTTP/API status | Count reported |
|---|---|---:|---:|
| users | `POST /users/search` | `200` / `0` | `3` total, `3` returned in the category check |
| departments | `GET /departments?parentId=0` | `200` / `0` | `6` returned |
| locations | `GET /locations` | `200` / `0` | `2` returned |
| positions | `GET /positions` | `200` / `0` | `6` returned |

Base URL behavior:

- configured env base: `404` for directory probe
- configured env base plus `/v1`: `404` for directory probe
- documented developer API base: `200` and used for read-only lookup

Redaction handling:

- raw user, department, location, and position IDs stayed in memory or ignored `tmp/`
- committed normalized references use only placeholders such as `<USER_REF_CONFIRMED_BY_API>`, `<DEPARTMENT_REF_CONFIRMED_BY_API>`, `<LOCATION_REF_CONFIRMED_BY_API>`, and `<POSITION_REF_CONFIRMED_BY_API>`
- no user names, emails, phone numbers, tenant IDs, raw API responses, or private org values are committed

API lookup confirms org object categories, not runtime workflow routing. A reference matching a readable API category means the exported static value corresponds to a known object category in the queried tenant; it does not prove that a submitted workflow will route to the intended assignee at runtime.

## Job Position Generation Policy

Generated approval workflows must not invent job-position IDs or names. For each Assignment Task, the app plan and generation report must list:

- task name
- assignment type: line manager, department manager, location manager, job position, explicit user, requester/submitter, or another supported expression
- required job position name when applicable
- source: discovered existing job position, user-selected existing job position, admin-created after confirmation, unresolved, or not applicable
- proof status
- fallback or blocker

If the required job position exists, generation may use it only with discovered or explicitly confirmed proof metadata. If the required job position is missing and current user system-admin status is proven, prepare a guarded creation/update plan and require explicit confirmation before any write. If admin status is missing or cannot be proven, stop and instruct the user to ask a system admin to create/update the job position or provide an existing position/fallback. Job-position creation, update, and user assignment/removal are writes and must never run automatically during generation.

Generated application reports must list the workflow assignment tasks and assignee sources, state whether each job position was discovered, user-selected, created after confirmation, or unresolved, and state the blocker when unresolved. Reports must not print raw user records, raw job-position records, full IDs, full emails, raw API responses, decoded package payloads, raw `Resource`, or raw `Sign`. Workflow assignment correctness is not proven until browser/runtime verification submits a safe request and observes task routing.

## Updated Export Extension: Test ABC (1).yap

`Test ABC (1).yap` decoded successfully as a read-only export and contains the same approval form/workflow shell:

- source path: `/Users/Renger/Downloads/Test ABC (1).yap`
- approval workflow forms found: `1`
- assignment task nodes found: `9`
- assignment task node type: `MultiAssignmentTask`
- assignee storage: `properties.usertaskassignment`

New export-proven fields and settings:

- `properties.usertaskassignment` can contain multiple assignee entries.
- `properties.issequential=true` is the observed Sequential Appointed Order marker.
- Absence of `issequential` on multiple-assignee tasks is interpreted as `parallel-or-default` from export structure plus Help Center terminology, not runtime proof.
- `properties.approveway` varies across `allapprove`, `anyprocess`, `anyapprove`, `anyreject`, and `custompercentage`.
- `properties.approvepercentage=60` is observed with `approveway=custompercentage`.
- `properties.isenabledemail=true` adds notification fields: `to`, `subject`, `html`, `notifyrules`, and `duedatetype`.
- `properties.automaticapproveddefinition=true` and `properties.isallowrecalled=true` are observed on one task as additional assignment-task settings.

### Export Comparison

| Task | Previous pattern from `Test ABC.yap` | Updated pattern from `Test ABC (1).yap` | What changed | Newly observed fields | Appointed Order | Completion / approval setting | Email | Proof level |
|---|---|---|---|---|---|---|---|---|
| 1 | applicant department manager | applicant line manager + user group expression | multiple expression assignee sources; user group source added | `issequential` | Sequential (`issequential=true`) | `allapprove`, `100` | disabled | export-proven + product-documented |
| 2 | direct job position | applicant department manager + position all-users expression | mixed expression sources; position expression can resolve users | none beyond prior common settings | Parallel/default | `anyprocess`, `100` | disabled | export-proven + API-category-assisted |
| 3 | direct job position | direct position + two direct users | multiple static users plus position source | multiple `direct` entries in array | Parallel/default | `anyapprove`, `100` | disabled | export-proven + API-category-assisted |
| 4 | position by selected department | direct position + direct user | mixed static position/user source | mixed entries in array | Parallel/default | `anyreject`, `100` | disabled | export-proven + API-category-assisted |
| 5 | position by applicant department | position by selected department + direct user | selected department position plus direct user | `approveway=custompercentage`, `approvepercentage=60` | Parallel/default | `custompercentage`, `60` | disabled | export-proven + API-category-assisted |
| 6 | position by selected location | position by applicant department + direct user | context-derived department position plus direct user | `automaticapproveddefinition`, `isallowrecalled`, `allowskip=false` | Parallel/default | `allapprove`, `100` | disabled | export-proven |
| 7 | position by applicant location | position by selected location | same source category as previous selected-location task; reassign/sign enabled | `isallowreassign=true`, `isallowsign=true` | Parallel/default | `allapprove`, `100` | disabled | export-proven + API-category-assisted |
| 8 | applicant line manager | position by applicant location | email notification enabled on assignment task | `isenabledemail`, `to`, `subject`, `html`, `notifyrules`, `duedatetype` | Parallel/default | `allapprove`, `100` | enabled | export-proven |
| 9 | direct user | direct user + applicant line manager | mixed static and expression user sources | multiple entries in array | Parallel/default | `allapprove`, `100` | disabled | export-proven + API-category-assisted |

### Multiple-Assignee Structures

`Test ABC (1).yap` proves that `properties.usertaskassignment` is the only observed list container for multiple Assignment Task assignee sources. The list stores assignee entries as objects. Export-proven entry field names remain:

- direct user: `type`, `method`, `value`, `title`
- expression user/user group/position-all-users: `type`, `method`, `value`, `title`
- direct position: `type`, `method`, `position`, `title`
- position by selected department/location: `type`, `method`, `position`, `value`, `title`
- position by applicant department/location: `type`, `method`, `position`, `value`, `title`

Mixed source types can coexist in one task:

- expression + user group expression
- applicant department manager expression + position all-users expression
- direct position + multiple direct users
- position by selected department + direct user
- position by applicant department + direct user
- direct user + applicant line manager expression

User group assignment is represented as an expression-button value with data shape `type=usergroup`, `prop=Users_ID`. Yeeflow API Operator v1 does not provide a user-group endpoint, so this is export-proven and product-documented but not API-confirmed.

Job positions can represent multi-user assignee sources in two export-proven ways:

- `type=position`, `method=position` or variants, where the referenced job position may resolve to users in the organization model.
- expression-button value with data shape `type=position`, `prop=Users_ID`, interpreted as all users for a position.

### Appointed Order and Completion Settings

Help Center describes Appointed Order as Sequential or Parallel. `Test ABC (1).yap` proves the following serialized shape:

| Concept | Export-proven field/shape | Notes | Proof level |
|---|---|---|---|
| Sequential Appointed Order | `properties.issequential=true` | Found on Task 1 with two assignee entries. List order is the only visible ordering signal. | product-documented + export-proven |
| Parallel Appointed Order | `properties.issequential` absent | Found on the other multiple-assignee tasks. Interpreted as parallel/default from product docs and contrast with sequential marker. | product-documented + export-proven partial |
| All approve | `approveway=allapprove`, `approvepercentage=100` | Found on several tasks. | export-proven |
| Anyone/process completion | `approveway=anyprocess`, `approvepercentage=100` | Found on Task 2. Exact runtime semantics need runtime proof. | export-proven |
| Anyone approve | `approveway=anyapprove`, `approvepercentage=100` | Found on Task 3. | export-proven |
| Anyone reject | `approveway=anyreject`, `approvepercentage=100` | Found on Task 4. | export-proven |
| Custom percentage | `approveway=custompercentage`, `approvepercentage=60` | Found on Task 5. | export-proven |
| Auto approve | `automaticapproveddefinition=true` | Found on Task 6. Product docs describe auto-approve behavior; runtime not tested here. | product-documented + export-proven |
| Allow recall | `isallowrecalled=true` | Found on Task 6. | product-documented + export-proven |

### Email Notification Settings

Task 8 in `Test ABC (1).yap` proves Assignment Task email notification configuration without sending email:

- enable flag: `properties.isenabledemail=true`
- recipient expression: `properties.to` expression-button label `Current Task Context:Assignee:Email`
- subject expression: `properties.subject` expression-button label `Workflow Name`
- body field: `properties.html`
- notification rules list: `properties.notifyrules=[]`
- due date unit: `properties.duedatetype=hour`

No delivery was tested. No real email addresses are committed. The notification shape is export-proven only; delivery and quick-completion behavior remain runtime-unproven.

### Updated Help Center Comparison

| Help Center concept | Export-proven field/shape from `Test ABC (1).yap` | Match status | Notes | Proof level |
|---|---|---|---|---|
| Assignment Task can assign to one or multiple owners | `usertaskassignment` array with one, two, or three entries | matched | Multiple entries are now export-proven. | product-documented + export-proven |
| Mix users, user groups, and job positions | Mixed arrays containing direct users, user group expression, and position sources | matched | User group is expression-shaped, not direct static object. | product-documented + export-proven |
| User group assignee | expression-button `type=usergroup`, `prop=Users_ID` | matched | API category not confirmed because API Operator v1 has no group endpoint. | product-documented + export-proven |
| Job position assignees can resolve to users | position entries and position `Users_ID` expression | matched | API confirms position category for static position refs, not runtime expansion. | product-documented + export-proven + API-category-assisted |
| Sequential appointed order | `issequential=true` | matched | Runtime ordering not tested. | product-documented + export-proven |
| Parallel appointed order | absent `issequential` on other multi-assignee tasks | partially matched | Export does not show an explicit `false`; treat as default/parallel until runtime baseline confirms. | product-documented + export-proven partial |
| Completion condition all/any/custom percentage | `approveway` plus `approvepercentage` | matched | Values observed: `allapprove`, `anyprocess`, `anyapprove`, `anyreject`, `custompercentage`. | product-documented + export-proven |
| Email notification to task assignees | `isenabledemail=true`, `to` current task assignee email expression | matched | No email sent; no delivery proof. | product-documented + export-proven |
| Custom email subject/body | `subject`, `html` fields | matched | Body content redacted as shape only. | product-documented + export-proven |

### Updated API-Assisted Interpretation

The read-only Yeeflow API Operator lookup was run again with local credentials in the historical proof. Current helper behavior is OAuth-first; only auth presence, statuses, and counts should be reported. No credential values or raw API responses were saved or committed.

| Category endpoint | HTTP/API status | Count observed | Use in this study |
|---|---:|---:|---|
| users | `200` / `0` | `3` | Confirmed static direct-user references as user category. |
| departments | `200` / `0` | `6` | Confirmed selected department reference in position-by-department task. |
| locations | `200` / `0` | `2` | Confirmed selected location reference in position-by-location task. |
| positions | `200` / `0` | `6` | Confirmed direct/static position references and position all-users expression reference. |

API-assisted confirmations:

- static direct users: confirmed where static values were present
- static direct positions: confirmed
- selected department for position-by-department: confirmed
- selected location for position-by-location: confirmed
- position all-users expression: position category confirmed
- user group expression: now confirmed as a readable group/member category through documented read-only `GET /groups` and `GET /groups/{id}/users`
- applicant/context-derived expressions: not static API lookups; runtime-context dependent

See also `docs/studies/yeeflow-api-operator-assignment-routing-coverage.md` for the API coverage audit. The audit adds read-only support for user detail, location detail, groups, group members, and position assignments. It does not add or test write APIs, and it does not prove runtime routing.

| Task | Export assignee classification | API-assisted interpretation | Confirmation | Notes |
|---:|---|---|---|---|
| 1 | applicant department manager | expression-only user/org manager lookup | not applicable to static ID | Expression references applicant department manager; no static department/user ID is embedded for API matching. |
| 2 | direct job position | job position reference | confirmed | Static position reference matched the positions category. |
| 3 | direct job position | job position reference | confirmed | Static position reference matched the positions category. |
| 4 | position by selected department | job position plus department references | confirmed | Static position and department references matched their API categories. |
| 5 | position by applicant department | job position plus applicant department expression | confirmed for static position | Position matched the positions category; applicant department is resolved by runtime expression. |
| 6 | position by selected location | job position plus location references | confirmed | Static position and location references matched their API categories. |
| 7 | position by applicant location | job position plus applicant location expression | confirmed for static position | Position matched the positions category; applicant location is resolved by runtime expression. |
| 8 | applicant line manager | expression-only user manager lookup | not applicable to static ID | Expression references applicant line manager; no static user ID is embedded for API matching. |
| 9 | specific user | user reference | confirmed | Static user reference matched the users category. |

Unresolved references:

- No static export reference remained unresolved by category in the read-only API comparison.
- Expression-derived applicant manager, department, and location references remain runtime-dependent because their final values are resolved from applicant context during workflow execution.

### Specific User

Proof level: `export-proven`

Shape:

```json
{
  "type": "user",
  "method": "direct",
  "value": "<USER_REF_CONFIRMED_BY_API>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: tenant-sensitive. Do not generate with hardcoded private user IDs unless the target tenant mapping is explicitly authorized and validated. Prefer applicant/current-user expression assignment or a safe user-selection field for generic packages.

### Applicant Line Manager

Proof level: `export-proven`

Shape:

```json
{
  "type": "user",
  "method": "expression",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Line Manager",
    "dataShape": {
      "type": "user",
      "param": {
        "id": {
          "parseStatus": "opaque",
          "expressionSourceHints": {
            "props": ["ApplicantUserID"],
            "usesApplicantUserId": true
          }
        }
      },
      "prop": "LineManager"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on runtime applicant context and user profile manager data. Export-proven only; routing behavior requires focused runtime proof.

### Applicant Department Manager

Proof level: `export-proven`

Shape:

```json
{
  "type": "user",
  "method": "expression",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Department:Manager",
    "dataShape": {
      "type": "org",
      "param": {
        "id": {
          "parseStatus": "opaque",
          "expressionSourceHints": {
            "props": ["ApplicantUserID", "OrganizationID"],
            "usesApplicantUserId": true
          }
        }
      },
      "prop": "Manager"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on applicant department and department manager configuration. The Help Center describes parent-department fallback behavior when a lower department has no manager, but that fallback is product-documented, not export-proven by this package.

### Direct Job Position

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "position",
  "position": "<POSITION_REF_CONFIRMED_BY_API>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: requires a valid target-tenant position. Use only when authorized org/reference data is available.

### Job Position By Selected Department

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionorg",
  "position": "<POSITION_REF_CONFIRMED_BY_API>",
  "value": "<DEPARTMENT_REF_CONFIRMED_BY_API>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: requires a valid target-tenant position and department pairing.

### Job Position By Applicant Department

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionorgexpr",
  "position": "<POSITION_REF_CONFIRMED_BY_API>",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Department",
    "dataShape": {
      "type": "user",
      "prop": "OrganizationID"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on applicant context, department hierarchy, and position assignment data.

### Job Position By Selected Location

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionloc",
  "position": "<POSITION_REF_CONFIRMED_BY_API>",
  "value": "<LOCATION_REF_CONFIRMED_BY_API>",
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: requires valid target-tenant location and position data.

### Job Position By Applicant Location

Proof level: `export-proven`

Shape:

```json
{
  "type": "position",
  "method": "positionlocexpr",
  "position": "<POSITION_REF_CONFIRMED_BY_API>",
  "value": {
    "kind": "expressionButton",
    "label": "Applicant:Location",
    "dataShape": {
      "type": "user",
      "prop": "LocationID"
    }
  },
  "title": "<REDACTED_ASSIGNEE_LABEL>"
}
```

Generation note: depends on applicant context, location setup, and position assignment data.

## Help Center Comparison

| Help Center concept | Export-proven field/shape from `Test ABC.yap` | Match status | Notes | Proof level |
|---|---|---|---|---|
| Assignment Task action creates approval/complete work for assigned users | `MultiAssignmentTask` nodes with `properties.usertaskassignment`, approval settings, and task form `taskurl` | matched | Export has approval-style tasks; task type field is not present in these nodes. | product-documented + export-proven |
| Task assignee can be single or multiple users | Every export task has `usertaskassignment` array with one entry | partially matched | Array shape supports multiple entries, but multiple users were not present. | product-documented + export-proven partial |
| Specific direct user | `type=user`, `method=direct`, `value`, `title` | matched | Values are redacted. | product-documented + export-proven |
| Expression-based assignee | `type=user`, `method=expression`, rich HTML expression button in `value` | matched | Export includes applicant line manager and applicant department manager expressions. | product-documented + export-proven |
| Applicant/requester line manager | expression label `Applicant:Line Manager`, `prop=LineManager` | matched | Depends on applicant user context and manager profile data. | product-documented + export-proven |
| Applicant/requester department manager | expression label `Applicant:Department:Manager`, outer `type=org`, `prop=Manager` | matched | Parent-department fallback is product-documented but not visible in export schema. | product-documented + export-proven |
| Selected department manager | no distinct static department-manager entry found | not found in export | Static department reference appears only as position-by-department, not direct manager. | product-documented + unproven |
| Direct job position | `type=position`, `method=position`, `position`, `title` | matched | Two tasks use this shape. | product-documented + export-proven |
| Job position by selected department | `type=position`, `method=positionorg`, `position`, `value`, `title` | matched | `value` is the selected department reference. | product-documented + export-proven |
| Job position by applicant/current department | `type=position`, `method=positionorgexpr`, expression label `Applicant:Department` | matched | Uses applicant context and `OrganizationID`. | product-documented + export-proven |
| Job position by selected location | `type=position`, `method=positionloc`, `position`, `value`, `title` | matched | `value` is the selected location reference. | product-documented + export-proven |
| Job position by applicant/current location | `type=position`, `method=positionlocexpr`, expression label `Applicant:Location` | matched | Uses applicant context and `LocationID`. | product-documented + export-proven |
| Job position by department plus location | no combined department/location shape found | not found in export | Do not generate until export/runtime evidence exists. | product-documented terminology only if applicable + unproven |
| User group assignee | no user group assignment entry found | not found in export | Mentioned in Assignee Editor behavior reference, but not export-proven here. | product-documented + unproven |
| Workflow variable assignee | no workflow-variable assignee entry found | not found in export | Mentioned in Assignee Editor behavior reference, but not export-proven here. | product-documented + unproven |
| Appointed order sequential/parallel | no `issequential` field found in this export's task properties | not found in export | Existing action reference lists `properties.issequential`, but this sample did not include it. | product-documented + implementation-reference |
| Completion condition all/any/custom percentage | `approveway=allapprove`, `approvepercentage=100` | partially matched | Other modes are in existing action reference, not in this export. | product-documented + export-proven partial |
| Task form association | `properties.taskurl` points to a redacted task form page id | matched | Task form settings are secondary in this study. | product-documented + export-proven |
| Reassign/add-assignee buttons | `isallowreassign=false`; no add-assignee field observed | partially matched | Sign/additional assignee behavior not proven by this export. | product-documented + export-proven partial |
| Email/notification settings | `isenabledemail=false`; notification fields absent | partially matched | Notification settings are secondary in this study. | product-documented + export-proven partial |

## Complete Task And Due Date Extension

`Test ABC (2).yap` extends the Assignment Task learning from assignee-only settings into task type and due-date configuration.

| Finding | Export-proven field/shape | Count / values | Proof level |
|---|---|---|---|
| Assignment Task count | `MultiAssignmentTask` | 12 | export-proven |
| Approval/default task type | absent `properties.tasktype` | 5 nodes | export-proven |
| Complete task type | `properties.tasktype="complete"` | 7 nodes | export-proven |
| Due date amount | `properties.duedatedefinition` | `120`, `3` | export-proven |
| Due date units | `properties.duedatetype` | `hour`, `day`, `express` | export-proven |
| Working-day calculation | `properties.isfromworkcalendar=true` | observed on one day-based node | export-proven |
| Due-date expression | `properties.duedateexpress` | expression-button date variable | export-proven |
| Reminder rules | `properties.notifyrules[]` | 20 rules across email-enabled tasks | export-proven |
| Reminder timing | `notifyrules[].actiondate.relative` | `"0"`, `"-1"`, `"1"` | export-proven |
| Reminder offset units | `notifyrules[].actiondate.type` | `day`, `hour` | export-proven |

`minute` due-date units are product-documented by the Help Center but were not found in `Test ABC (2).yap` or `Test ABC (3).yap`.

Reminder recipient interpretation:

- Task-level `properties.to` uses the current task assignee email expression; this matches the task-owner/default-recipient behavior described by the Help Center.
- `notifyrules[]` stores action timing, subject, and content. No separate rule-level recipient field was found.
- Applicant, task-owner line manager, task-owner department manager, and specified-recipient reminder shapes were not found in the export.

Detailed task-type and due-date findings are documented in:

```text
docs/studies/workflow-assignment-task-complete-task-and-due-date.md
```

Normalized references are under:

```text
docs/studies/normalized/workflow-assignment-task/
```

## Validator Recommendations

Warning-first validator support is appropriate:

- identify `MultiAssignmentTask` nodes
- warn when `properties.usertaskassignment` is missing, not an array, or empty
- warn when an assignee entry is not an object
- warn when `type` or `method` is missing
- warn when method is outside the export-proven set: `direct`, `expression`, `position`, `positionorg`, `positionorgexpr`, `positionloc`, `positionlocexpr`
- warn when position-based assignment lacks `position`
- warn when static direct/department/location assignment lacks `value`
- warn when expression assignment lacks an expression-button-shaped `value`
- warn that direct user assignment is tenant-sensitive
- warn for unknown `approveway` values; export-proven values are `allapprove`, `anyprocess`, `anyapprove`, `anyreject`, and `custompercentage`
- warn when `approveway=custompercentage` lacks a numeric `approvepercentage`
- warn when `issequential` is present but not boolean
- warn when `isenabledemail=true` lacks `to`, `subject`, or `html` notification shape
- warn for unknown `tasktype` values; absence of `tasktype` is the studied approval/default shape and `complete` is the studied Complete task shape
- warn for unknown `duedatetype` values; `hour`, `day`, and `express` are export-proven while `minute` is product-documented
- warn when `duedatetype=express` lacks `duedateexpress`
- warn when `notifyrules[]` has malformed action-date timing or missing subject/content
- warn that user-group assignment is export-proven and API-category-assisted, but group expansion/routing remains runtime-unproven

Do not add hard errors in compatibility mode from this study. Existing packages may omit optional fields or use unstudied tenant-specific shapes.

## Generation Rules

- Treat these shapes as export-proven schema references, not runtime-proven routing behavior.
- Do not invent assignee methods beyond the export-proven set.
- Specific direct-user assignment requires explicit authorized target-tenant user mapping or safe read-only directory lookup.
- Position, department, and location assignment requires valid target-tenant org/reference data.
- If org/reference lookup is authorized, use `yeeflow-api-operator` read-only lookup and never commit raw API responses or private org data.
- For generic generated packages, prefer applicant/current-user expression routing or user-selection field patterns over hardcoded direct users.
- Multiple assignee arrays, user-group expression, position all-users expression, Sequential marker, Parallel/default absence of `issequential`, `approveway` variants, custom percentage, and email notification fields are export-proven from `Test ABC (1).yap`.
- Preserve assignee array order when `issequential=true`; do not claim runtime order until a focused runtime baseline proves it.
- Treat absent `issequential` as parallel/default only with the current proof boundary; runtime proof is still required.
- Email notification config can be generated from export-proven fields only when explicitly requested and safe, but notification delivery must not be tested or claimed without scoped runtime approval.
- Preserve Complete task marker `tasktype="complete"` only when generating Complete task nodes; preserve absent `tasktype` for approval/default nodes unless a future export proves an explicit approval marker.
- Preserve due-date fields together: `duedatedefinition`, `duedatetype`, optional `duedateexpress`, optional `isfromworkcalendar`, and `notifyrules[]`.
- Do not invent Automatic Treatment due-date action rules; only reminder `actiontype="1"` is export-proven here.
- Data-list workflow Assignment Tasks can use list-item field context in assignee expressions. `Purchase Requests.ydl` export-proves a Created By list-field expression that resolves the Created By user's line manager.
- Preserve data-list assignee expressions as expression-button strings; do not replace them with static users or invented IDs.
- When generating data-list workflow task forms, preserve list-bound controls with `isListControl`, `identifier`, `InternalName`, `fieldID`, and `____customListFields_` binding. Use read-only settings for custom list fields when the task should not update source list data.
- Do not claim selected department manager, workflow variable, position by department plus location, or quick-completion behavior as generation-safe from these exports alone.

## Runtime-Test Plan

A focused runtime baseline is recommended before merge if these rules will be promoted beyond export-proven/validator-backed guidance.

Suggested minimal runtime baseline:

1. Build a small approval app with one request form and one task form.
2. Include one assignment task per assignee class to test, starting with:
   - applicant line manager
   - applicant department manager
   - direct job position
   - job position by applicant department
   - job position by applicant location
   - multiple static users
   - mixed direct user plus position
   - user group expression if a safe disposable group is available
   - Sequential appointed order
   - Parallel/default appointed order
   - custom percentage completion
   - Complete task designer/open proof
   - due-date and reminder configuration designer/open proof
   - email notification configuration designer/open proof, with delivery disabled or explicitly scoped
3. Use safe target-tenant org data selected through authorized read-only lookup or user-provided non-private setup.
4. Locally validate package, graph, workflow action configuration, and secret scans before import.
5. Import/open only after local validation passes.
6. Submit only disposable requests with explicitly safe assignees.
7. Record whether tasks route to expected safe users/positions without exposing identities.

Do not execute workflow, send notifications, or expose user identities unless the runtime test scope is explicitly safe.

## Known Gaps

- Runtime routing is not proven.
- Multiple direct users are export-proven only as part of a mixed position/user task, not as a task containing only direct users.
- Mixed assignee sources in one task are export-proven but not runtime-proven.
- User group assignee is export-proven, product-documented, and API-category-assisted, but group expansion/routing is not runtime-proven.
- Workflow variable assignee is not found in this export.
- Position by department plus location is not found in this export.
- Selected department manager as a direct static manager shape is not found in this export.
- Parent-department manager fallback is product-documented but not export-proven.
- Email notification fields and due-date reminder settings are export-proven, but delivery, quick completion, due-date scheduling, and task-form open behavior are not runtime-proven here.
- Minute due-date units and Automatic Treatment reminder actions are product-documented but not export-proven in these files.
- Data-list workflow Created By/list-field assignee routing is export-proven but not runtime-proven.
- Data-list workflow task form list-field edit/save behavior is not runtime-proven.

## Data-List Workflow Extension

`Purchase Requests.ydl` adds export-proven data-list workflow behavior to the Assignment Task study:

| Area | Export-proven finding | Proof level |
|---|---|---|
| Workflow type | One `WorkflowType: 1` data-list workflow with a `FlowMappings[]` new-item trigger | export-proven |
| Assignment task | One `MultiAssignmentTask` with `usertaskassignment[]` | export-proven + validator-backed |
| Direct user | Static direct user shape reused from approval workflows | export-proven; tenant-sensitive |
| Applicant manager | Applicant line manager expression shape reused | export-proven |
| User group | User group `All users` expression shape reused | export-proven; runtime-unproven |
| List-item assignee | Created By list-field expression resolving `LineManager` | export-proven |
| Due date | `duedatedefinition: 120`, `duedatetype: hour` | export-proven |
| Notification | Assignment Task email fields and one due-date reminder rule present | export-proven; delivery untested |
| Task form | Task form includes normal controls, list-bound controls, workflow action panel, and history | export-proven |

The data-list workflow export proves that Assignment Task expressions can reference list-item context. The concrete committed normalized example uses `<CREATED_BY_FIELD_ASSIGNEE_REF>` and `<LIST_FIELD_ASSIGNEE_REF>` placeholders and does not expose raw list, field, user, or tenant identifiers.

See also:

- `docs/studies/workflow-approval-vs-data-list-actions.md`
- `docs/studies/normalized/workflow-assignment-task-assignees/assignment-assignee-data-list-field-value.normalized.json`
- `docs/studies/normalized/workflow-assignment-task-assignees/assignment-assignee-created-by-list-field.normalized.json`
