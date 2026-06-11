# Expression Runtime Test v1 Patch User Expression Study

Source export: `/Users/Renger/Downloads/Expression Runtime Test v1 Patch.yap` (read-only).

## Summary

- Approval form: Expression Runtime Test v1 / key 2055089150268157967.
- User/profile expression controls found: 68.
- Export-backed functions found: `dateFormat`, `getLocAttr`, `getOrgAttr`, `getUserAttr`.
- Real department/organization function name in the export is `getOrgAttr`; no `getDeptAttr` token was found in this export. Treat `getDeptAttr` as unproven unless a later export shows it.
- User/profile expressions are stored on display controls as `attrs.headc.title.variable` token arrays; one profile picture expression is stored at `attrs.picture.pic.variable`.

## Token Shape

- Current user token uses `{ id: "CurrentUser", exprType: "application", valueType: "string", type: "expr", name: "Context:Current User" }`.
- Workflow user variable token can use `{ exprType: "variable", valueType: "user", id: "Requester", type: "expr", name: "Workflow Variables:Requester" }`.
- Attribute parameters are descriptor objects such as `{ "key": "Email", "label": "Email" }`, not string literals.
- Default/fallback parameter is usually a token-array parameter such as `[{ "type": "str", "value": "N/A" }]`; some manually added controls use an empty array for blank fallback.

## Observed Attributes

### getUserAttr

- `Created` (Created Time)
- `CreatedBy` (Created By)
- `DepartmentID` (Department)
- `Email` (Email)
- `EmployeeNo` (Employee No.)
- `IsAdmin` (Admin)
- `JobGrade` (Job Grade)
- `JobTitle` (Job Title)
- `LastLoginTime` (Last Login Time)
- `LatestHireDate` (Boarding Date)
- `LineManager` (Line Manager)
- `LocationID` (Location)
- `Mobile` (Mobile No.)
- `Name_CN` (Name)
- `OfficeAddress` (Office Address)
- `Phone` (Phone No.)
- `Photo` (Profile Picture)
- `Remark` (Remarks)
- `SPAccount` (Login Account)
- `ServiceStartDate` (Time to Start Work)
- `Telephone` (Telephone)

### getOrgAttr

- `Manager` (Manager)
- `Name` (Name)
- `ParentID` (Parent)

### getLocAttr

- `Manager` (Manager)
- `Name` (Name)

## Generation Guidance

- Use `getUserAttr(userOrContext, attrDescriptor, defaultTokens)` for user fields.
- Use `getOrgAttr(orgValue, attrDescriptor, defaultTokens)` for department/organization fields.
- Use `getLocAttr(locationValue, attrDescriptor, defaultTokens)` for location fields.
- For display-only profile values, the export-backed pattern is native Text/heading with `attrs.headc.title.variable`.
- For generated runtime tests that need persistence, calculated controls bound to variables are the next safe isolation path and must be runtime-tested before claiming profile expression persistence as proven.
- Text controls must keep the learned Text standard: `attrs.heads.color` is a string, `attrs.heads.ty` uses token-pair shape, and inline width uses `attrs.common.positioning.widthtype = [null, "2"]`.
