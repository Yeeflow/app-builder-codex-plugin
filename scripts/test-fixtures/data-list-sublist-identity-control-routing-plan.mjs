export function dataListSublistIdentityControlRoutingPlan({ user = true, file = false, malformed = false } = {}) {
  const columns = [
    "Leave type:LeaveType:text:input:a43378ba-2659-4019-8f9d-55df79fbf94a:true",
    user ? `Approver:Approver:user:identity-picker:${malformed ? "" : "54ad34d8-5fb6-450b-be31-21e7034fb74d"}:true` : "",
    file ? "Attachment:Attachment:file:file-upload:0978b245-a3f9-43ee-bf73-947a8de02714:true" : "",
  ].filter(Boolean).join(";");
  return `# Embedded Identity Control Routing - Yeeflow App Plan

## 1. Plan Status

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Employee Leave Balances
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Sublist Columns |
| --- | --- | --- | --- | --- |
| Title | Title | Text | input | |
| Leave details | Text7 | Text | list | ${columns} |

## 10. Custom Data List Forms Plan

### 10.1 Employee Leave Balances
| Form Name | Form Type | Purpose |
| --- | --- | --- |
| Create Balance | New/Edit | Maintain leave details. |

#### Data List Form Layout Template Selection
| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Employee Leave Balances | Create Balance | New/Edit | data_list_form_layout_new_edit_v1_1 | Current fields | None | Standard Data List form. | Generated-final validation |
`;
}
