export function dataListSublistEmbeddedLookupRoutingPlan({ target = true, addition = false, malformedAddition = false } = {}) {
  const targetConfiguration = target
    ? `:AppID=41,ListID=2076284286981328907,ListSetID=2076284286981328898${addition ? `\\|FieldName=Decimal5,FieldID=2076284286981328912,RelationName=${malformedAddition ? "MissingDestination" : "LeaveUsageHours"},Order=2,IsShow=true` : ""}`
    : "";
  return `# Lookup Routing - Yeeflow App Plan

## 1. Plan Status

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Leave Usage
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control |
| --- | --- | --- | --- |
| Title | Title | Text | input |

### 4.2 Employee Leave Balances
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Sublist Columns |
| --- | --- | --- | --- | --- |
| Title | Title | Text | input | |
| Leave details | Text7 | Text | list | LeaveUsage:Leave Usage:lookup:lookup:2a11e1e9-5cd2-46c5-8599-aaa17672aa72:true${targetConfiguration}${addition ? ";LeaveUsageHours:Leave Usage Hours:number:input_number:3743eb1d-b47f-4963-94cd-6c7b37cda86f:true" : ""} |

## 10. Custom Data List Forms Plan

### 10.1 Employee Leave Balances
| Form Name | Form Type | Purpose |
| --- | --- | --- |
| Employee Leave Balance Form | New/Edit | Maintain leave details. |

#### Data List Form Layout Template Selection
| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Employee Leave Balances | Employee Leave Balance Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current fields | None | Standard Data List form. | Generated-final validation |
`;
}
