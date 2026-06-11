# Yeeflow Data View Resource Settings Study

Proof boundary: export-proven, product-documented, and validator-backed only. This pass studied `/Users/Renger/Downloads/Data Lists (1).yap` read-only, generated redacted normalized references under `docs/studies/normalized/data-views/`, and did not import, open, execute, mutate, or runtime-test the package.

## Summary

The export contains 7 list-like child resources, all data lists (`Data.Childs[].ListModel.Type = 1`). It contains no document libraries (`Type = 16`) and no Form Report child resources (`Type = 32`), so document-library and Form Report applicability is inferred from existing repository studies and Help Center/product behavior rather than this export.

Data views live in `Data.Childs[].Layouts[]`. View metadata such as name, type, default flag, permission flag, and URL is stored on each layout record. View configuration is split between:

- `Layouts[].Ext1`: JSON string with `Url`, `displayStyle`, `ShowTable`, and view-type-specific field selectors such as `TitleField`, `CoverField`, `CategoryField`, and `IncludeUncategorized`.
- `Layouts[].LayoutView`: JSON string with list-style `layout`, `query`, `sort`, `filter`, and `rowColor`, or calendar-specific keys such as `Scope`, `Columns`, `DefaultColor`, `ColorClass`, and `ColorClassSetting`.

Help Center pages document data views as configurable per-resource presentations with list, gallery, calendar, and kanban styles, plus fields, filters, sorts, URLs, permissions, and default-view behavior:

- [Understand Data views](https://<yourdomain>.yeeflow.com/<redacted-path>
- [Getting started with Yeeflow data views](https://<yourdomain>.yeeflow.com/<redacted-path>
- [Understand Data List](https://<yourdomain>.yeeflow.com/<redacted-path>
- [Creating and utilizing data views in form reports](https://<yourdomain>.yeeflow.com/<redacted-path>

## Export Inventory

| Resource | Resource type | Views | Default view | View types found | URL/key findings | Permission findings | Sort/filter findings | Proof |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| `<data-list-1>` | data list | 4 | `All Items` | list, gallery, kanban | default URL `default`; custom URLs present and redacted | `IsItemPerm = false`; no custom audience schema found | list/gallery filters; created/creator sorts | export-proven |
| `<data-list-2>` | data list | 4 | `All Items` | list, gallery, kanban | default URL `default`; custom URLs present and redacted | `IsItemPerm = false`; no custom audience schema found | one list filter; created/creator sorts | export-proven |
| `<data-list-3>` | data list | 4 | `All Items` | list, gallery, kanban | default URL `default`; custom URLs present and redacted | `IsItemPerm = false`; no custom audience schema found | list/gallery filters; created/creator sorts | export-proven |
| `<data-list-4>` | data list | 4 | `All Items` | list, gallery, kanban | default URL `default`; custom URLs present and redacted | `IsItemPerm = false`; no custom audience schema found | list/gallery filters; created/creator sorts | export-proven |
| `<data-list-5>` | data list | 4 | `All Items` | list, gallery, kanban | default URL `default`; custom URLs present and redacted | `IsItemPerm = false`; no custom audience schema found | list/gallery filters; created/creator sorts | export-proven |
| `<data-list-6>` | data list | 4 | `All Items` | list, gallery, kanban | default URL `default`; custom URLs present and redacted | `IsItemPerm = false`; no custom audience schema found | list/gallery filters; created/creator sorts | export-proven |
| `<data-list-7>` | data list | 4 | `All tasks` | list, calendar | default flag present but name is not `All Items` | `IsItemPerm = false`; no custom audience schema found | active/closed task filters; calendar user-filter fields | export-proven |

## Data View Inventory

| Resource type | Resource | View | Default/custom | View type | URL/key | Visible fields | Primary sort | Secondary sort | Data filter | User filter | Permission | Special settings | Proof |
| --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| data list | `<data-list-1>` | `All Items` | default | list | `default` | 12 | none | none | none | none | inherited/no view item flag | none | export-proven |
| data list | `<data-list-1>` | `<custom-list-view>` | custom | list | redacted | 14 | `Created` desc | none | 1 condition | none | inherited/no view item flag | `displayStyle`, `ShowTable` | export-proven |
| data list | `<data-list-1>` | `<gallery-view>` | custom | gallery | redacted | 2 | `Created` desc | none | 1 condition | none | inherited/no view item flag | `TitleField` | export-proven |
| data list | `<data-list-1>` | `<kanban-view>` | custom | kanban | redacted | 4 | `CreatedBy` desc | none | none | none | inherited/no view item flag | `TitleField`, `CategoryField`, `IncludeUncategorized` | export-proven |
| data list | `<data-list-2>` | `All Items` | default | list | `default` | 16 | none | none | none | none | inherited/no view item flag | none | export-proven |
| data list | `<data-list-2>` | `<custom-list-view>` | custom | list | redacted | 18 | `CreatedBy` desc | none | 1 condition | none | inherited/no view item flag | `displayStyle`, `ShowTable` | export-proven |
| data list | `<data-list-2>` | `<gallery-view>` | custom | gallery | redacted | 5 | `Created` desc | none | none | none | inherited/no view item flag | `TitleField`, `CoverField` | export-proven |
| data list | `<data-list-2>` | `<kanban-view>` | custom | kanban | redacted | 5 | `CreatedBy` desc | none | none | none | inherited/no view item flag | `TitleField`, `CoverField`, `CategoryField` | export-proven |
| data list | `<data-list-3..6>` | same pattern as `<data-list-1>` | mixed | list/gallery/kanban | redacted | 2-14 | created/creator sorts | none | list/gallery filters | none | inherited/no view item flag | title/category selectors | export-proven |
| data list | `<data-list-7>` | `All tasks` | default | list | `all` | 12 | none | none | none | none | inherited/no view item flag | `displayStyle`, `ShowTable` | export-proven |
| data list | `<data-list-7>` | `<active-task-view>` | custom | list | redacted | 10 | `Created` asc | none | 2 conditions | none | inherited/no view item flag | `displayStyle`, `ShowTable` | export-proven |
| data list | `<data-list-7>` | `<closed-task-view>` | custom | list | redacted | 10 | `Created` asc | none | 2 conditions | none | inherited/no view item flag | `displayStyle`, `ShowTable` | export-proven |
| data list | `<data-list-7>` | `<calendar-view>` | custom | calendar | redacted | 0 list columns | none | none | none | six query fields marked filterable | inherited/no view item flag | `Scope`, `Columns`, colors, external setting | export-proven |

## Default View Behavior

Default views are represented by `Layouts[].IsDefault = true`. Six of the seven exported data lists use the title `All Items` and `Ext1.Url = "default"`. The seventh uses `IsDefault = true` with title `All tasks` and `Ext1.Url = "all"`, so the export disproves a strict rule that every default view must literally be named `All items`.

Generation rule: every list-like resource should have exactly one default view unless a focused export proves a different resource-specific pattern. Prefer `All Items` / `Url: "default"` for generic generated data lists, but validators should key default detection on `IsDefault`, not only the title.

## View Types

| Product type | Export Type code | Export settings | Required/dependent fields | Proof |
| --- | ---: | --- | --- | --- |
| List view | `0` | `LayoutView.layout`, `query`, optional `sort`, `filter`, `rowColor`; `Ext1.Url`, optional `displayStyle`, `ShowTable` | layout/query/filter/sort fields reference resource `Defs[]` or system fields | export-proven |
| Gallery view | `999` | list-like `LayoutView`; `Ext1.TitleField`; optional `Ext1.CoverField` | title field required in found samples; cover image optional/product-documented | export-proven |
| Kanban view | `104` | list-like `LayoutView`; `Ext1.TitleField`, `CategoryField`, optional `CoverField`, `IncludeUncategorized` | category field should resolve to a valid field | export-proven |
| Calendar view | `100` | calendar-specific `LayoutView.Scope`, `Columns`, colors, `Filter`, `ExternalSetting`, `query` | start/end/title fields in `Columns` should resolve to valid fields | export-proven |
| News, Gantt, Timeline | not found | Help Center documents these types, but this export does not include their schema | unknown | product-documented only |

## Permissions

This export only proves the inherited/no-custom view permission shape:

- Each studied view has `Layouts[].IsItemPerm = false`.
- No users, groups, departments, audiences, or custom permission collections were found in the view objects.
- Help Center documents choosing a view permission type when creating a view and notes that setting a view as default forces permission to all users.

Generation rule: emit deliberate permission settings where the schema is known; otherwise preserve inherited/all-user default-view behavior and warn on opaque custom audience shapes. Redact users, departments, groups, tenant IDs, emails, and list/view names in study artifacts.

## Sorting

Sort settings live in `LayoutView.sort[]`. Each sort object uses:

- `SortName`: field name or system field.
- `SortByDesc`: boolean; `true` means descending, `false` means ascending.

Only one sort entry was found per sorted view in this export, so primary sort is export-proven and secondary sort remains generation-supported by schema expectation but not sample-proven here. Sort fields found include system fields (`Created`, `CreatedBy`). No custom-field sort sample was found.

## Data Filters

Fixed data filters live in `LayoutView.filter[]`. Observed condition shape:

```json
{
  "key": "<condition-key>",
  "pre": "and",
  "left": "<field-name>",
  "op": "<operator-code>",
  "right": "<fixed-value-or-null>",
  "showCus": true
}
```

The sample proves flat `and` conditions and fixed literal values. It does not prove nested conditions, current-user filters, date filters, or expression-token operands for data-list views. Empty or absent `filter` means no fixed filter, so all records are eligible subject to permissions and resource behavior.

## User Filters

End-user filterable fields are represented in `LayoutView.query[]` with `IsFilter = true`. The calendar view sample marks six query fields as filterable. Most list/gallery/kanban samples include query fields but no explicit `IsFilter = true`.

User filters are separate from fixed `LayoutView.filter[]`: user filters declare interactive fields, while fixed filters constrain records for the view.

## Columns And Visible Fields

List-like views use `LayoutView.layout[]` for visible/hidden field columns:

- `FieldID` and `FieldName` identify the field.
- `Order` stores column order.
- `Show` controls visibility.
- `Mobile` stores mobile-display behavior.
- `DisplayName` can differ per view.

This export includes field reference warnings in `<data-list-7>` where view layouts reference fields not present in that resource's `Defs[]`. Treat unresolved view field references as validator warnings for compatibility exports and stronger generator-final findings when they are introduced by generated packages.

## Data List vs Document Library vs Form Report Applicability

| Resource type | Shared schema | Resource-specific differences | Proof |
| --- | --- | --- | --- |
| Data list | `Data.Childs[].Layouts[]`; Type `0`, `100`, `104`, `999`; `Ext1.Url`; `LayoutView` view settings | Normal editable list resource with custom forms, list workflows, sample rows, and generated `Title` metadata requirements | export-proven in this pass |
| Document library | Existing docs prove Type `16` resources use `Defs[]`, Type `0` views, and Type `1` forms; configured views can reuse list-like `LayoutView` keys | Newly created document libraries may have empty-string default view `LayoutView`; document fields/folder/upload behavior are library-specific | prior export/runtime docs, not this export |
| Form Report | Existing docs prove Type `32` resources expose Type `0` views and `Attr_IsViewDetail` for detail access | Report fields derive from approval form variables and optional one sub-list; no workflows/edit forms/sample mutation surface | prior export docs plus Help Center Form Report view doc, not this export |

## Help Center Comparison

| Concept | Product behavior | Export-proven field/shape | Match status | Proof |
| --- | --- | --- | --- | --- |
| Multiple views per resource | Data lists can contain multiple views and users can switch/reorder them | 7 data lists with 28 total views | match | product-documented + export-proven |
| View name and URL | New view creation asks for name and URL | `Layouts[].Title`, `Ext1.Url` | match | product-documented + export-proven |
| View permission | View creation asks for permission type; default views use all users | `IsItemPerm = false`; no custom audience found | partial | product-documented + export-proven gap |
| Default view | Product supports setting a default view | `IsDefault = true`; six names `All Items`, one renamed `All tasks` | match with naming caveat | product-documented + export-proven |
| List/Gallery/Calendar/Kanban | Help Center documents all four | `Type 0`, `999`, `100`, `104` | match | product-documented + export-proven |
| News/Gantt/Timeline | Help Center documents additional types | not present | not found | product-documented only |
| Filters and sorting | Product documents per-view filtering/sorting | `LayoutView.filter[]`, `LayoutView.sort[]` | match | product-documented + export-proven |

## Validator And Generator Guidance

- Detect list-like views from `Layouts[]`, not from a separate `Views` collection.
- Default view detection should use `IsDefault = true`; warn when there is no default or multiple defaults.
- View URLs should be unique within a resource; `default` and `all` are export-proven default URL values.
- Known view type codes: list `0`, calendar `100`, kanban `104`, gallery `999`.
- Field references in visible columns, sort, filters, user filters, and type-specific settings should resolve to `Defs[]` or known system fields.
- Treat unknown view types and opaque permission audiences as warnings until a focused export/runtime pass proves failure behavior.
- Do not claim runtime view switching, permissions, drag/drop kanban updates, calendar rendering, or detail-page behavior without a focused runtime baseline.
