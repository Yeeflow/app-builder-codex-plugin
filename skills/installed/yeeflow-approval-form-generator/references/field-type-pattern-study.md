# Approval Form and App-Level Field Type Pattern Study

Source export:

- `/Users/rengerhu/Downloads/Visitor Access Management v10.yap`

Baseline compared:

- `visitor-access-management-app-def.v10-add-visitor-contact.json`
- `visitor-access-management.v10-add-visitor-contact.yap`

Scope:

- Read-only decode and comparison.
- No import.
- No UI operation.
- No new generated `.yap`.

## 1. Summary

The manually updated Visitor Access Management v10 export confirms several field/control patterns that were not yet proven in generated app-level `.yap` packages.

Confirmed approval-form controls:

- number: `input_number`
- single-select radio: `radio`
- single-select dropdown: `radio` with `attrs.displayStyle = "dropdown"`
- boolean switch: `switch`
- dynamic display rule: target control `attrs.control_display[]`

Confirmed data-list fields:

- number: `FieldType = "Decimal"`, `Type = "input_number"`, slot `Decimal1`
- switch: `FieldType = "Bit"`, `Type = "switch"`, slot `Bit1`

Important limitation:

- The manually added approval controls were added only to the request page.
- They were not copied to the approval/task page.
- `Number of Visitors` and `Requires Escort` were added to the data list, but not mapped in workflow `ContentList`.
- `Access Type (Radio)`, `Access Type (Dropdown)`, and `Escort User` were approval-form-only variables/controls in this export.

## 2. Decode and Compare

The updated exported app decoded successfully.

Manual export app identity:

| Item | Value |
| --- | --- |
| Root ListSetID | `2053834045676859392` |
| Departments ListID | `2053834050673455104` |
| Visitor Access Requests ListID | `2053834050677649417` |
| Approval form key | `VBA` |
| Approval form `ListID` | `0` |
| Approval form `ProcModelID` | `2053834050681843700` |
| ReplaceIds count | `43` |

Compared to generated v10:

| Area | Change |
| --- | --- |
| Root app/navigation | Same app structure; IDs remapped by import/export. |
| Data list fields | Added `Decimal1` and `Bit1` to Visitor Access Requests. |
| Data list views | `All Requests` includes `Decimal1` and `Bit1`; other views were mostly unchanged. |
| Data list custom form | No new controls for `Decimal1` or `Bit1` were found in the custom list form. |
| Approval variables | Added 5 variables: number, two text choices, boolean, text. |
| Request page | Added 5 controls after the existing text-field block. |
| Approval page | New controls were not present. |
| Workflow graph | Same nodes and sequence flows. |
| ContentList | No mappings added for the new variables/fields. |

## 3. Number Field Pattern

### Data List Side

`Number of Visitors` was added to the Visitor Access Requests list:

```json
{
  "FieldName": "Decimal1",
  "InternalName": "Number_of_Visitors",
  "DisplayName": "Number of Visitors",
  "FieldType": "Decimal",
  "Type": "input_number",
  "DefaultValue": null,
  "Rules": {
    "displayThousandths": "1",
    "rounded-to": "0",
    "number_min": 0
  }
}
```

Sample data raw values in this export:

| Row | Raw `Decimal1` |
| --- | --- |
| `VAR-1001` | `""` |
| `VAR-1002` | `""` |
| `VAR-1003` | `""` |

The export did not include number sample values for the list field.

### Approval Form Side

Workflow variable:

```json
{
  "id": "NumberofVisitors",
  "name": "Number of Visitors",
  "type": "number",
  "editable": true
}
```

Request page control:

```json
{
  "type": "input_number",
  "label": "Number of Visitors",
  "binding": "NumberofVisitors",
  "attrs": {
    "placeholder": "Please identify the number of visitors",
    "displayThousandths": "1",
    "rounded-to": "0",
    "number_min": 0
  },
  "value": 1
}
```

Observed meaning:

- `attrs.displayThousandths = "1"` enables thousands display formatting.
- `attrs["rounded-to"] = "0"` stores whole-number formatting.
- `attrs.number_min = 0` stores minimum value.
- Default value is stored on the control as `value: 1`, not in the variable definition.

### Reusable Generation Pattern

Approval form number field:

