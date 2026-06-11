# Assignment Task Assignee Runtime Baseline

## Purpose

This baseline tests whether export-proven Assignment Task assignee configuration can be regenerated into a focused approval app and opened in Yeeflow without exposing private organization data.

Current proof level:

- `export-proven` from `/Users/Renger/Downloads/Test ABC.yap` and `/Users/Renger/Downloads/Test ABC (1).yap`
- `API-category-assisted` through read-only Yeeflow API Operator checks
- `validator-backed` through local package, graph, and assignment-inspection checks
- `designer-proven` for the first generated package import/open/designer pass
- not `runtime-proven` for assignment routing

## Inputs And Artifacts

| Item | Path | Commit policy |
|---|---|---|
| Previous source export | `/Users/Renger/Downloads/Test ABC.yap` | not committed |
| Latest source export | `/Users/Renger/Downloads/Test ABC (1).yap` | not committed |
| Generator script | `generate-assignment-task-assignee-runtime-baseline.mjs` | committed |
| Generated package | `assignment-task-assignee-runtime-baseline.v2.yap` | ignored and not committed |
| Upload convenience copy | `/private/tmp/a.yap` | outside repo, not committed |
| User-exported manual repair | `/Users/Renger/Downloads/Assignment Task Assignee Runtime Baseline.yap` | not committed |

The generator decodes the source export read-only, clones export-proven `MultiAssignmentTask.properties.usertaskassignment[]` shapes, assigns a fresh package ID family, and writes a focused `.yap` package. The generated package can contain tenant-local references copied from the source export, so it must remain ignored.

## API-Assisted Test Planning

The Yeeflow API Operator assignment-routing coverage helper was run with local credentials loaded from `.env.local`. The API key value was not printed, and no raw responses were saved.

Endpoint/category results:

| Category | Read-only result | Count summary |
|---|---:|---:|
| Users | readable | total 3, returned sample 1 |
| Departments | readable | returned 6 |
| Locations | readable | returned 2 |
| Positions | readable | returned 6 |
| Groups | readable | total 2, returned sample 1 |
| Static user details | readable | 3 redacted objects checked |
| Group members | readable | total 2, returned sample 1 |
| Location detail | readable | 1 redacted object checked |
| Position users | readable | counts 1, 1, and 5 |
| Position by department | readable | returned 1 |
| Position by location | readable | returned 1 |

API lookup confirms object categories and availability only. It does not prove workflow routing, group expansion in a task, appointed-order behavior, or notification delivery.

## Generated Workflow

Generated app name:

```text
Assignment Task Assignee Runtime Baseline V2
```

Generated approval form key:

```text
ATAR2
```

The generated workflow is a linear focused chain:

| Order | Assignment Task label | Pattern under test | Intended proof |
|---:|---|---|---|
| 1 | Static User Assignment | one `type=user`, `method=direct` entry | runtime-submit candidate |
| 2 | Multiple Static Users Assignment | two direct-user entries | designer/open |
| 3 | Direct Position Assignment | `type=position`, `method=position` | designer/open |
| 4 | Position By Department Assignment | `method=positionorg`, `approveway=custompercentage`, `approvepercentage=60` | designer/open |
| 5 | Position By Location Assignment | `method=positionloc` | designer/open |
| 6 | User Group Assignment | user-group expression source | designer/open |
| 7 | Sequential Multiple Assignees | mixed expression sources, `issequential=true` | designer/open |
| 8 | Parallel Multiple Assignees | mixed direct user and direct position, absent `issequential` | designer/open |
| 9 | Any Process Approval Mode | `approveway=anyprocess` | designer/open |
| 10 | Any Reject Approval Mode | `approveway=anyreject` | designer/open |
| 11 | Email Notification Config | `isenabledemail=true` with exported notification fields | designer/open only, no delivery |

## Local Validation

The regenerated package passed local validation with warnings:

| Check | Result | Notes |
|---|---|---|
| Generator syntax check | passed | `node --check generate-assignment-task-assignee-runtime-baseline.mjs` |
| Package validation | `pass_with_warnings` | 0 errors, 14 warnings retained from source shape |
| Graph validation | `pass_with_warnings` | 0 errors, 10 workflow warnings remain |
| Assignment inspector | passed | 11 Assignment Task nodes found |
| Generated package commit check | passed | `.yap` package is ignored and uncommitted |

Inspector patterns found in the generated package:

- `specific-user`
- `multiple-specific-users`
- `job-position`
- `mixed-static-and-position`
- `position-by-department`
- `position-by-location`
- `position-by-applicant-location`
- `user-group`
- `multi-source-expression`

## Runtime Result

### First Generated Package

The first generated package imported successfully and the app card appeared in Yeeflow. The app opened to the approval form and showed the expected unpublished-form state with an option to open Form Builder.

The workflow designer opened and rendered the generated Assignment Task nodes.

Designer panel checks:

| Pattern | Runtime observation | Proof level |
|---|---|---|
| Sequential appointed order | `Sequential Multiple Assignees` panel opened; Sequential radio selected; assignees displayed as applicant line manager plus user group all users | designer-proven |
| Parallel/default appointed order | task panels showed Parallel selected when `issequential` was absent | designer-proven |
| Email notification task | `Email Notification Config` panel opened; assignee displayed as position by applicant location; email delivery was not tested | partial designer-proven |
| Completion condition UI | completion condition area rendered for checked task panels | partial designer-proven |

