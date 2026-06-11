# AI Training Approval Form Control Study

Source studied: `<downloads>/AI Training.yap`

Study scope: approval form only. The original export was decoded read-only; no app generation, import, or UI operation was performed.

Derived inspection artifacts were written locally and are ignored by Git because they may contain export payload detail:

- `ai-training-decoded-resource.json`
- `ai-training-decoded-data.json`
- `ai-training-approval-form-def.json`
- `ai-training-approval-form-control-inspection.json`
- `ai-training-approval-form-control-inspection.md`

The reusable inspector is tracked as `scripts/inspect-yap-approval-controls.mjs`.

## Export Summary

- Wrapper title: `AI Training`
- Root app/listset ID: preserved as string
- Approval form found: `Approval Form`
- Form key: `AI_Training_Approval`
- `Data.Forms[].ListID`: `0`
- Pages: one submission page, title `Approval Form`
- Variables: 38 `variables.basic` entries plus 3 `variables.listref` entries
- Controls inspected: 77 top-level/nested controls in the page tree
- Large numeric IDs preserved as strings during decode: 2

The export contains one child data list named `Customer Leads`. The list was inspected only to understand lookup/data-list control references.

## Control Inventory

| Control type | Count | Variable type(s) observed | Notes |
| --- | ---: | --- | --- |
| `input` | 2 | `text` | Standard text entry; one nested list-field instance. |
| `textarea` | 1 | `text` | Uses `attrs.edit.fhlay = "auto"` and `attrs.edit.textarea_minrows = 2`. |
| `richtext` | 1 | `text` | Uses `attrs.edit.fh = [null, 150]`; runtime-sensitive for generation. |
| `radio` | 2 | `text` | Radio button and dropdown are same control with different `attrs.displayStyle`. |
| `checkbox` | 2 | `text` | Multi-choice checkbox/dropdown with `attrs.choices` and `attrs.color_choices`; runtime-sensitive until generated proof. |
| `switch` | 3 | `boolean`, nested list `text` | Normal switches bind boolean variables. `attrs.displayStyle = "decision"` produces tick-style switch. |
| `input_number` | 1 | `number` | Uses `attrs.displayThousandths = "1"`. |
| `percent` | 1 | `number` | Uses number variable; no extra attrs in this sample. |
| `currency` | 1 | `number` | Uses `attrs.currencyCode`, `attrs.displayFormat`, and `attrs.displayThousandths`. |
| `datepicker` | 3 | `date`, nested list `text` | Date-only uses `attrs.date_type = "0"`; date-time adds `attrs.showtime = true`. |
| `time` | 1 | `date` | Uses date variable with time value shape. |
| `daterange` | 2 | `date` | Main binding is the From variable; To variable is in `attrs["binding-date-range"]`. |
| `file-upload` | 1 | `file` | Uses `attrs.ver = 1`, `attrs.file_multiple = true`, `attrs.file_maxcount = 10`. |
| `icon-upload` | 2 | `img`, nested list `number` | Top-level image uses `attrs.controlmultiple = true`, `attrs.maxselection = 10`. |
| `identity-picker` | 3 | `user`, nested list `number` | Multiple user picker uses `attrs.multiple = true`, `attrs["identity-maxselection"] = 20`. |
| `organization-picker` | 2 | `groupselect` | Department picker uses `attrs["metadata-treeselect"] = true`; multiple adds `attrs.multiple = true`. |
| `location-picker` | 1 | `location` | Minimal attrs; environment-dependent. |
| `cost-center-picker` | 2 | `costcenter` | Single/multiple controlled by `attrs.multiple`. |
| `metadata` | 2 | `metadata` | Uses `attrs.source`, `attrs.categoryId`, and `attrs["metadata-treeselect"] = true`. |
| `mutiple-metadata` | 1 | `mutiple-metadata` | Same category/source pattern as metadata, multiple-specific control type. |
| `lookup` | 3 | `lookup` | Current-app dropdown, current-app button, and external dropdown patterns. |
| `lookup-list` | 1 | `lookup` | Multi-select lookup-list with `attrs.addition[]`; treat as runtime-sensitive. |
| `list` | 3 | `list` | Traditional, lookup-derived, and dynamic sublist patterns. |
| `data-list` | 1 | display only | Displays `Customer Leads` fields with caption/search/add settings. |
| `heading` | 5 | display only | Section text labels inside dynamic sublist area. |
| `aktabs` / `ak-tabs-tab` | 1 / 4 | layout | Four tabs group basic, system, data, and sublist examples. |
| `flex_grid` | 10 | layout | Used heavily for grouping controls. |
| `workflowControlPanel` / `workflowHistory` | 1 / 1 | workflow UI | Present on the submission page. |

