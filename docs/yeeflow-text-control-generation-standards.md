# Yeeflow Text Control Generation Standards

Use these standards for generated approval forms, data-list custom forms, dashboards, and app pages.

## Default Control

The native Text control is:

```json
{
  "type": "heading",
  "label": "Text"
}
```

Do not use ad hoc text-editor controls for normal labels/headings unless a real export proves the specific pattern.

## Default Static Text

```json
{
  "type": "heading",
  "label": "Text",
  "attrs": {
    "headc": {
      "title": {
        "value": "Section heading",
        "variable": null
      }
    },
    "common": {
      "positioning": {
        "widthtype": [null, "2"]
      }
    },
    "heads": {
      "ty": [null, "h5-medium"],
      "color": "var(--c--text)"
    }
  },
  "nv_label": "Section heading"
}
```

## Width

Default:

- `attrs.common.positioning.widthtype = [null, "2"]`

Use full width only for intentional long paragraph text, empty states, or page-level content blocks where inline text would harm layout.

## Presets

Recommended generated presets:

| Pattern | Typography | Color |
| --- | --- | --- |
| Page title | `[null, "h4-medium"]` when proven or `[null, "h5-medium"]` fallback | `var(--c--text)` |
| Section heading | `[null, "h5-medium"]` | `var(--c--text)` |
| Card title | `[null, "h5-medium"]` | `var(--c--text)` |
| Metric value | `[null, "h5-medium"]` | `var(--c--text)` |
| Metric label | `[null, "xs-medium"]` | `var(--c--neutral-dark-hover)` |
| Eyebrow text | `[null, "xs-medium"]` | inherited or token string |
| Helper text | `[null, "xs-medium"]` or body fallback | `var(--c--neutral-dark-hover)` |

When generating white text on a colored/gradient header, prefer container-level text color inheritance where the container pattern is proven. If setting text color directly, still use a plain string color value.

## Custom Typography

Custom typography uses an object under `attrs.heads.ty`:

```json
{
  "fam": "Default",
  "size": [null, 16],
  "wei": "500",
  "tf": "0",
  "sty": "0",
  "dec": "0",
  "lh": [null, 24],
  "ls": [null, 0]
}
```

Use this only when an export-backed design requires explicit font properties.

## Dynamic Text

Dynamic text remains a Text control with `attrs.headc.title.variable[]`.

Static content and dynamic content should not use different style shapes. Keep the same `common.positioning`, `heads.ty`, and `heads.color` rules.

## Migration Rule

When replacing old generated Text controls:

1. Keep the existing `id` only when patching an already-imported/exported design; use fresh UUIDs for newly generated packages.
2. Preserve `headc.title.value` or `headc.title.variable`.
3. Convert `heads.ty` to `[null, token]` for named presets.
4. Convert `heads.color` to a plain string.
5. Keep or add inline width unless the text is intentionally full row.
6. Keep meaningful `nv_label`.

## Do Not Generate

Avoid these old shapes for new packages:

```json
"heads": {
  "ty": "h5-bold",
  "color": [null, "var(--c--text)"]
}
```

```json
"heads": {
  "ty": [null, "h5-bold"],
  "color": [null, "var(--c--text)"]
}
```

Both can render visually in some cases, but the focused Text Style Sample export shows the safer editor-compatible shape uses a plain string color.
