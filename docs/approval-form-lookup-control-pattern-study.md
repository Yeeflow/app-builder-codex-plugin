# Approval Form Lookup Control Pattern Study

Study source:

- Updated export: `/Users/rengerhu/Downloads/Simple PR Line Item Approval (2).ywf`
- Previous generated baseline: `simple-pr-line-item-approval-def.v4-alpha-labels.json`
- Lookup target list: `/Users/rengerhu/Downloads/Departments.ydl`

No import, Yeeflow UI operation, or package generation was performed.

## 1. Decode And Compare

The updated `.ywf` decoded successfully. The exported wrapper uses:

- `FlowName`: `Simple PR Line Item Approval`
- `FlowKey`: `SPLIA2`
- decoded `defkey`: `SPLIA2`
- `WorkflowType`: `2`

The `SPLIA2` key appears to be Yeeflow's import/export remapped workflow key. The comparison below focuses on structural changes, not the remapped key.

Compared with `simple-pr-line-item-approval-def.v4-alpha-labels.json`, the lookup edit added:

### Added `variables.basic`

```json
{
  "idx": "716b095d-7629-4f7c-96ac-1dbdc41664dd",
  "id": "field_9",
  "name": "lookup9",
  "type": "lookup",
  "editable": true,
  "value": {
    "AppID": 41,
    "ListID": "2053735610866089985",
    "ListSetID": "2041029207826120704"
  }
}
```

```json
{
  "idx": "f70a22b7-a130-4bf0-ad67-d20402cca787",
  "id": "DepartmentCode",
  "name": "Department Code",
  "type": "text",
  "editable": true
}
```

### Added Request Page Controls

Two controls were added to the request/submission page, inside the existing structured field grid:

1. `lookup` bound to `field_9`
2. readonly `input` bound to `DepartmentCode`

No approval page lookup/Department Code controls were found in the updated export.

### Workflow And Persistence

Workflow node count stayed the same: `16`.

`ContentList` node properties are unchanged compared with the previous generated Def. The selected Department and derived Department Code are not persisted by the existing PR parent/detail `ContentList` mappings.

## 2. Lookup Variable Pattern

The lookup workflow variable is a `variables.basic` entry:

| Property | Value |
| --- | --- |
| `id` | `field_9` |
| `name` | `lookup9` |
| `type` | `lookup` |
| `editable` | `true` |
| `value.AppID` | `41` |
| `value.ListSetID` | `2041029207826120704` |
| `value.ListID` | `2053735610866089985` |

The default variable value stores the lookup source list identity, not a selected row value.

The selected runtime value shape is not present in the exported Def. Based on related `.ydl` sample-data evidence, a single lookup value is likely a target row `ListDataID` string when persisted, but this approval-form export does not directly confirm the submitted runtime value shape.

No companion display/cache variable was found.

## 3. Department Code Variable Pattern

`DepartmentCode` is a normal text workflow variable:

```json
{
  "idx": "f70a22b7-a130-4bf0-ad67-d20402cca787",
  "id": "DepartmentCode",
  "name": "Department Code",
  "type": "text",
  "editable": true
}
```

The visible control is an `input`:

```json
{
  "id": "a5980f17-2969-4966-9c53-f5ca1d6faaee",
  "type": "input",
  "label": "Department Code",
  "attrs": {},
  "binding": "DepartmentCode",
  "readonly": true
}
```

The additional field mapping writes the selected Department row's `Text1` field into the workflow variable `DepartmentCode`.

The target variable is not persisted by the current workflow. If generated forms need Department Code stored in an app list, add an explicit `ContentList` mapping.

## 4. Lookup Control Structure

Full lookup control JSON:

```json
{
  "id": "1fe9f552-21da-4a0c-a68b-fde8b2bc369b",
  "type": "lookup",
  "label": "Lookup",
  "attrs": {
    "appid": 41,
    "listsetid": "2041029207826120704",
    "listfield": "Title",
    "listfilter": null,
    "addition": [
      {
        "FieldName": "Text1",
        "FieldID": "2053735610866089989",
        "IsShow": false,
        "RelationName": "DepartmentCode",
        "Value": null,
        "Order": null,
        "RelationFieldIsMultiple": false
      }
    ],
    "list_tooltip_field": null,
    "sort-first": {
      "SortName": "Title",
      "SortByDesc": false
    },
    "listid": "2053735610866089985",
    "placeholder": "Please select department"
  },
  "binding": "field_9"
}
```

Confirmed fields:

