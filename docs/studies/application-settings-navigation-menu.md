# Yeeflow Application Settings: Navigation Menu

## Scope

This study uses these read-only exports:

- `/Users/Renger/Downloads/Tenant Service Portal v2.yap`
- `/Users/Renger/Downloads/Tenant Service Portal v6.yap`

Raw exports and decoded payloads stayed outside git under ignored `tmp/application-settings-study/`.

## Export-Proven Location

Application navigation is stored on the root application/listset:

- `Data.Item.ListModel.LayoutView` is a JSON string.
- Parsed `LayoutView.sort[]` stores navigation menu items.
- Parsed `LayoutView.attrs["navigator-menu"]` stores navigation appearance and layout mode.
- Parsed `LayoutView.sortVer` was `1` in all five studied exports.

The root application shell remains:

- `Data.Item.ListModel.Type = 1024`
- child data-list resources in `Data.Childs[]`
- dashboard/page resources in `Data.Item.Layouts[]` with `Type = 103`
- approval forms/workflows in `Data.Forms[]` with `WorkflowType = 2` and `ListID = 0`

## Menu Item Shapes

### Top-Level Resource

Export-proven single resource item shape:

```json
{
  "AppID": 41,
  "ListID": "<RESOURCE_ID>",
  "ListSetID": "<APP_LISTSET_ID>",
  "Type": 103,
  "Title": "Tenant Home",
  "Icon": "fa-regular fa-grid-2",
  "DisplayName": "Tenant Home"
}
```

For data lists, `Type` is `1`; for approval forms, `Type` is `105`. Dashboard/page resources use `Type = 103` and reference `Data.Item.Layouts[].LayoutID`.

### Top-Level Group

Export-proven group shape:

```json
{
  "ID": "<GROUP_ID>",
  "AppID": 41,
  "ListSetID": "<APP_LISTSET_ID>",
  "Type": "classes",
  "Title": "Workbenches",
  "Icon": "fa-regular fa-layer-plus",
  "list": []
}
```

Group rules:

- `Type = "classes"` identifies a custom group.
- `Title` is the group display text and should always be present.
- `ID` is a group-local/menu ID.
- Child items are stored in `list[]`.
- No nested group was present; product rule is maximum depth 2.

### Child Resource Inside Group

Child resources inside a group reuse the same resource item shape:

```json
{
  "AppID": 41,
  "ListID": "<RESOURCE_ID>",
  "ListSetID": "<APP_LISTSET_ID>",
  "Type": 1,
  "IsHidden": false,
  "Title": "Lease Profiles",
  "Icon": "fa-regular fa-table-list"
}
```

## Display Text

Export-proven behavior:

- `DisplayName` stores custom navigation text when configured.
- Resource items may omit `DisplayName`; Yeeflow falls back to the resource `Title`.
- Groups use `Title` as required display text.
- `DisplayName: ""` was observed on hidden process menu items, not on generated app resource items.

## Icons And No-Icon

Export-proven behavior:

- Icon-enabled items use `Icon` with a string such as `fa-regular fa-grid-2`, `fa-regular fa-table-list`, or `fa-regular fa-pen-field`.
- No-icon items in v6 use `Icon: ""`.
- `null` icon was not export-proven for navigation items and should be treated as runtime-sensitive.

## Visibility And Ordering

Export-proven behavior:

- Ordering is array order in `LayoutView.sort[]` and child `list[]`.
- `IsHidden: false` marks visible menu items.
- `IsHidden: true` marks hidden resources that remain in the root sort array.
- Group items in the studied export did not use `IsHidden`.

## Observed Non-Goal Menu Types

The v2/v6 exports also include:

- process/task shortcuts: `Type = "process"` with `Path` such as `/p/claim`
- custom link: `Type = "link"` with `DisplayName` and `url`

These are observed but not promoted as generated application-resource menu rules in this branch.

## Validator Rules Added

- `LayoutView` must parse as JSON.
- navigation groups use `Type = "classes"`.
- group title/display text is required.
- groups cannot be nested.
- only groups should contain `list[]`.
- depth greater than two is a hard error for generated final packages.
- resource items may omit `DisplayName`.
- missing resource custom text falls back to `Title`.
- `Icon: ""` is accepted as the export-proven no-icon shape.
- invalid layout position values are hard errors for generated final packages.
