# Data List Custom List Form Fields

## Scope

Source export: `<downloads>/Data Lists (3).yap`

Target data lists:

- `Data list with fields part A`
- `Data list with fields part B`
- `Data list with fields part C`

Proof boundary:

- Data List custom list form schema and field-control usage in this export: export-proven.
- Data List validation updates in this branch: validator-backed.
- Document Library custom-form applicability: product/user-understanding-backed only; this export contains no Type `16` document library custom form proof.
- Runtime form rendering, field editing, save/submit behavior, form action execution, and Document Library behavior: not runtime-proven.

This pass studies how already-defined Data List fields are placed and configured on custom list forms. It does not import the package, create records, or execute form actions.

## Inventory

The export contains 11 list-like app resources. The three target data lists were found and inspected.

| Target list | Fields in `Defs` | Custom fields | System fields | Custom list forms | Controls inspected | List-bound controls | Grid controls | Temp variables | Form actions | Field types represented on forms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `Data list with fields part A` | 75 | 74 | 1 | 2 | 157 | 150 | 2 | 2 | 3 | `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `location-picker`, `file-upload`, `icon-upload`, `lookup`, `calculated-column` |
| `Data list with fields part B` | 18 | 17 | 1 | 1 | 20 | 17 | 1 | 0 | 0 | `input`, `metadata`, `mutiple-metadata`, `cost-center-picker`, `rate`, `hyperlink`, `signer`, `tag`, `autonumber`, `list` |
| `Data list with fields part C` | 75 | 74 | 1 | 1 | 78 | 75 | 1 | 0 | 0 | `input`, `textarea`, `richtext`, `input_number`, `percent`, `currency`, `switch`, `radio`, `checkbox`, `datepicker`, `time`, `identity-picker`, `organization-picker`, `location-picker`, `file-upload`, `icon-upload`, `lookup`, `calculated-column` |

Summary:

- Custom list forms found: 4.
- Controls inspected: 255.
- List-bound controls inspected: 242.
- Grid controls inspected: 4.
- Nested sub-list field controls found: 13, all under the Part B `list` field control.
- Temp variables found: 2.
- Form actions found: 3.
- Export-proven field types represented on custom forms: 27.
- `select` and `flowstatus` were not present on these custom list forms and remain unproven for this export.

## Storage Shape

Custom list forms are stored on the list resource itself:

- `Data.Item.Layouts[]` or `Data.Childs[].Layouts[]`
- custom form layout: `Type = 1`
- normal data view layout: `Type = 0`
- embedded form JSON: `Layouts[].LayoutInResources[0].Resource`
- `LayoutInResources[0].ID` and `RefId` match `Layouts[].LayoutID` in this export.
- `Layouts[].LayoutView` is `null` for embedded custom form layouts.
- `Layouts[].Ext2` carries a source marker shape like `{"src":true}`.
- `ListModel.LayoutView` assigns custom forms to display settings such as `add`, `edit`, and `view`.

Assignment patterns found:

- Part A uses one custom form for `edit` and another for `add`; `view` remains `default`.
- Part B assigns the same custom form to `add`, `edit`, and `view`.
- Part C assigns the same custom form to `add` and `edit`; `view` remains `default`.

The embedded form resource has these export-proven top-level keys:

- `children`
- `attrs`
- `title`
- `filterVars`
- `ver`
- `tempVars`
- `exts`
- optional `actions`
- optional `formAction`
- optional `filter`

Generation rule: generated custom list forms must keep `children`, `filterVars`, and `tempVars` as arrays. Actions should be arrays when present. Do not confuse Data List custom list forms with approval submission forms or workflow task forms.

## Field Controls

List fields are represented on custom list forms as controls under `Resource.children`, usually inside nested containers and one `flex_grid`.

Common export-proven control shape:

- `id`: control identifier.
- `type`: control type; usually matches the Data List field `Type`.
- `binding`: list field `FieldName`.
- `fieldID`: list field `FieldID`.
- `label`: display label.
- `attrs`: field settings copied or transformed from `Defs[].Rules`.
- `isFilter`, `isSort`, `isUnique`, `isSystem`, `status`: field metadata mirrored from the list field.
- optional `value`: default value or control value shape when configured.

Validation rules:

- A list-bound control `binding` must resolve to a field in the same list, except nested sub-list controls that use `attrs.list_field = true`.
- A list-bound control `fieldID` must resolve to the same field as `binding`.
- Control ids should be unique within a custom form.
- Unknown visual controls should warn until export-proven.

## Field Families On Forms

Text and input:

- `input`, `textarea`, `richtext`, and `hyperlink` controls keep the list field `binding` and carry field-specific `attrs` such as `placeholder`, `input-maxlength`, `required`, `encrypt`, `allowScan`, `richtext-type`, and hyperlink settings where present.

Numeric and financial:

- `input_number`, `currency`, `percent`, and `rate` controls preserve numeric settings from field rules, including `displayThousandths`, `rounded-to`, `number_min`, `number_max`, `number_step`, `currencyCode`, `displayFormat`, and `rate-type`.
- `calculated-column` controls are present as list-bound controls with `attrs.calculated` and `attrs.calculated_result`; runtime formula calculation is not proven here.

Selection and choice:

- `switch`, `radio`, `checkbox`, and `tag` controls carry selection settings such as `choices`, `color_choices`, `displayStyle`, `show_color`, `required`, `placeholder`, and tag source/category settings.
- `select` is not present on these custom forms.

Date and time:

- `datepicker` and `time` controls use datetime-backed fields and carry settings such as `date_picker`, `showtime`, `dateformat`, `minuteStep`, `date_type`, `disable_now_button`, `placeholder`, and `required`.

Identity and organization:

- `identity-picker`, `organization-picker`, and `cost-center-picker` controls carry picker settings such as `identity-maxselection`, `multiple`, `metadata-treeselect`, `parentId`, and `required`.
- Tenant-specific default values or picker sources must not be generated without a safe source or explicit user mapping.

Uploads and media:

- `file-upload` and `icon-upload` controls carry settings such as `ver`, `file_multiple`, `file_types`, `file_typeslimit`, `maxsize`, `controlmultiple`, `picture_size_limit`, and `required`.
- Upload behavior is not runtime-proven by this export.

Advanced:

- `lookup` controls carry target metadata such as `appid`, `listid`, `listsetid`, `listfield`, `listfilter`, `search-fields`, `search-scope`, sort settings, `max-selection`, `multiple`, and display settings.
- `metadata` and `mutiple-metadata` controls carry `source`, `categoryId`, optional `parentId`, `metadata-treeselect`, `max-selection`, and default value shapes.
- `autonumber` and `signer` appear as list-bound controls.
- `flowstatus` is not present on these custom forms.

## Grid Layout

Each custom list form uses a simple nested layout:

- outer `container`
- inner `container`
- one `flex_grid`
- list-bound field controls as grid children

The `flex_grid` control has:

- `attrs.ver`
- `attrs.columns` with breakpoint keys such as `1`, `2`, and `3`
- `attrs.rows`
- `attrs.cgap`
- `attrs.cgapU`
- `children` containing the controls in render/order sequence

The export does not show explicit per-child row/column coordinates. Generation should therefore keep a stable non-overlapping child order and use `flex_grid` settings conservatively. Field order should follow list field order unless the user asks for grouped sections.

## Sub-list Controls

The sub-list field in Part B is represented by a parent control:

- parent control `type = "list"`
- parent control `binding` points to the Data List field `FieldName`
- `attrs.list-variables` defines nested sub-list variables
- `attrs.list-fields` defines nested field entries and their nested controls

Nested sub-list variables found:

- `text`
- `number`
- `boolean`
- `date`
- `file`
- `metadata`
- `user`
- `costcenter`
- `groupselect`
- `location`
- `lookup`
- `img`
- `mutiple-metadata`

Nested controls use:

- `control.type` mapped from the nested variable type, such as `input`, `input_number`, `switch`, `datepicker`, `file-upload`, `metadata`, `identity-picker`, `cost-center-picker`, `organization-picker`, `location-picker`, `lookup`, `icon-upload`, and `mutiple-metadata`.
- `control.binding` values such as `field_1`, scoped to the sub-list control rather than the parent list `Defs`.
- `control.attrs.list_field = true`
- `control.attrs.list_field_binding` pointing back to the parent sub-list field binding.
- `control.attrs.list_control_id` pointing back to the parent list control id.

Validation rules:

- Parent sub-list controls should include both `attrs.list-variables` and `attrs.list-fields`.
- Nested `list-fields` entries should resolve to `list-variables` by name.
- Nested controls should include `type`, `binding`, and `attrs.list_field = true`.
- Nested controls should point back to the parent sub-list field via `attrs.list_field_binding`.

## Temp Variables

Temp variables are custom-list-form scoped, not workflow variables.

Export-proven path:

- `LayoutInResources[0].Resource.tempVars[]`

Observed shape:

- `idx`
- `id`

The Part A edit form includes two temp variables and uses them in form actions. Action expressions reference temp variables with expression objects using `exprType = "variable"` and ids/names such as `__temp_var_*` / `var_*`. Validators should allow the export-proven aliasing pattern but must still require every referenced temp variable to resolve.

Generation rules:

- Temp variable ids must be unique within a form.
- Temp variables should be generated only when an action or control needs them.
- Temp variables should not be confused with Data List fields or workflow variables.

## Form Actions

Only Part A's edit custom list form contains form actions.

Export-proven paths:

- `LayoutInResources[0].Resource.actions[]`
- `LayoutInResources[0].Resource.actions[].steps[]`
- `LayoutInResources[0].Resource.formAction`
- action button binding: `control.attrs.control_action`

Observed action shape:

- action `id`
- action `name`
- `steps` array
- step `type = "setvar"`
- step `attrs.setvar_multi` and `attrs.setvar_array` for multi-set actions
- step `attrs.setvar_var` and `attrs.setvar_val` for single-set actions
- optional `condition` expression array

Observed bindings:

- `formAction.onLoad` points to a form action id.
- an `action_button` control uses `attrs.control_action` to point to an action id.

No submit/save action step was found in the target custom list forms. Submit/save action behavior remains unproven for this export.

Validation rules:

- `form.actions` must be an array when present.
- action ids must be present and unique.
- action steps must be arrays.
- action button `attrs.control_action` references must resolve to `form.actions[].id`.
- `formAction` hook references must resolve to `form.actions[].id`.
- Set-variable targets that use `exprType = "list_field"` must resolve to the list `Defs`.
- Temp variable references must resolve to `form.tempVars`.
- Unknown action step types should warn, not fail, until export-proven.

## Custom List Form Display Settings

Custom form display settings are stored on the list resource, separate from the form layout itself.

Export-proven path:

- `Data.Childs[].ListModel.LayoutView`

Observed schema:

- `add`: New Item form assignment.
- `edit`: Edit Item form assignment.
- `view`: View Item form assignment.
- `opentype`: optional object keyed by `add`, `edit`, and `view`.
- `modalsize`: optional object keyed by `add`, `edit`, and `view`.

Form assignment values are either a custom form `Layouts[].LayoutID` or the literal `default`. The `default` value means the built-in default layout is used instead of a custom list form. In this export, custom form references resolve to `Layouts[]` entries with `Type = 1`.

Open mode mapping:

- `opentype.<usage> = "modal"` maps to Pop-up window.
- `opentype.<usage> = "slide"` maps to Slide in.
- missing `opentype.<usage>` uses the export/UI default: New Item and Edit Item open as Pop-up window; View Item opens as Slide in.
- Full page appears in the UI screenshots but was not found in the target-list export, so its exact export token remains unproven in this pass.

Size mapping:

- `modalsize.<usage> = 0` maps to Medium.
- `modalsize.<usage> = 1` maps to Small.
- `modalsize.<usage> = 2` maps to Large.
- `modalsize.<usage> = 3` maps to Full screen.
- missing `modalsize.<usage>` means Default size in the export, seen on Part B New Item.

The export proves size settings for Pop-up window and Slide in. Full page should not rely on pop-up/slide size behavior unless a future export proves that shape.

Target-list combinations found:

| List | Usage | Form assignment | Open mode | Size |
| --- | --- | --- | --- | --- |
| `Data list with fields part A` | New Item | `Custom list form 2` | Pop-up window | Small |
| `Data list with fields part A` | Edit Item | `Custom list form` | Pop-up window | Large |
| `Data list with fields part A` | View Item | Default layout | Slide in | Medium |
| `Data list with fields part B` | New Item | `Custom list form` | Slide in | Default |
| `Data list with fields part B` | Edit Item | `Custom list form` | Slide in | Large |
| `Data list with fields part B` | View Item | `Custom list form` | Pop-up window | Full screen |
| `Data list with fields part C` | New Item | `Custom list form` | Pop-up window | Full screen |
| `Data list with fields part C` | Edit Item | `Custom list form` | Pop-up window | Large |
| `Data list with fields part C` | View Item | Default layout | Slide in | Medium |

Validation rules:

- New/Edit/View form references must resolve to either `default` or an existing custom form layout.
- Open mode should be one of the export-proven values, or warn if unknown.
- Size should be one of the export-proven codes, or warn if unknown.
- Pop-up window and Slide in should preserve valid size settings when specified.
- Full page should not require a size setting; a size paired with Full page should warn until product/export evidence proves it.

Generation rules:

- Generated Data Lists may assign separate custom/default layouts for New Item, Edit Item, and View Item.
- Choose open mode and size based on form complexity: simple forms can use Small/Medium, longer field-heavy forms should use Large/Full screen.
- If the user does not specify display behavior, use conservative defaults: New Item in Pop-up window with Medium or Large, Edit Item in Pop-up window or Slide in with Medium/Large, and View Item in Slide in with Medium.
- Validate display settings independently from form layout validity.
- Document Library display-setting applicability remains product/user-understanding-backed only until a Type `16` export proves the exact shape.

Proof boundary: Data List custom list form display settings are export-proven from `Data Lists (3).yap`; the screenshots were used only as visual UI-label reference. Runtime opening/rendering behavior is not proven in this pass.

## Generation Rules

For generated Data List custom list forms:

- Store custom forms as `Layouts[]` entries with `Type = 1`.
- Use `LayoutInResources[0].Resource` as the embedded JSON string.
- Keep `LayoutInResources[0].ID` and `RefId` aligned to `LayoutID`.
- Assign forms through `ListModel.LayoutView.add`, `edit`, and/or `view`.
- Generate `children`, `filterVars`, and `tempVars` as arrays.
- Use `container` -> `container` -> `flex_grid` unless a stronger export-proven pattern is selected.
- Place list fields as controls with matching `type`, `binding`, `fieldID`, `label`, field metadata, and field-specific `attrs`.
- Use default/system fields only when appropriate; keep them read-only or system-aware when generated.
- Generate unique control ids.
- Validate all list-bound controls against `Defs`.
- Generate sub-list nested controls only inside a parent `list` control and use `attrs.list_field` metadata.
- Generate temp variables only when needed, and validate references.
- Generate form actions only when requested or structurally required, and validate button/hook/action references.
- Do not reuse approval form submission/task form assumptions without export proof.

Mandatory schema rules from earlier milestones still apply:

- `Defs` and `Layouts` must be arrays, never `null`.
- `ListModel.Flags = 1`.
- `ListModel.Status = 1` when present.
- `FieldIndex` / `FieldName` suffix must sync.
- `DisplayName`, `FieldName`, and `InternalName` must be unique in the same list.
- `InternalName` must match `[a-zA-Z0-9_]`.

## Normalized References

Redacted normalized references were created under:

`docs/studies/normalized/data-list-custom-forms/`

Created refs:

- `custom-list-form-resource.normalized.json`
- `custom-list-form-grid-layout.normalized.json`
- `custom-list-form-list-bound-control.normalized.json`
- `custom-list-form-default-field-control.normalized.json`
- `custom-list-form-sublist-control.normalized.json`
- `custom-list-form-lookup-control.normalized.json`
- `custom-list-form-user-picker-control.normalized.json`
- `custom-list-form-attachment-control.normalized.json`
- `custom-list-form-image-control.normalized.json`
- `custom-list-form-calculated-control.normalized.json`
- `custom-list-form-temp-variable.normalized.json`
- `custom-list-form-action.normalized.json`
- `custom-list-form-button-action-binding.normalized.json`
- `custom-list-form-display-new-item-popup-small.normalized.json`
- `custom-list-form-display-edit-item-popup-large.normalized.json`
- `custom-list-form-display-view-item-slide-medium.normalized.json`
- `custom-list-form-display-default-layout.normalized.json`
- `custom-list-form-display-view-item-popup-full-screen.normalized.json`

No `custom-list-form-submit-action-step.normalized.json` was created because no submit/save step was found in the target custom list forms.
No `custom-list-form-display-full-page.normalized.json` was created because Full page was not found in the target-list export.
