# Yeeflow Application Settings: Header

## Scope

This study inspects header settings across:

- `<downloads>/Tenant Service Portal v2.yap`
- `<downloads>/Tenant Service Portal v3.yap`
- `<downloads>/Tenant Service Portal v4.yap`
- `<downloads>/Tenant Service Portal v5.yap`
- `<downloads>/Tenant Service Portal v6.yap`

## Export-Proven Location

Application header appearance is stored in:

```text
Data.Item.ListModel.LayoutView -> attrs.appearance
```

## Export-Proven Fields

v2-v5:

```json
{
  "bgc": "var(--c--primary-light)",
  "color": "var(--c--primary)"
}
```

v6:

```json
{
  "bgc": "var(--c--primary-light)",
  "color": "var(--c--primary)",
  "height": 46,
  "hideTitle": true
}
```

## Findings

- Default 56 px header height is represented by omission in v2-v5 and by the product UI default.
- Small header height is export-proven as `height: 46`.
- Larger header height was not present in the five exports; it remains product-known but not export-proven here.
- Title visibility off is export-proven as `hideTitle: true`.
- Title visibility on/default is represented by omission in v2-v5.
- Header color fields are `bgc` and `color`.
- `onheader` navigation layout did not require a different header field shape in v4.

## Validator Rules Added

- `appearance.height`, when present, must be a positive number.
- `46` and omitted/default 56 px are documented as export-proven.
- unstudied positive heights warn rather than hard-fail.
- `appearance.hideTitle`, when present, must be boolean.
