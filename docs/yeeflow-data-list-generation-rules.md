# Yeeflow Data List Generation Rules

These rules apply to standalone `.ydl` list packages and child data lists embedded inside `.yap` application packages.

## Data View Rules

Use `docs/studies/data-view-resource-settings.md` and `docs/studies/normalized/data-views/` before generating non-trivial data-list views.

Export-proven data-view rules from `Data Lists (1).yap`:

- Data views are `Layouts[]` entries on list-like resources.
- View metadata lives on the layout record: `Title`, `Type`, `Ext1`, `IsDefault`, and `IsItemPerm`.
- View URL/key lives in parsed `Ext1.Url`.
- View settings live in parsed `LayoutView`.
- Default view detection should use `IsDefault = true`; six sampled defaults were named `All Items`, but one default was renamed `All tasks`.
- Known view type codes are `0` list, `999` gallery, `104` kanban, and `100` calendar.
- List/gallery/kanban views use `LayoutView.layout`, `query`, optional `sort`, `filter`, and `rowColor`.
- Calendar views use `LayoutView.Scope`, `Columns`, color settings, `ExternalSetting`, and `query`.
- Fixed view filters live in `LayoutView.filter[]`.
- End-user filterable fields are query entries with `IsFilter = true`.
- Primary and secondary sort fields, when present, should reference valid resource fields or known system fields.
- Custom view URL/key values must be unique within the resource.
- Permission behavior is only partially export-proven in this sample: all views used `IsItemPerm = false`, while Help Center documents choosing view permission types. Warn on custom permission/audience shapes until a focused export proves them.

Do not claim runtime view switching, calendar rendering, kanban drag/drop updates, or permission behavior without a focused runtime baseline.

## Field Identity Rules

- `FieldName` must be unique inside each data list.
- `InternalName` must be unique inside each data list.
- `DisplayName` should be unique inside each data list; duplicate visible names are a Yeeflow materialization risk.
- Preserve native `Title` field metadata while allowing its display label to match the business concept.

## YAP App Materialization Rules

For child data lists inside a generated `.yap` application:

- Every `FieldID` must be unique across the whole application.
- Do not reuse the same field ID range for every list.
- Allocate `FieldID` values from an app-level allocator.
- Every field's `ListID` must equal the parent data-list `ListID`.
- When remapping `FieldID`, do not remap `field.ListID` to the new `FieldID`.
- Every generated child list must contain fields owned by that child list before import.
- Every child list must pass standalone `validate-ydl-list` and app-level `validate-yap-package`.

Correct field shape:

```json
{
  "ListModel": { "ListID": "6182000000000000100" },
  "Defs": [
    {
      "FieldID": "6182000000000010001",
      "ListID": "6182000000000000100",
      "FieldName": "Title",
      "DisplayName": "Request Title"
    }
  ]
}
```

Incorrect field shape:

```json
{
  "FieldID": "6182000000000010001",
  "ListID": "6182000000000010001"
}
```

The incorrect shape can create a list shell without attaching custom fields.