```json
{
  "idx": "<uuid>",
  "id": "NumberofVisitors",
  "name": "Number of Visitors",
  "type": "number",
  "editable": true
}
```

```json
{
  "id": "<uuid>",
  "type": "input_number",
  "label": "Number of Visitors",
  "binding": "NumberofVisitors",
  "attrs": {
    "placeholder": "Please identify the number of visitors",
    "displayThousandths": "1",
    "rounded-to": "0",
    "number_min": 0
  },
  "value": 1
}
```

Data list number field:

```json
{
  "FieldName": "Decimal1",
  "FieldType": "Decimal",
  "Type": "input_number",
  "Rules": "{\"displayThousandths\":\"1\",\"rounded-to\":\"0\",\"number_min\":0}"
}
```

ContentList mapping, if persistence is required:

```json
{
  "Per": "0",
  "Columns": "Decimal1",
  "Data": "<input type=\"button\" data=\"${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;NumberofVisitors&quot;}}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Variables:Number of Visitors\">"
}
```

## 4. Single Select Radio Pattern

Workflow variable:

```json
{
  "id": "AccessType1",
  "name": "Access Type (Single Select with Radio Button)",
  "type": "text",
  "editable": true
}
```

Request page control:

```json
{
  "type": "radio",
  "label": "Access Type (Single Select with Radio Button)",
  "binding": "AccessType1",
  "attrs": {
    "choices": ["Choice1", "Choice2", "Choice3"],
    "show_color": false
  }
}
```

Observed meaning:

- Single select uses a text variable.
- Radio-button layout uses control `type = "radio"` without `attrs.displayStyle = "dropdown"`.
- Values are stored as the selected choice string.
- `attrs.choices[]` is a plain string array.

Reusable pattern:

```json
{
  "idx": "<uuid>",
  "id": "AccessType",
  "name": "Access Type",
  "type": "text",
  "editable": true
}
```

```json
{
  "id": "<uuid>",
  "type": "radio",
  "label": "Access Type",
  "binding": "AccessType",
  "attrs": {
    "choices": ["General Visit", "Interview", "Vendor Service"],
    "show_color": false
  }
}
```

## 5. Single Select Dropdown Pattern

Workflow variable:

```json
{
  "id": "AccessType2",
  "name": "Access Type (Single Select with Dropdown list)",
  "type": "text",
  "editable": true
}
```

Request page control:

```json
{
  "type": "radio",
  "label": "Access Type (Single Select with Dropdown list)",
  "binding": "AccessType2",
  "attrs": {
    "choices": ["Choice1", "Choice2", "Choice3"],
    "show_color": false,
    "displayStyle": "dropdown",
    "placeholder": "Please select access type",
    "color_choices": [
      { "value": "Choice1", "key": "<uuid>" },
      { "value": "Choice2", "key": "<uuid>" },
      { "value": "Choice3", "key": "<uuid>" }
    ]
  }
}
```

Observed meaning:

- Dropdown and radio share `type = "radio"` and text variable type.
- Dropdown is controlled by `attrs.displayStyle = "dropdown"`.
- `attrs.color_choices[]` appears in this export for dropdown choices and pairs each value with a UUID key.
- Values are still the selected choice string.

Reusable pattern:

```json
{
  "id": "<uuid>",
  "type": "radio",
  "label": "Access Type",
  "binding": "AccessType",
  "attrs": {
    "choices": ["General Visit", "Interview", "Vendor Service"],
    "show_color": false,
    "displayStyle": "dropdown",
    "placeholder": "Please select access type",
    "color_choices": [
      { "value": "General Visit", "key": "<uuid>" },
      { "value": "Interview", "key": "<uuid>" },
      { "value": "Vendor Service", "key": "<uuid>" }
    ]
  }
}
```

## 6. Radio vs Dropdown Comparison

| Topic | Radio layout | Dropdown layout |
| --- | --- | --- |
| Variable type | `text` | `text` |
| Control type | `radio` | `radio` |
| Choices | `attrs.choices[]` | `attrs.choices[]` |
| Layout switch | no `displayStyle` or non-dropdown | `attrs.displayStyle = "dropdown"` |
| Placeholder | optional | present in export |
| Color metadata | `show_color: false` | `show_color: false` plus `color_choices[]` |
| Raw value | selected string | selected string |

