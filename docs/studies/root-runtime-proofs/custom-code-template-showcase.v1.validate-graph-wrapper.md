# Yeeflow .yap Graph Validation

- Input: `custom-code-template-showcase.v1.yap`
- Status: `pass`
- Mode: `generator`
- Stage: `final`

## Summary

| Metric | Count |
| --- | ---: |
| nodes | 177 |
| edges | 22 |
| lists | 9 |
| fields | 144 |
| approvalForms | 1 |
| listWorkflows | 0 |
| reports | 0 |
| dashboards | 1 |
| agents | 0 |
| connections | 0 |
| lookups | 0 |
| contentListEdges | 1 |
| queryDataEdges | 0 |
| unresolvedEdges | 0 |
| cycles | 0 |
| workflowActionConfig | [object Object] |
| replaceIds | 69 |

## Errors

None.

## Warnings

None.

## Dependencies

None.

## Graph Samples

- Nodes: 177
- Edges: 22

### First Nodes

| Type | Label | ID |
| --- | --- | --- |
| app | Enterprise Service Request & Compliance Review | `app:6182000000000000000` |
| dashboard | Service Request & Compliance Dashboard | `dashboard:6182000000000000001` |
| dataList | Service Requests | `list:6182000000000000100` |
| field | Request Title | `field:6182000000000000100:Title` |
| field | Category | `field:6182000000000000100:Text1` |
| field | Service Area | `field:6182000000000000100:Text2` |
| field | Status | `field:6182000000000000100:Text3` |
| field | Active Request | `field:6182000000000000100:Bit1` |
| field | Quantity | `field:6182000000000000100:Decimal1` |
| field | Unit Price | `field:6182000000000000100:Decimal2` |
| field | Sub total | `field:6182000000000000100:Decimal3` |
| field | Confidence | `field:6182000000000000100:Decimal4` |
| field | Submitted Date | `field:6182000000000000100:Datetime1` |
| field | Service Window From | `field:6182000000000000100:Datetime2` |
| field | Service Window To | `field:6182000000000000100:Datetime3` |
| field | Priority | `field:6182000000000000100:Text4` |
| field | Requester | `field:6182000000000000100:Text5` |
| field | Picker Selected Values | `field:6182000000000000100:Text6` |
| field | Picker Manual Values | `field:6182000000000000100:Text7` |
| customForm | Edit Item | `customForm:6182000000000000102` |
| customForm | View Item | `customForm:6182000000000000103` |
| dataList | Request Categories | `list:6182000000000000200` |
| field | Category Name | `field:6182000000000000200:Title` |
| field | Parent ID | `field:6182000000000000200:Text1` |
| field | Category Value | `field:6182000000000000200:Text2` |

### First Edges

| Type | From | To | Label |
| --- | --- | --- | --- |
| rootNavigation | `app:6182000000000000000` | `page:6182000000000000001` | Service Request & Compliance Dashboard |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000100` | Service Requests |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000200` | Request Categories |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000300` | Subcategories |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000400` | Assets / Vendors / Related Records |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000500` | Compliance Checklist Items |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000600` | Request Tags |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000700` | Approval History / Timeline Events |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000800` | Exception Rules / Alerts |
| rootNavigation | `app:6182000000000000000` | `list:6182000000000000900` | Request Metrics / Summary Records |
| rootNavigation | `app:6182000000000000000` | `form:CCTSHOW` | Enterprise Service Request Review |
| formPage | `form:CCTSHOW` | `page:CCTSHOW:fd666aff-5700-4d9c-81e4-3c65515ab1e8` | uses page |
| formPage | `form:CCTSHOW` | `page:CCTSHOW:af79ff12-dac2-41a5-ace6-234d484620e0` | uses page |
| taskPageReference | `form:CCTSHOW` | `page:CCTSHOW:fd666aff-5700-4d9c-81e4-3c65515ab1e8` | task page |
| taskPageReference | `form:CCTSHOW` | `page:CCTSHOW:af79ff12-dac2-41a5-ace6-234d484620e0` | task page |
| contentListTarget | `form:CCTSHOW` | `list:6182000000000000100` | ContentList target |
| dashboardDataSource | `dashboard:6182000000000000001` | `list:6182000000000000100` | dashboard data source |
| dashboardDataSource | `dashboard:6182000000000000001` | `list:6182000000000000000` | dashboard data source |
| dashboardDataSource | `dashboard:6182000000000000001` | `list:6182000000000000800` | dashboard data source |
| dashboardDataSource | `dashboard:6182000000000000001` | `list:6182000000000000700` | dashboard data source |
| dashboardDataSource | `dashboard:6182000000000000001` | `list:6182000000000000400` | dashboard data source |
| dashboardControlSource | `dashboard:6182000000000000001` | `list:6182000000000000100` | dashboard control data.list |
