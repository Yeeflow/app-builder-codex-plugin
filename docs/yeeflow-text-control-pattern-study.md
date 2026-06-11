# Yeeflow Text Control Pattern Study

Source studied: `/Users/Renger/Downloads/Text Style Sample.ywf`

Generated study artifacts:

- `text-style-sample-decoded-def.json`
- `text-style-sample-text-controls-inspection.json`
- `text-style-sample-text-controls-inspection.md`

## What The Export Proves

The native Yeeflow Text control is exported as:

```json
{
  "type": "heading",
  "label": "Text"
}
```

The sample contains 15 working Text controls:

- 3 named typography preset controls
- 5 custom typography object controls
- 1 text-shadow control
- 4 dynamic expression text controls
- 2 dynamic linked text controls

## Standard Static Text Shape

Generated static Text controls should use this export-backed shape:

```json
{
  "type": "heading",
  "label": "Text",
  "attrs": {
    "headc": {
      "title": {
        "value": "Workflow route",
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
  "nv_label": "Workflow route heading"
}
```

Important details:

- `attrs.common.positioning.widthtype = [null, "2"]` means inline width.
- `attrs.heads.ty` uses `[null, "<preset>"]` for named typography tokens.
- `attrs.heads.color` is a plain string, not `[null, "..."]`.
- `attrs.headc.title.value` stores static text content.
- `attrs.headc.title.variable[]` stores dynamic text expressions.

## Typography Patterns

Named presets observed:

- `xs-medium`
- `h5-medium`

Custom typography object shape:

```json
{
  "fam": "Tahoma",
  "size": [null, 14],
  "wei": "300",
  "tf": "1",
  "sty": "1",
  "dec": "1",
  "lh": [null, 12],
  "ls": [null, 2]
}
```

Text shadow shape:

```json
{
  "color": "rgba(128, 128, 128, 0.6)",
  "x": 0,
  "y": 1,
  "blur": 3
}
```

## Dynamic Text

Dynamic Text content lives in `attrs.headc.title.variable[]`.

Single workflow variable:

```json
{
  "exprType": "variable",
  "valueType": "text",
  "id": "field_1",
  "type": "expr",
  "name": "Workflow Variables:field1"
}
```

Concatenation uses `{"type": "op", "op": "&"}` between expression items.

Text length is stored as:

```json
"text-len": [null, 200]
```

Links live under `attrs.headc.link` and may use either a plain URL or a variable expression.

## Root Cause Of The CAPEX Text Issue

The broken generated CAPEX Text controls used a mixed style shape:

- `attrs.heads.ty` as a plain string in the latest attempt
- `attrs.heads.color` as `[null, "var(--c--text)"]`

That shape rendered visually but left the Yeeflow designer Typography and Text shadow editors unresponsive.

The authoritative `Text Style Sample.ywf` shows the safe generated standard:

- `attrs.heads.ty = [null, "h5-medium"]` for presets
- `attrs.heads.color = "var(--c--text")`
- `attrs.common.positioning.widthtype = [null, "2"]`

## Generator Rules

Use these defaults for generated Yeeflow apps:

- Generate static labels, headings, metric values, helper text, badges, and card titles as `type: "heading"` / `label: "Text"`.
- Use inline width by default.
- Use full width only when the text is intentionally a paragraph block or the parent layout requires it.
- Use `h5-medium` for section headings and panel headings unless a stronger heading level is needed.
- Use `xs-medium` or a small preset for eyebrow/metric labels.
- Use a custom typography object only when an export-backed design requires custom font, size, weight, line height, letter spacing, or shadow.
- Store colors as strings, preferably Yeeflow tokens such as `var(--c--text)` and `var(--c--neutral-dark-hover)`.
- Keep meaningful `nv_label` values such as `Status metric value`, `Workflow route heading`, or `Section subtitle`.

## Validator Rules

Validators should warn when generated Text controls:

- lack inline width without an explicit full-width reason
- use `attrs.heads.ty` as a plain string
- use `attrs.heads.color` as a config pair
- lack meaningful `nv_label`
- use old generated text style shapes from prior CAPEX attempts

Warnings are appropriate because existing real exports may contain legacy or manually edited variations, but new generated packages should follow the sample-backed standard.