## Variable Binding Model

Observed primary model:

```text
control.binding -> variables.basic[].id
```

Examples:

| Control | Variable type | Key attrs |
| --- | --- | --- |
| `input` | `text` | no required attrs for the simple single-line case |
| `textarea` | `text` | `attrs.edit.fhlay`, `attrs.edit.textarea_minrows` |
| `richtext` | `text` | `attrs.edit.fh` |
| `radio` | `text` | `attrs.choices`, `attrs.show_color`; dropdown adds `attrs.displayStyle = "dropdown"` |
| `checkbox` | `text` | `attrs.choices`, `attrs.color_choices`, `attrs.displayStyle` |
| `switch` | `boolean` | optional `attrs.comment-allow = false`; tick style uses `attrs.displayStyle = "decision"` |
| `input_number` | `number` | `attrs.displayThousandths = "1"` |
| `percent` | `number` | no extra attrs observed |
| `currency` | `number` | `attrs.currencyCode`, `attrs.displayFormat`, `attrs.displayThousandths` |
| `datepicker` | `date` | `attrs.date_type = "0"`; date-time adds `attrs.showtime = true` |
| `time` | `date` | `attrs.required = false` in this sample |
| `daterange` | `date` | `binding` is From; To is `attrs["binding-date-range"]` |
| `file-upload` | `file` | `attrs.ver`, `attrs.file_multiple`, `attrs.file_maxcount`, `attrs.upload_btn` |
| `icon-upload` | `img` | `attrs.controlmultiple`, `attrs.maxselection` |
| `identity-picker` | `user` | multiple uses `attrs.multiple`, `attrs["identity-maxselection"]` |
| `organization-picker` | `groupselect` | `attrs["metadata-treeselect"]`, optional `attrs.multiple` |
| `location-picker` | `location` | minimal attrs; requires environment proof |
| `metadata` | `metadata` | `attrs.source`, `attrs.categoryId`, `attrs["metadata-treeselect"]` |
| `cost-center-picker` | `costcenter` | `attrs.multiple` |
| `lookup` | `lookup` | `attrs.appid`, `attrs.listsetid`, `attrs.listid`, `attrs.listfield`, filters/search/display attrs |
| `list` | `list` | `variables.basic[].value` references `variables.listref[].id` |

## Layout Patterns

The form uses `aktabs` with four `ak-tabs-tab` children:

- `Tab 1 - Basic Fields`
- `Tab 2 - System Related`
- `Tab 3 - Data Related`
- `Tab 4 - Sublists`

Inside tabs, `flex_grid` controls group related controls. A common exported grid shape uses:

```json
{
  "attrs": {
    "ver": 1,
    "columns": {
      "1": { "list": [{ "value": 1, "unit": "fr" }], "last": { "value": 1, "unit": "fr" } },
      "2": { "list": [{ "value": 1, "unit": "fr" }, { "value": 1, "unit": "fr" }], "last": { "value": 1, "unit": "fr" } },
      "3": { "list": [{ "value": 1, "unit": "fr" }], "last": { "value": 1, "unit": "fr" } }
    },
    "rows": {
      "1": { "list": [{ "unit": "auto" }], "last": { "unit": "auto" } }
    },
    "cgap": { "1": 10 },
    "cgapU": { "1": "px" }
  }
}
```

This confirms that real exports can store `flex_grid.attrs.columns` and `attrs.rows` as responsive keyed objects. Current validators may warn because the normalized schema reference expects arrays. Do not convert this into a generator hard error.

Generation rule: for generated form field grids, continue using the design-system default two-column field sections with hidden grid captions. Treat this sample as evidence for control grouping, not as a replacement for the current UI quality standard.

## Lookup Patterns

Current-app lookup dropdown:

- `attrs.appid = 41`
- `attrs.listsetid` points to the app/root listset
- `attrs.listid` points to `Customer Leads`
- `attrs.listfield = "Title"`
- `attrs["sort-first"] = { "SortName": "Created", "SortByDesc": true }`
- `attrs["search-scope"] = "3"`
- `attrs["search-fields"] = ["Title", "Text1"]`
- `attrs.displayStyle = "dropdown"`

Current-app lookup button adds:

- `attrs.displayStyle = "button"`
- `attrs.btn_text = { "value": "Choose One", "variable": null }`

