# Application Settings Generation Rules

## Export-Proven Settings

Root settings live in `Data.Item.ListModel.LayoutView` as a JSON string:

```json
{
  "add": "default",
  "edit": "default",
  "view": "default",
  "sort": [],
  "attrs": {
    "appearance": {},
    "navigator-menu": {}
  },
  "sortVer": 1
}
```

## Navigation Generation

- Generate top-level resources directly in `sort[]`.
- Generate groups as `Type: "classes"` with `ID`, `Title`, `Icon`, and `list[]`.
- Do not nest groups.
- Keep menu depth to two layers.
- Use array order as display order.
- Use `DisplayName` only for custom display text.
- Omit `DisplayName` for resource-name fallback.
- Use `Icon: ""` for no-icon.
- Use `IsHidden` only as boolean.

## Resource Type References

Export-proven application-resource navigation types:

- `1` data list
- `16` document library, proven from prior document-library studies
- `32` form report/list resource, supported by existing app-resource model but not present in this export set
- `64` data report/resource, supported by existing app-resource model but not present in this export set
- `103` dashboard/application page
- `105` approval form

Observed but not promoted as generator defaults:

- `process`
- `link`

## Layout Generation

Write `attrs["navigator-menu"].position` explicitly:

- `default` for Horizontal
- `left` for Vertical
- `onheader` for On header
- `none` for None

## Header Generation

- Use omitted `appearance.height` for default 56 px unless a non-default height is requested.
- Use `appearance.height = 46` for the export-proven smaller header.
- Use `appearance.hideTitle = true` to hide the title.
- Omit `hideTitle` for visible/default title behavior unless another export proves `false` is necessary.

## User Group Generation

- Generate empty `Data.AppGroups[]` entries only.
- Use fresh IDs and include them in `Resource.ReplaceIds[]`.
- Do not include users/members until member schema is proven.
- Do not include real names, emails, or tenant-local user IDs.

## Proof Boundary

This branch documents export-proven structure and validator/generator rules. It does not claim runtime proof for generated application-settings packages unless a future safe import test is run.