Generator recommendation:

- Use dropdown first for compact enterprise forms.
- Include both `choices[]` and matching `color_choices[]` when generating dropdowns.
- Use radio layout when the choices are very few and should be visible without opening a menu.

## 7. Switch / Boolean Pattern

### Data List Side

`Requires Escort` was added to the Visitor Access Requests list:

```json
{
  "FieldName": "Bit1",
  "InternalName": "Requires_Escort",
  "DisplayName": "Requires Escort",
  "FieldType": "Bit",
  "Type": "switch",
  "DefaultValue": null,
  "Rules": {}
}
```

Sample data raw values:

| Row | Raw `Bit1` |
| --- | --- |
| `VAR-1001` | `"0"` |
| `VAR-1002` | `"0"` |
| `VAR-1003` | `"0"` |

The list sample shape uses string `"0"` for false. Earlier generated/real list examples also showed `"1"` for true.

### Approval Form Side

Workflow variable:

```json
{
  "id": "RequiresEscort",
  "name": "Requires Escort",
  "type": "boolean",
  "editable": true
}
```

Request page control:

```json
{
  "type": "switch",
  "label": "Requires Escort",
  "binding": "RequiresEscort",
  "attrs": {
    "displayStyle": "default"
  },
  "readonly": false,
  "value": false
}
```

Observed meaning:

- Approval form variable type is `boolean`.
- Approval form switch raw default is boolean `false`.
- Data list `Bit` raw sample values use string `"0"`/`"1"`.

Reusable pattern:

```json
{
  "idx": "<uuid>",
  "id": "RequiresEscort",
  "name": "Requires Escort",
  "type": "boolean",
  "editable": true
}
```

```json
{
  "id": "<uuid>",
  "type": "switch",
  "label": "Requires Escort",
  "binding": "RequiresEscort",
  "attrs": {
    "displayStyle": "default"
  },
  "readonly": false,
  "value": false
}
```

ContentList mapping, if persistence is required:

```json
{
  "Per": "0",
  "Columns": "Bit1",
  "Data": "<input type=\"button\" data=\"${&quot;type&quot;:&quot;variable&quot;, &quot;param&quot;:{&quot;id&quot;:&quot;RequiresEscort&quot;}}\" expr=\"__\" tabindex=\"-1\" value=\"Workflow Variables:Requires Escort\">"
}
```

## 8. Dynamic Display Rule Pattern

`Escort User` is a normal text variable/control whose visibility is controlled by `attrs.control_display[]`.

Workflow variable:

```json
{
  "id": "EscortUser",
  "name": "Escort User",
  "type": "text",
  "editable": true
}
```

Target control:

```json
{
  "type": "input",
  "label": "Escort User",
  "binding": "EscortUser",
  "attrs": {
    "placeholder": "Please provide the name",
    "control_display": [
      {
        "id": "<uuid>",
        "controlId": "<target-control-id>",
        "formulas": [
          {
            "exprType": "variable",
            "valueType": "boolean",
            "id": "RequiresEscort",
            "type": "expr",
            "name": "Workflow Variables:Requires Escort"
          },
          {
            "type": "op",
            "op": "=="
          },
          {
            "type": "bool",
            "value": true
          }
        ],
        "actions": {
          "id": "<uuid>",
          "type": 1,
          "attrs": {
            "style_regulation_action": "style_regulation_action_show",
            "style_regulation_action_color": null,
            "action_style": null,
            "icon_type": null
          }
        }
      }
    ]
  }
}
```

Observed meaning:

- The rule lives on the target control, not globally on the page.
- `controlId` repeats the target control ID.
- The source variable formula uses `exprType = "variable"`, `valueType = "boolean"`, `id = "RequiresEscort"`.
- Boolean true is represented as `{ "type": "bool", "value": true }`.
- Show behavior uses `actions.type = 1` and `style_regulation_action_show`.

Reusable pattern:

