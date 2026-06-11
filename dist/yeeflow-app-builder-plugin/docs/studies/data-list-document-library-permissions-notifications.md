# Data List And Document Library Permissions And Notifications

Proof boundary: export-proven for Data List permission flags and Data List `RemindRules` notification schema found in `<downloads>/Data Lists (1).yap`; product-documented only for Document Library applicability; Form Report negative rule; not runtime-proven for permission enforcement or notification delivery.

## Overview

This study reopens the Data List permissions and notifications pass after UI review confirmed that the source app contains configured permission examples. The export was decoded read-only into ignored `tmp/` workspace using the repository decoder, preserving large numeric IDs as strings. The original `.yap` was not modified or committed.

The decoded application contains seven `Data.Childs[]` Type `1` Data List resources and no Type `16` Document Library resources. The five target lists were found:

| List | Export path | Export-located permission fields | Detailed audience matrix |
| --- | --- | --- | --- |
| Event Planning | `Data.Childs[0]` | `ListModel.Perm = 4`, `IsBreakInherit = false`, `IsItemPerm = true`; every view has `IsItemPerm = false` | UI-confirmed, not found in package payload |
| Event planning 2 | `Data.Childs[2]` | `ListModel.Perm = 4`, `IsBreakInherit = false`, `IsItemPerm = true`; every view has `IsItemPerm = false` | UI-confirmed, not found in package payload |
| Event planning 3 | `Data.Childs[3]` | `ListModel.Perm = 4`, `IsBreakInherit = false`, `IsItemPerm = true`; every view has `IsItemPerm = false` | UI-confirmed, not found in package payload |
| Event planning 4 | `Data.Childs[4]` | `ListModel.Perm = 4`, `IsBreakInherit = false`, `IsItemPerm = true`; every view has `IsItemPerm = false` | UI-confirmed, not found in package payload |
| Event planning 5 | `Data.Childs[5]` | `ListModel.Perm = 4`, `IsBreakInherit = false`, `IsItemPerm = true`; every view has `IsItemPerm = false` | UI-confirmed, not found in package payload |

## Scope And Resource Applicability

Data List and Document Library manage-permission and custom-notification features are product-documented for Data Lists and Document Libraries. The two Help Center references reviewed were:

- Data List / Document Library permissions: `https://<yourdomain>.yeeflow.com/<redacted-path>
- Data List / Document Library notifications: `https://<yourdomain>.yeeflow.com/<redacted-path>

This export proves the Data List package shape for the located fields. It does not include a Type `16` Document Library, so Document Library schema remains product-documented only in this pass. Form Report is not a Data List or Document Library for these settings: prior Form Report learning covers report access, export permission, and detail-view access only. Do not generate Data List / Document Library manage-permission or custom-notification settings on Form Reports.

## Data List Permissions Findings

The deep permission search covered:

- wrapper keys: `Title`, `Description`, `IconUrl`, `IsListSet`, `Resource`
- decoded resource keys: `MainListType`, `AppID`, `ReplaceIds`, `ReportIds`, `FormKeys`, `Data`, `SimplePortal`
- `Data.Item`, `Data.Childs[]`, `ListModel`, `Defs`, `Layouts`, `PublicForms`, `RemindRules`, `FlowMappings`, `ListDatas`
- parsed nested JSON strings in `LayoutView`, `Ext1`, `Rules`, `Receiver`, and layout resources
- broad key/string patterns including `Perm`, `Permission`, `IsItemPerm`, `IsBreakInherit`, `Inherit`, `Administrators`, `Admin`, `Basic`, `Advanced`, `Edit`, `Delete`, `New`, `Import`, `Export`, `View`, `Audience`, `Users`, `Groups`, `Departments`, `UserGroups`, `DataSecurity`, `Security`, `Policy`, `Role`, `ACL`, `Access`, `Auth`, `Guest List`, and `Created By`

Export-located permission fields:

- `Data.Childs[].ListModel.Perm` is numeric; all five target lists use `4`.
- `Data.Childs[].ListModel.IsBreakInherit` is boolean; all five target lists use `false`.
- `Data.Childs[].ListModel.IsItemPerm` is boolean; all five target lists use `true`.
- `Data.Childs[].ListModel.AdvanceList` is an empty array in all five target lists.
- `Data.Childs[].ListModel.Ext1`, `Ext2`, and `Ext3` are `null` in all five target lists.
- `Data.Childs[].Layouts[].IsItemPerm` is `false` on every data-view layout in the five target lists.
- `Data.Childs[].Layouts[].Perm` is absent.

Not export-located after deep search:

- administrators audience array
- Edit Item / View Item all-users versus specified-users selection
- selected user, department/team, user-group, or field/list-field audience rows for basic permissions
- advanced permission matrix rows
- advanced operation booleans for edit, delete, new, import, and export

Interpretation:

- UI evidence confirms the configured permission examples exist in the live app. This study does not treat screenshots as export schema.
- The `.yap` package appears to carry the coarse permission flags and view-level `IsItemPerm`, but not the detailed manage-permission audience payload.
- Validators should parse and warn on the located flags. They should not invent or require detailed audience blocks from this export.
- A focused export or API-backed read-only permission export is still needed to promote administrator/basic/advanced audience schema to export-proven.

## Data List Notifications Findings

