# Yeeflow Application Settings: Navigation Layout

## Scope

This study compares:

- `<downloads>/Tenant Service Portal v2.yap`
- `<downloads>/Tenant Service Portal v3.yap`
- `<downloads>/Tenant Service Portal v4.yap`
- `<downloads>/Tenant Service Portal v5.yap`

## Export-Proven Field

Navigation menu layout is stored in the parsed root layout JSON:

```text
Data.Item.ListModel.LayoutView -> attrs["navigator-menu"].position
```

## Comparison Table

| Export | Expected layout | Setting field | Stored value | Additional related settings | Generator rule |
| --- | --- | --- | --- | --- | --- |
| v2 | Horizontal/default | `attrs["navigator-menu"].position` | `default` | `bgc`, `color` | Use `default` for horizontal navigation under the header. |
| v3 | Vertical | `attrs["navigator-menu"].position` | `left` | `bgc`, `color` | Use `left` for left-panel vertical navigation. |
| v4 | On header | `attrs["navigator-menu"].position` | `onheader` | `bgc`, `color` | Use `onheader` when the menu should sit inside the header. |
| v5 | None | `attrs["navigator-menu"].position` | `none` | `bgc`, `color` | Use `none` when no navigation menu should render. |

## Default Behavior

The studied "default/horizontal" export stores `position: "default"` explicitly. Missing `position` was not proven in this export set, so generators should write `default` rather than relying on omission.

## Validator Rules Added

Allowed export-proven values:

- `default`
- `left`
- `onheader`
- `none`

Unknown values are hard errors for generated final packages and warnings in less certain contexts.
