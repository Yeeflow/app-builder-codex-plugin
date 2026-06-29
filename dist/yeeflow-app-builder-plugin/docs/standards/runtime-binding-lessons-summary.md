# Runtime Binding Lessons Summary

Official v0.6.19 converts two real application-generation issue reports into reusable generator and validator rules. This document is intentionally redacted and structural. It does not depend on private package paths, tenant ids, raw `Resource`, raw `Sign`, decoded payloads, screenshots, private URLs, or raw API responses.

## Dashboard Binding Lesson

A dashboard can look complete while still being functionally unbound. Summary, Collection, Data table, chart, and pivot controls are data-bound controls, not visual decorations.

Generated Summary controls must include:

- `attrs.data.list`
- an aggregate field through `attrs.field` or an equivalent export-proven field slot
- a matching layout-resource `Resource.exts[]` entry
- `exts[].category = "___Pivot___"`
- `exts[].key = "summary"`
- `exts[].i` equal to the Summary control id
- `exts[].attr.settings.values[]` with field, field type, and aggregate function
- registration in the dashboard layout-resource `Resource.ReportIds[]`

Dashboard filters must be wired end to end:

- filter controls bind to stable page `filterVars[]`
- generated variable names should be stable, for example `filter_{PageName}_{FilterName}`
- every declared filter variable is consumed by at least one Summary, Collection, Data table, chart, or pivot control
- Summary consumers use `exts[].attr.settings.Conditions[]`
- Collection and Data table consumers use `attrs.data.filter[]`
- consumer conditions reference fields that exist on the consumer source list
- lookup-backed filters compare record ids/ListDataID-style values, not display labels

Generated Data Analytics controls must also be wired end to end:

- the visible chart or pivot control must be cloned from an approved Data Analytics golden reference, not rebuilt as a shell
- the same layout resource must register the control id in `Resource.ReportIds[]`
- the same layout resource must include a matching `Resource.exts[]` entry with `category: "___Pivot___"` and the expected chart or pivot `key`
- visible `attrs.data.list` and `attrs.model.source` must include `AppID`, `ListID`, and `ListSetID`, and must match the source metadata in `Resource.exts[]`
- `settings.rows[]` and `settings.values[]` must contain real source field identities, not empty objects or display-only labels
- COUNT analytics must use the proven `ListDataID` identity on `field`, `fieldName`, `FieldName`, and `id`; aliases such as `ListDataID_COUNT` or field UUIDs can pass static shape checks but render blank charts
- `runtimeModelProven: true` is allowed only after the wrapper, visible source metadata, `ReportIds[]`, `exts[]`, row/value fields, and visible model surfaces are aligned

## Leave Request Runtime Lesson

Schema validity, package acceptance, signing HTTP status, and API upgrade status are separate proof boundaries. None of them alone proves runtime-visible application completeness.

Future generated apps must separately report:

- local schema validation
- feature and plan-conformance validation
- signing and `verifysign`
- API install or upgrade-check
- API install or upgrade-apply
- runtime/designer/manual proof

Approval applications must include real usable controls and workflow runtime controls. Static text-only approval pages do not satisfy the app plan.

## Navigation And Group Lesson

Generated navigation must be compared to the approved app plan. Validate visible groups, visible entries, hidden anchors, extra entries, and resources that exist but are unreachable from navigation.

App/navigation group ids must use API-issued long ids where the runtime expects them. Small local ids such as `1`, `2`, `3`, and `4` are placeholders and must fail generated-final checks for app groups.

## Service Portal Lesson

Service portal payloads are generated only when the app plan explicitly includes service portal behavior. When the plan excludes service portal, validator checks should reject or warn on portal resources, portal permissions, and portal navigation payloads according to generation mode.

## Requester Context Lesson

When requester Department and Manager come from native user profile attributes, use expression editor profile functions, not an Employee Profiles `querydata` lookup.

The verified Set variable pattern is:

- Department target: `id = "Department"`, `name = "Workflow Variables:Department"`, `valueType = "groupselect"`, attribute key `DepartmentID`
- Manager target: `id = "Manager"`, `name = "Workflow Variables:Manager"`, `valueType = "user"`, attribute key `LineManager`
- Requester source: `id = "Requester"`, `name = "Workflow Variables:Requester"`, `valueType = "user"`

Reject the old shape:

- `__variables_Department`
- `__variables_Manager`
- `__variables_Requester`

Expression validation must inspect both the `getUserAttr` function token and the surrounding Set variable storage wrapper. A correct function token with the wrong wrapper is still invalid.

## Policy Modeling Lesson

Business policy variants should be modeled as data. For leave-style applications, a policy catalog should support fields such as:

- Balance Limited
- Balance Block Mode
- Attachment Required After Days
- HR Review Required

Over-balance behavior should be represented as submit validation/action metadata driven by policy fields. Do not hardcode one universal leave-balance rule when the business has balance-limited and non-balance-limited variants.