| Setting | Location | Value |
| --- | --- | --- |
| control type | `type` | `lookup` |
| variable binding | `binding` | `field_9` |
| source app | `attrs.appid` | `41` |
| source listset | `attrs.listsetid` | `2041029207826120704` |
| source list | `attrs.listid` | `2053735610866089985` |
| display field | `attrs.listfield` | `Title` |
| filter | `attrs.listfilter` | `null` |
| tooltip field | `attrs.list_tooltip_field` | `null` |
| placeholder | `attrs.placeholder` | `Please select department` |
| sort field | `attrs["sort-first"].SortName` | `Title` |
| sort descending | `attrs["sort-first"].SortByDesc` | `false` |
| additional fields | `attrs.addition[]` | array of source-to-variable mappings |

No explicit `multiple: false` field was found on the control. In this export, single-select appears to be represented by absence of a multiple flag and by `RelationFieldIsMultiple: false` in the additional field mapping.

## 5. Data Source Types

This export confirms the data-list lookup pattern:

- `attrs.appid`
- `attrs.listsetid`
- `attrs.listid`
- `attrs.listfield`

No confirmed evidence was found in this export for:

- data report lookup source
- form report lookup source
- document library lookup source

Those source types require separate exports before generation.

## 6. Single-Select Vs Multi-Select

Confirmed single-select pattern:

- no `multiple: true` in lookup control attrs
- lookup variable `type: "lookup"`
- lookup variable `value` points to source app/list/listset
- additional field mapping uses `RelationFieldIsMultiple: false`

Likely but not confirmed for multi-select:

- a `multiple: true` or equivalent attrs setting may appear
- selected value shape may become array or JSON-stringified array
- additional field behavior may differ if multiple rows are selected

Do not generate multi-select approval lookups until a real multi-select approval-form export is studied.

## 7. Additional Field Mapping

Additional field mappings are stored inside the lookup control at `attrs.addition[]`.

Confirmed object shape:

```json
{
  "FieldName": "Text1",
  "FieldID": "2053735610866089989",
  "IsShow": false,
  "RelationName": "DepartmentCode",
  "Value": null,
  "Order": null,
  "RelationFieldIsMultiple": false
}
```

Meaning:

| Property | Meaning |
| --- | --- |
| `FieldName` | source data-list field storage name |
| `FieldID` | source data-list field ID |
| `IsShow` | whether the additional field is shown in lookup UI; false for auto-fill-only mapping |
| `RelationName` | target approval-form variable ID |
| `Value` | default/current value placeholder, null in export |
| `Order` | display/order metadata, null in export |
| `RelationFieldIsMultiple` | target/source multiple behavior flag, false here |

The mapping appears to fire when the lookup selection changes. The target control does not have special action metadata; the relationship is entirely in lookup attrs.

Recommended generator rule:

- target variable must exist in `variables.basic`
- target control should exist and normally be readonly
- target variable type should be compatible with the source field type
- source field must resolve by `FieldName` and `FieldID`

Multiple additional fields are likely supported because `addition` is an array, but this export confirms only one mapping.

## 8. Sort And Display Field Pattern

Display and sort use the source list storage `FieldName`, not display label or internal name:

- Display field: `attrs.listfield = "Title"`
- Sort field: `attrs["sort-first"].SortName = "Title"`
- Sort direction: `attrs["sort-first"].SortByDesc = false`

Additional mapped source fields use:

- `FieldName = "Text1"`
- `FieldID = "2053735610866089989"`

For Departments:

| Display label | InternalName | FieldName | FieldID |
| --- | --- | --- | --- |
| Department Name | DepartmentName | Title | 2053735610866089988 |
| Department Code | DepartmentCode | Text1 | 2053735610866089989 |

## 9. Layout Implications

The lookup and Department Code controls were placed on the request page:

```text
Request form
└─ splia-request-layout-container
   └─ splia-request-fields-container
      └─ splia-request-fields-grid
         ├─ existing business fields
         ├─ lookup: field_9
         └─ readonly input: DepartmentCode
```

The Department Code readonly field is placed immediately after the lookup field. This is the right generated-form pattern because the derived value is visible next to its source.

The approval page was not updated in this export. For future generated forms, if the lookup selection is part of the business request, the approval page should usually include readonly versions of both:

- selected lookup field
- derived additional fields such as Department Code

## 10. ContentList / Persistence Implication

No persistence mapping was added for the lookup or Department Code.

Generator rule:

- Ask whether the selected lookup and derived fields should be persisted.
- If yes, add explicit `ContentList` mappings.
- Persist lookup selections only after confirming target field type and runtime value shape.
- Persist derived text fields like Department Code as normal text when the target list field is text-compatible.

## 11. Validator Recommendations

### `validate-ywf-def.js`

Add lookup-control checks:

- lookup control binding exists in `variables.basic`
- lookup variable type is `lookup`
- lookup attrs include source app/listset/list IDs
- lookup attrs include `listfield`
- sort field exists when configured
- `addition[].RelationName` target variable exists
- derived target control exists when target variable is visible
- derived target control should be readonly, warn if not
- `addition[].FieldName` and `FieldID` are present
- single/multiple setting is explicit or follows known single-select pattern
- lookup dependencies are reported in draft/final output

### `validate-ywf-def-against-yap.js`

Add app-context checks:

- source list resolves in metadata
- display field resolves by FieldName
- sort field resolves by FieldName
- additional source field resolves by FieldName and FieldID
- target variable type is compatible with source field normalized type
- if lookup is persisted by `ContentList`, target field is lookup/text-compatible and value shape is understood

## 12. Generator Rules

Use approval-form lookup controls when:

- user should select an existing record from a data source
- the selected record is shared/reference data
- related fields should auto-fill from the selected record
- search/sort/filter usability matters

Use additional fields when:

- the selected lookup record has stable related data
- the related value should be visible or persisted in the approval form
- the target variable can be readonly to avoid user edits

Avoid lookup controls when:

- the values are a small static option set; use choice/radio/dropdown instead
- source list IDs or fields are unknown
- a multi-select pattern is required but not yet confirmed
- the lookup source is a data report, form report, or document library not yet studied

## 13. Reusable Snippets

### Single-Select Data-List Lookup Control

```json
{
  "id": "<uuid>",
  "type": "lookup",
  "label": "Department",
  "attrs": {
    "appid": 41,
    "listsetid": "<source ListSetID>",
    "listfield": "Title",
    "listfilter": null,
    "addition": [],
    "list_tooltip_field": null,
    "sort-first": {
      "SortName": "Title",
      "SortByDesc": false
    },
    "listid": "<source ListID>",
    "placeholder": "Please select department"
  },
  "binding": "Department"
}
```

### Readonly Additional Field Target

```json
{
  "id": "<uuid>",
  "type": "input",
  "label": "Department Code",
  "attrs": {},
  "binding": "DepartmentCode",
  "readonly": true
}
```

### Additional Field Mapping

```json
{
  "FieldName": "Text1",
  "FieldID": "<source FieldID>",
  "IsShow": false,
  "RelationName": "DepartmentCode",
  "Value": null,
  "Order": null,
  "RelationFieldIsMultiple": false
}
```

### Lookup Dependency Entry

```json
{
  "dependencyKey": "REQUEST_DEPARTMENT_LOOKUP_SOURCE",
  "dependencyType": "approvalLookupSourceList",
  "sourceVariable": "Department",
  "sourceList": "Departments",
  "targetAppId": "41",
  "targetListSetId": "2041029207826120704",
  "targetListId": "2053735610866089985",
  "displayField": "Title",
  "sortField": "Title",
  "additionalFields": [
    {
      "sourceFieldName": "Text1",
      "sourceFieldId": "2053735610866089989",
      "targetVariable": "DepartmentCode"
    }
  ],
  "status": "resolved"
}
```

### Validator Checklist

```json
{
  "lookupControlBindingExists": true,
  "lookupVariableTypeIsLookup": true,
  "sourceListResolved": true,
  "displayFieldResolved": true,
  "sortFieldResolved": true,
  "additionalSourceFieldsResolved": true,
  "additionalTargetVariablesExist": true,
  "derivedTargetControlsReadonly": true,
  "persistenceExplicitlyDecided": true
}
```

## 14. Future Study Gaps

Additional export examples needed:

- multi-select lookup on an approval form
- lookup to data report
- lookup to form report
- lookup to document library
- lookup with filters
- lookup with multiple additional fields
- lookup inside a line-item table
- lookup persisted to `ContentList` target list
- approval page readonly rendering of lookup fields

## 15. Readiness Decision

This pattern is ready to become a generator option for single-select data-list lookup controls with additional field auto-fill, provided the generator has confirmed source list and field metadata.

It is not yet enough to generate:

- multi-select lookups
- report/library lookups
- filtered lookups beyond `listfilter: null`
- persisted lookup mappings without additional runtime value-shape confirmation