```json
{
  "attrs": {
    "control_display": [
      {
        "id": "<rule-uuid>",
        "controlId": "<target-control-id>",
        "formulas": [
          { "exprType": "variable", "valueType": "boolean", "id": "RequiresEscort", "type": "expr", "name": "Workflow Variables:Requires Escort" },
          { "type": "op", "op": "==" },
          { "type": "bool", "value": true }
        ],
        "actions": {
          "id": "<action-uuid>",
          "type": 1,
          "attrs": {
            "style_regulation_action": "style_regulation_action_show",
            "style_regulation_action_color": null,
            "action_style": null,
            "icon_type": null
          }
        }
      }
    ]
  }
}
```

## 9. Approval Page Behavior

The new fields were not copied to the approval page in this manual export.

| Field/control | Request page | Approval page |
| --- | --- | --- |
| Number of Visitors | present, editable `input_number` | not present |
| Access Type (Radio) | present, editable `radio` | not present |
| Access Type (Dropdown) | present, editable `radio` dropdown | not present |
| Requires Escort | present, editable `switch` | not present |
| Escort User | present, conditional `input` | not present |

Generator recommendation:

- For generated approval workflows, mirror submitted business fields on the approval/task page as readonly unless there is a clear reason not to.
- For conditional fields, either:
  - copy the same display rule to the approval page, or
  - show the readonly field unconditionally if reviewers need full context.

## 10. ContentList Persistence

No new `ContentList` mappings were added in the manual export.

Existing mappings persisted only the previously generated v10 fields through `Text12`.

To persist the new data-list fields:

| Source variable | Target field |
| --- | --- |
| `NumberofVisitors` | `Decimal1` |
| `RequiresEscort` | `Bit1` |

If a future generated app needs to persist access type or escort user, corresponding data-list fields must be created first. This export did not create data-list fields for `AccessType1`, `AccessType2`, or `EscortUser`.

## 11. Validator Recommendations

### `validate-ywf-def.js`

Recommended checks:

- `input_number` controls must bind to a variable with `type = "number"`.
- Number controls should allow known attrs:
  - `displayThousandths`
  - `rounded-to`
  - `number_min`
  - `number_max` if present in future exports
- Number control default `value`, if present, must be numeric.
- `radio` controls must bind to `type = "text"` variables for single select.
- `radio.attrs.choices` must exist and be a non-empty string array.
- Dropdown radio controls should use `attrs.displayStyle = "dropdown"`.
- Dropdown `color_choices[]`, if present, should align with `choices[]`.
- `switch` controls must bind to `type = "boolean"` variables.
- `switch.value`, if present, must be boolean.
- `attrs.control_display[]` source variables must exist.
- Dynamic display formulas must use compatible value types.
- Dynamic display `controlId` must match the target control ID.

### `validate-yap-package.js`

Recommended checks:

- Data-list `Decimal` + `input_number` fields should have parseable numeric rules.
- Data-list `Bit` + `switch` fields should use `Bit1`, `Bit2`, etc. style slots and parseable rules.
- Approval-form number variables mapped to `ContentList` should target `Decimal` fields.
- Approval-form boolean variables mapped to `ContentList` should target `Bit` fields.
- Choice variables mapped to data-list fields should target text/radio-compatible fields with compatible choices.
- If a generated package adds request-page fields but not approval-page readonly mirrors, warn unless intentionally marked request-only.

### `validate-yap-graph.js`

Recommended checks:

- Add edges from form controls to workflow variables.
- Add edges from dynamic display target controls to source variables.
- Add edges from `ContentList` source variables to target fields.
- Report type compatibility on `ContentList` edges:
  - `number -> Decimal/input_number`
  - `boolean -> Bit/switch`
  - `text -> Text/input/radio`
- Warn when data-list fields exist for form variables but `ContentList` does not map them.

## 12. Generator Rules

Number field:

- Use approval variable `type = "number"`.
- Use approval control `type = "input_number"`.
- Store formatting/min settings in `attrs`.
- Store default value as control `value` when needed.
- Use data-list `FieldType = "Decimal"` and `Type = "input_number"`.
- Persist to a `Decimal*` target through `ContentList` when storage is required.

Single-select radio:

- Use approval variable `type = "text"`.
- Use control `type = "radio"`.
- Use `attrs.choices[]`.
- Omit `displayStyle = "dropdown"` for visible radio-button layout.

Single-select dropdown:

- Use approval variable `type = "text"`.
- Use control `type = "radio"`.
- Add `attrs.displayStyle = "dropdown"`.
- Include `attrs.choices[]`.
- Include `attrs.color_choices[]` with stable UUID keys when generating dropdowns.