External lookup dropdown uses external `ListSetID`/`ListID`, `attrs.link = "none"`, `attrs["search-scope"] = "1"`, and `attrs.listfilter[]`.

Generator rule: local lookup controls can use this as an export-backed shape only when the source list and display/search fields resolve. External lookup IDs must not be included in generated `ReplaceIds`.

## Lookup-List And Sublist Patterns

`lookup-list` uses:

- `attrs.multiple = true`
- source list metadata fields
- `attrs.addition[]` where shown fields have `IsShow = true`, `RelationName`, and `Order`

The sublist controls use:

- `control.type = "list"`
- `control.binding` to a `variables.basic` entry of `type = "list"`
- that variable's `value` points to a `variables.listref` entry
- sublist field controls include `attrs.list_field = true`, `attrs.list_field_binding`, and `attrs.list_control_id`

Generator rule: sublists and lookup-list are now better documented, but remain runtime-sensitive. Use the sample for inspection and validation warnings. Generate only after a focused minimal package proves the exact shape.

## Runtime-Sensitive Controls

The following are export-backed from this sample but should remain warning-first for generation:

- `richtext`
- `checkbox`
- `percent`
- `file-upload`
- `icon-upload`
- `identity-picker`
- `organization-picker`
- `location-picker`
- `cost-center-picker`
- `metadata`
- `mutiple-metadata`
- `lookup-list`
- `list`
- `data-list`
- `aktabs`
- `ak-tabs-tab`
- `action_button`

Safe generated defaults remain the previously proven smaller set unless the user explicitly asks to test these controls in staged packages.

## Validator Notes

`validate-ywf-def.js ai-training-approval-form-def.json --mode draft` currently fails because this exported sample is not a final generated approval workflow:

- it has no type `2` approval/task page
- lookup-list `attrs.addition[]` uses relation names from a listref-style projection rather than direct `variables.basic` targets
- several controls are schema-supported but runtime-unproven for generated packages

These are useful findings, not reasons to mutate the export. Validator policy should stay:

- keep missing task page as an error for final generated approval forms
- treat the lookup-list relation-name shape as a documented recommendation until a generated lookup-list package proves it
- keep runtime-sensitive controls as warnings or stop conditions for production-like generation
- update the normalized control schema later if `flex_grid.attrs.rows`, `ak-tabs-tab.label_var`, and list internals are confirmed by a smaller generated/runtime test

## Generator Rules Learned

1. For simple value controls, generate `binding` values that match `variables.basic[].id`.
2. Keep variable type compatible with the control:
   - text: `input`, `textarea`, `richtext`, `radio`, `checkbox`
   - number: `input_number`, `percent`, `currency`
   - boolean: `switch`
   - date: `datepicker`, `daterange`, `time`
   - file/img/user/groupselect/location/costcenter/metadata/lookup/list for corresponding native advanced controls.
3. Use `radio` for both button-style single choice and dropdown-style single choice; dropdown is `attrs.displayStyle = "dropdown"`.
4. Use `checkbox` for multi-choice; dropdown multi-choice is `attrs.displayStyle = "dropdown"`.
5. For `daterange`, create two date variables. Bind the control to the From variable and set the To variable in `attrs["binding-date-range"]`.
6. For `currency`, use number variable plus `attrs.currencyCode`, `attrs.displayFormat`, and `attrs.displayThousandths`.
7. For `file-upload`, include `attrs.ver = 1`, `attrs.file_multiple`, `attrs.file_maxcount`, and `attrs.upload_btn`.
8. For `identity-picker`, multiple selection uses `attrs.multiple = true` and `attrs["identity-maxselection"]`.
9. For `organization-picker`, use `attrs["metadata-treeselect"] = true`; multiple selection adds `attrs.multiple = true`.
10. For `metadata` and `mutiple-metadata`, include `attrs.source`, `attrs.categoryId`, and `attrs["metadata-treeselect"] = true`; do not guess category IDs.
11. For `cost-center-picker`, set `attrs.multiple` explicitly.
12. For lookup controls, require resolved `appid`, `listsetid`, `listid`, `listfield`, sort/search/link/modal metadata.
13. For sublists, generate `variables.listref` and list-field child controls together; do not hand-roll a list control without a matching listref.

## Stop Conditions For Future Generation

Stop before generating these patterns when:

- lookup source list, display field, or search fields do not resolve
- metadata category IDs are unknown
- department/location/cost-center source dependencies are not available
- file/image upload behavior must persist to a data list but no export-backed target field pattern exists
- sublist row fields or listref structure cannot be generated consistently
- validator errors would need to be ignored rather than understood
