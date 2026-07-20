export function dataListSublistScalarSummaryProductionRoutingPlan() {
  return `# Employee Leave Balances - Yeeflow App Plan

## 1. Plan Status

Business defaults approval status: user-default-approved-for-generation.

## 4. Data Lists and Document Libraries Plan

### 4.1 Employee Leave Balances
- Resource type: Data list

#### Fields
| Display Name | Storage Name | Exact Yeeflow Field Type | Control | Sublist Columns | Sublist Summaries | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Leave balance title | Title | Text | input | | | Native title field. |
| Leave details | Text7 | Text | list | Amount:Amount:decimal:input_number:amount-column:true; Hours:Hours:number:input_number:hours-column:true; Paid:Paid:boolean:switch:paid-column:true | Amount:total; Hours:average; Amount:minimum; Hours:maximum; Paid:count; Amount:total:__temp_:leaveTotalTemp | Static scalar summary corpus with one retained temporary-variable binding. |

## 10. Custom Data List Forms Plan

### 10.1 Employee Leave Balances
| Form Name | Form Type | Purpose |
| --- | --- | --- |
| Employee Leave Balance Form | New/Edit | Maintain leave details. |

#### Data List Form Layout Template Selection
| Data List or Library | Custom Form | Form Usage | Selected Data List Form Layout Template | Business Sections Needed | Related Data / Analytics Needed | Selection Reason | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Employee Leave Balances | Employee Leave Balance Form | New/Edit | data_list_form_layout_new_edit_v1_1 | Current fields | None | Standard Data List form. | Generated-final validation |

#### Form Fields Layout Template Selection
| Data List or Library | Custom Form | Field Group | Selected Form Fields Layout Template | PC/Laptop Columns | Tablet Columns | Mobile Columns | Full-Row Field Controls | Dynamic Display Grouping | Proof Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Employee Leave Balances | Employee Leave Balance Form | Fields | data_list_form_fields_grid_v1_1 | 2 | 2 | 1 | Leave details | None | Generated-final validation |

## 15. Application Navigation Plan
| Group | Item | Target Resource | Yeeflow Resource Type | Icon |
| --- | --- | --- | --- | --- |
| Operations | Employee Leave Balances | Employee Leave Balances | Data List | fa-solid fa-list |
`;
}