`Event planning 5` contains nine notification rules at `Data.Childs[5].RemindRules[]`. The app also contains two more `RemindRules` in `Project tasks`, but the targeted notification study uses `Event planning 5`.

Export-located rule fields:

- `TenantID`, `ID`, `CategoryID`, `AppID`, `ListID`
- `Title`
- `SendType`
- `Type`
- `From`
- `Subject`
- `Content`
- `Rules` as stringified JSON
- `Receiver` as stringified JSON
- `Status`
- created/modified audit fields

Notification type codes found in `Event planning 5`:

| Type code | Meaning inferred from rule shape and UI label | Count | Export notes |
| --- | --- | ---: | --- |
| `1` | item added | 1 | `Rules.Rules.Period = "Daily"`, empty conditions |
| `4` | item changed | 1 | `Rules.Rules.Type = 2`, `Rules.Rules.Fields[]`, condition data with `left`, `op`, `right` |
| `3` | date-field reminder | 2 | `Duedate`, `Day`, `IsCheck`, `Time`, optional `Type = "before"` |
| `2` | regular reminder | 5 | daily, weekly, monthly, and yearly schedules via `Period`, date ranges, day/month fields, and `Time` |

Recipient shapes found:

- explicit user recipient: `Receiver.Identities[].Type = 1`
- explicit department/team recipient: `Receiver.Identities[].Type = 2`
- explicit user-group recipient: `Receiver.Identities[].Type = 3`
- list-field recipient: `Receiver.ListDefs[]`, for example the internal list field name for the guest-list identity picker

Message/template fields:

- `Subject` and `Content` are HTML strings.
- Field tokens appear as HTML `input` placeholders with JSON-like `data` expressions.
- Content can include list item field tokens and list URL tokens such as `viewURL` and `editURL`.
- `Status = 1` appears on all nine rules and is treated as enabled in this export.

Condition findings:

- Empty condition is represented as `Rules.Conditions = { "Type": 1, "Data": "" }`.
- A fixed condition sample appears on the item-changed rule with `Conditions.Type = 2` and `Conditions.Data` as stringified JSON array.
- The condition item reuses the data-view-like flat condition shape: `key`, `pre`, `left`, `op`, `right`, `group`.

## Document Library Applicability

No Type `16` Document Library resources are present in `Data Lists (1).yap`. Product documentation describes Data List and Document Library permissions/notifications together, but this pass did not export-prove a Document Library package schema for manage-permission or notification settings.

Generator and validator guidance should therefore say:

- Data List notification `RemindRules` are export-proven from this package.
- Document Library permission/notification concepts are product-documented only in this pass.
- Do not clone Data List notification or permission package fields into Document Library generation until a Type `16` export proves the exact shape, unless explicitly marked product-documented and runtime-sensitive.

## Form Report Negative Rule

Form Reports do not support the same Data List / Document Library manage-permission and custom-notification feature set. Keep Form Report permission handling limited to the prior Form Report study:

- report access behavior
- export permission toggle
- detail-page access flag
- view-level settings for Type `32` list-like resources

Do not add Data List / Document Library `RemindRules` custom notifications or manage-permission matrix guidance to Form Report generation.

## Export Paths And Schema Notes

Permission paths found:

- `Data.Childs[n].ListModel.Perm`
- `Data.Childs[n].ListModel.IsBreakInherit`
- `Data.Childs[n].ListModel.IsItemPerm`
- `Data.Childs[n].ListModel.AdvanceList`
- `Data.Childs[n].Layouts[m].IsItemPerm`

Notification paths found:

- `Data.Childs[5].RemindRules[]`
- `Data.Childs[5].RemindRules[].Rules` as stringified JSON
- `Data.Childs[5].RemindRules[].Receiver` as stringified JSON
- `Rules.Rules.Period`, `StartTime`, `EndTime`, `WeekDay`, `MonthDay`, `YearMonth`, `Duedate`, `Type`, `Day`, `IsCheck`, `Time`, `Fields[]`
- `Rules.Conditions.Type`
- `Rules.Conditions.Data` as empty string or stringified condition-array JSON
- `Receiver.Identities[]`
- `Receiver.ListDefs[]`

## Validator Rules

Warning-first checks added or expected:

- parse list permission flags where present: `Perm`, `IsBreakInherit`, `IsItemPerm`
- warn if `AdvanceList` is present but not an array
- warn if `ListModel.Ext1/Ext2/Ext3` contain permission-like stringified JSON that cannot be parsed
- parse `RemindRules[]`
- parse each notification `Rules` JSON string
- parse each notification `Receiver` JSON string
- recognize notification type codes `1`, `2`, `3`, and `4`
- recognize recipient identity type codes `1`, `2`, and `3`
- recognize list-field recipients through `Receiver.ListDefs[]`
- warn on unknown notification types, unknown recipient types, invalid condition JSON, or unknown schedule shapes

Do not hard-fail compatibility packages for missing detailed audience matrices, because this export does not include one.

## Remaining Unproven Gaps

- Administrator audience schema is UI-confirmed but not export-located.
- Basic permission edit/view all-users versus specified-users schema is UI-confirmed but not export-located.
- Advanced permission matrix row schema and edit/delete/new/import/export operation booleans are UI-confirmed but not export-located.
- Field/list-field permission audience rows are UI-confirmed but not export-located.
- Document Library permission and notification package schema is product-documented only in this pass.
- Permission enforcement and notification delivery are not runtime-proven.
