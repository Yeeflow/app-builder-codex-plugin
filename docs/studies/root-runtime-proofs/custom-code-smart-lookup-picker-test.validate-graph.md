# Yeeflow .yap Graph Validation

- Input: `custom-code-smart-lookup-picker-test.v1.yap`
- Status: `pass`
- Mode: `generator`
- Stage: `final`

## Summary

| Metric | Count |
| --- | ---: |
| nodes | 27 |
| edges | 15 |
| lists | 1 |
| fields | 16 |
| approvalForms | 1 |
| listWorkflows | 0 |
| reports | 0 |
| dashboards | 1 |
| agents | 0 |
| connections | 0 |
| lookups | 2 |
| contentListEdges | 1 |
| queryDataEdges | 0 |
| unresolvedEdges | 0 |
| cycles | 0 |
| workflowActionConfig | [object Object] |
| replaceIds | 28 |

## Errors

None.

## Warnings

None.

## Dependencies

None.

## Graph Samples

- Nodes: 27
- Edges: 15

### First Nodes

| Type | Label | ID |
| --- | --- | --- |
| app | Custom Code Smart Lookup Picker Test | `app:6081000000000000000` |
| dashboard | Smart Lookup Dashboard | `dashboard:6081000000000000001` |
| dataList | Smart Lookup Test Records | `list:6081000000000000002` |
| field | Sample Record / Combined Output | `field:6081000000000000002:Title` |
| field | Description | `field:6081000000000000002:Text1` |
| field | Category | `field:6081000000000000002:Text2` |
| field | Picker Combined JSON | `field:6081000000000000002:Text3` |
| field | Active Request | `field:6081000000000000002:Bit1` |
| field | Quantity | `field:6081000000000000002:Decimal1` |
| field | Unit Price | `field:6081000000000000002:Decimal2` |
| field | Sub total | `field:6081000000000000002:Decimal3` |
| field | Confidence | `field:6081000000000000002:Decimal4` |
| field | Needed By | `field:6081000000000000002:Datetime1` |
| field | Service Window From | `field:6081000000000000002:Datetime2` |
| field | Service Window To | `field:6081000000000000002:Datetime3` |
| field | Related Record | `field:6081000000000000002:Text4` |
| field | Requester | `field:6081000000000000002:Text5` |
| field | Picker Selected Values | `field:6081000000000000002:Text6` |
| field | Picker Manual Values | `field:6081000000000000002:Text7` |
| customForm | Edit Item | `customForm:6081000000000000019` |
| customForm | View Item | `customForm:6081000000000000020` |
| appPage | Smart Lookup Dashboard | `page:6081000000000000001` |
| approvalForm | Smart Lookup Approval Test | `form:SLPTEST` |
| formPage | Submit Smart Lookup Test | `page:SLPTEST:fd666aff-5700-4d9c-81e4-3c65515ab1e8` |
| formPage | Review Smart Lookup Test | `page:SLPTEST:af79ff12-dac2-41a5-ace6-234d484620e0` |

### First Edges

| Type | From | To | Label |
| --- | --- | --- | --- |
| rootNavigation | `app:6081000000000000000` | `page:6081000000000000001` | Smart Lookup Dashboard |
| rootNavigation | `app:6081000000000000000` | `list:6081000000000000002` | Smart Lookup Test Records |
| rootNavigation | `app:6081000000000000000` | `form:SLPTEST` | Smart Lookup Approval Test |
| formPage | `form:SLPTEST` | `page:SLPTEST:fd666aff-5700-4d9c-81e4-3c65515ab1e8` | uses page |
| formPage | `form:SLPTEST` | `page:SLPTEST:af79ff12-dac2-41a5-ace6-234d484620e0` | uses page |
| taskPageReference | `form:SLPTEST` | `page:SLPTEST:fd666aff-5700-4d9c-81e4-3c65515ab1e8` | task page |
| taskPageReference | `form:SLPTEST` | `page:SLPTEST:af79ff12-dac2-41a5-ace6-234d484620e0` | task page |
| contentListTarget | `form:SLPTEST` | `list:6081000000000000002` | ContentList target |
| formControl | `form:SLPTEST` | `control:fd666aff-5700-4d9c-81e4-3c65515ab1e8:afc1-control-RelatedRecord-submit` | contains control |
| lookupControlSource | `control:fd666aff-5700-4d9c-81e4-3c65515ab1e8:afc1-control-RelatedRecord-submit` | `list:6081000000000000002` | lookup source list |
| lookupDisplayField | `control:fd666aff-5700-4d9c-81e4-3c65515ab1e8:afc1-control-RelatedRecord-submit` | `field:6081000000000000002:Title` | lookup display field |
| formControl | `form:SLPTEST` | `control:af79ff12-dac2-41a5-ace6-234d484620e0:afc1-control-RelatedRecord-review` | contains control |
| lookupControlSource | `control:af79ff12-dac2-41a5-ace6-234d484620e0:afc1-control-RelatedRecord-review` | `list:6081000000000000002` | lookup source list |
| lookupDisplayField | `control:af79ff12-dac2-41a5-ace6-234d484620e0:afc1-control-RelatedRecord-review` | `field:6081000000000000002:Title` | lookup display field |
| dashboardDataSource | `dashboard:6081000000000000001` | `list:6081000000000000002` | dashboard data source |