Publish was blocked with:

```text
The input line of Sequential Multiple Assignees is missing.
```

This means the first package is import/open/designer-proven, but not publish-proven and not runtime-routing-proven.

### Rebuilt Package

The generator was updated to preserve native-looking shape IDs, `position` geometry, and `incoming`/`outgoing` sequence-flow references. Local validation still passed.

An import of the rebuilt package created a duplicate-renamed app card, but the card could not be reliably reopened from the filtered home view during this pass. A repeated import hit duplicate package/app identity interference and showed an import-failed status for the duplicate name.

Because of this runtime environment collision, the rebuilt package remains local-validator-backed only. It still needs a clean runtime pass with a unique package identity and fresh app name before publish or routing claims can be made.

### Manual Export Comparison

The user manually adjusted the first imported app and exported it as:

```text
/Users/Renger/Downloads/Assignment Task Assignee Runtime Baseline.yap
```

The exported-back workflow had 12 Assignment Task nodes and 15 SequenceFlow nodes. It showed two important facts:

- Yeeflow publishes only when `SequenceFlow.source/target` and the source/target nodes' `outgoing[]`/`incoming[]` references agree.
- The manually repaired export included a connected Sequential Multiple Assignees node and an extra Position By Location Assignment -> End outcome line.

The failed repeated-import attempts were traced to package identity and ID-remapping issues in the generator, not to the assignee settings themselves:

- the generated package still carried the source form `ProcModelID` in `Data.Forms[0].ProcModelID`
- that stale process-model ID was not fully remapped to the fresh generated process ID
- repeated imports also reused the same title/form key during a failed-import state, which made Yeeflow treat the later imports as duplicate/colliding app attempts

The V2 generator now uses:

- fresh default ID family `734`
- fresh form key `ATAR2`
- title `Assignment Task Assignee Runtime Baseline V2`
- semantic runtime-importable `rt_*` node and `rt_flow_*` IDs
- complete root/process replacement, including `Data.Forms[0].ProcModelID`
- a non-overlapping left-to-right workflow layout

V2 local structure check:

| Item | Result |
|---|---:|
| Assignment Task nodes | 11 |
| SequenceFlow nodes | 12 |
| Link consistency issues | 0 |
| Incoming/outgoing per Assignment Task | 1 incoming, 1 outgoing |
| Workflow layout | left-to-right, no overlapping nodes |

V2 runtime result:

| Runtime step | Result |
|---|---|
| Import | passed |
| App open | passed |
| Form designer open | passed |
| Workflow designer open | passed |
| Node layout visibility | passed; nodes rendered left-to-right without overlap |
| Publish | passed; Yeeflow showed "The form has been published successfully!" |
| Published form open | passed |
| Request submission | not run |
| Email delivery | not run |

## Runtime Submit Result

No request was submitted.

Reasons:

- Assignment targets are copied tenant-local users, groups, positions, departments, and locations from the learning export.
- Submitting could route live tasks to real tenant users or groups.
- The email notification task is late in the workflow, but this pass did not scope safe email delivery recipients.

Email delivery was not tested and remains out of scope.

## Proof Boundary By Capability

| Capability | Current proof level | Notes |
|---|---|---|
| Static direct user assignment | export-proven, API-category-assisted, validator-backed, import/open/publish-proven in V2 | routing not tested |
| Multiple static users | export-proven, API-category-assisted, validator-backed, import/open/publish-proven in V2 | routing not tested |
| Direct job position | export-proven, API-category-assisted, validator-backed, import/open/publish-proven in V2 | expansion/routing not tested |
| Position by selected department | export-proven, API-category-assisted, validator-backed, import/open/publish-proven in V2 | routing not tested |
| Position by selected location | export-proven, API-category-assisted, validator-backed, import/open/publish-proven in V2 | routing not tested |
| User group assignee source | export-proven, API-category-assisted, validator-backed, import/open/publish-proven in V2 | group expansion/routing not tested |
| Sequential appointed order | export-proven, validator-backed, import/open/publish-proven in V2 | routing order not tested |
| Parallel/default appointed order | export-proven, validator-backed, import/open/publish-proven in V2 | runtime behavior not tested |
| `approveway` values | export-proven, validator-backed, import/open/publish-proven in V2 | completion behavior not tested |
| `approvepercentage=60` | export-proven, validator-backed | threshold behavior not tested |
| Email notification configuration | export-proven, validator-backed, partially designer-visible | no email delivery test |
| Applicant line manager | export-proven, runtime-context dependent | not runtime-tested |
| Department manager | export-proven, runtime-context dependent | not runtime-tested |
| Workflow-variable assignee | unproven | not in studied exports |
| Position by department plus location in one source | unproven | not in studied exports |

## Next Runtime Pass

A follow-up runtime pass is needed before merge if the branch is intended to promote Assignment Task routing beyond export/design proof.

Recommended next pass:

- submit only the first task path with explicitly safe assignees
- if assignment routing is tested, create or select safe test-only users/groups/positions before submission
- keep email notification configuration designer/open only unless safe recipients and delivery scope are explicitly approved