Switch field:

- Use approval variable `type = "boolean"`.
- Use approval control `type = "switch"`.
- Use default boolean `value` on the control when needed.
- Use data-list `FieldType = "Bit"` and `Type = "switch"`.
- Use data-list sample values `"1"` and `"0"` for true/false.

Conditional display:

- Put the rule on the target control under `attrs.control_display[]`.
- Reference source variable by variable ID.
- Use boolean formulas for switch-driven display.
- Use show action `style_regulation_action_show`.

Approval page:

- Mirror request fields as readonly on approval pages in generated approval workflows.
- Decide explicitly whether dynamic display rules should be mirrored or whether reviewers should always see derived context.

ContentList:

- Create target data-list fields before mapping new approval variables.
- Validate field type compatibility before wrapper build.
- Do not assume request-page-only controls are persisted.

## 13. Current Readiness

Now confirmed from export:

- Approval number control shape.
- Approval radio single-select shape.
- Approval dropdown single-select shape.
- Approval switch shape.
- Dynamic show rule shape for switch equals true.
- Data-list Decimal/input_number shape.
- Data-list Bit/switch shape.

Still needs a generated import test:

- Full generated app package containing these field types.
- Approval page readonly mirrors for these field types.
- `ContentList` persistence of `number -> Decimal` and `boolean -> Bit`.
- Choice persistence to data-list target fields.

## 14. Generated v11 Confirmation

`visitor-access-management.v11-five-fields-multitype.yap` completed the generated import/runtime proof for the patterns studied in the manual v10 export.

Confirmed generated package settings:

- Fresh ID family: `216...`
- Fresh FlowKey/form key: `VBB`
- App-level approval form `Data.Forms[].ListID = 0`
- Package, graph, approval-form, and wrapper round-trip validations passed before import testing.
- App imported and passed runtime testing.
- Multi-field expansion worked.
- Multi-type controls worked.

### Proven Generated Field/Control Types

| Pattern | Generated approval form | Generated data list | Status |
| --- | --- | --- | --- |
| text/input | `type = "input"` with text variable | `Text13`, `Text14` | proven |
| number/input_number | number variable + `input_number` control | `Decimal1`, `FieldType = "Decimal"`, `Type = "input_number"` | proven |
| single select dropdown | text variable + `radio` control + `attrs.displayStyle = "dropdown"` | `Text15`, `FieldType = "Text"`, `Type = "radio"` | proven |
| switch/boolean | boolean variable + `switch` control | `Bit1`, `FieldType = "Bit"`, `Type = "switch"` | proven |
| conditional display | target control `attrs.control_display[]` | form-only behavior | proven |

### Proven Storage And ContentList Mappings

| Source variable | Target storage field |
| --- | --- |
| `VisitorEmail` | `Text13` |
| `VisitorPhone` | `Text14` |
| `NumberofVisitors` | `Decimal1` |
| `AccessType` | `Text15` |
| `RequiresEscort` | `Bit1` |

### Proven Sample Value Shapes

| Field type | Generated sample shape |
| --- | --- |
| Decimal | numeric values such as `1`, `2`, `4` |
| Choice/dropdown | selected option text |
| Bit/switch in data-list samples | string `"1"` / `"0"` |
| Boolean approval control value | boolean `true` / `false` |

### Conditional Display Confirmation

`Escort User` was generated as a form-only conditional field:

- source switch variable: `RequiresEscort`
- target text variable/control: `EscortUser`
- condition: `RequiresEscort == true`
- storage location: `Escort User` control `attrs.control_display[]`
- persistence: not mapped in v11

This confirms the rule shape but leaves persisted conditional fields for a future test.

### Updated Readiness

The following are now proven for generated app-level `.yap` packages:

- `number -> Decimal/input_number` persistence.
- `boolean -> Bit/switch` persistence.
- `text/radio dropdown -> Text/radio` persistence.
- Approval-page readonly mirrors for the generated fields.
- Conditional display using `attrs.control_display[]`.

Still needs future examples:

- Persisting the conditional `EscortUser` target field.
- Multi-select choice.
- User picker.
- Lookup inside a line-item table.
- Dashboards and reports.
