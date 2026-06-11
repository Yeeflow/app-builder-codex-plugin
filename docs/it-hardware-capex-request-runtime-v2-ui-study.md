# IT Hardware CAPEX Request Runtime V2 UI Study

Source studied read-only:

- `/Users/Renger/Downloads/IT Hardware CAPEX Request Runtime V2.yap`

Comparison target:

- `it-hardware-capex-request-approval-form-def.v2.json`

This export is the manually improved version of the generated IT Hardware CAPEX Request app. The submission form was changed in Yeeflow and exported back. The V2 export should now be treated as the current UI-quality evidence for generated Yeeflow approval forms.

## Export Shape

- Wrapper file type: JSON data.
- Resource payload: compressed `Resource` with `[______gizp______]` prefix.
- Decoded form: `IT Hardware CAPEX Request`.
- `Data.Forms[].ListID = 0`.
- Submission page: `IT Hardware CAPEX Request Form`, `type = 1`.
- Task page: `IT Hardware CAPEX Request Task`, `type = 2`.

Large numeric IDs were preserved as source values during study. No raw export is bundled in this repo or skills.

## Page Background

Manual V2 adds page-level background to the submission form:

```json
{
  "formdef": {
    "attrs": {
      "container": {
        "cw": "2",
        "padding": [null, {
          "top": "--sp--s0",
          "right": "--sp--s0",
          "bottom": "--sp--s0",
          "left": "--sp--s0"
        }]
      },
      "background": {
        "type": "classic",
        "classic": {
          "color": "var(--c--neutral-light)"
        }
      }
    }
  }
}
```

Generation rule:

- Put full-page form background on `page.formdef.attrs.background`.
- Keep `Main` primarily structural.
- Avoid using `Main.attrs.common.background` for the full-page background.
- `Content` may still carry neutral background and padding when it is acting as the page content surface.

## Form Header

Manual V2 inserts a distinct `Form header` container inside `Form body`. The generated v2 form placed `Request summary panel` directly under `Form body`.

Manual V2 `Form header` pattern:

```json
{
  "type": "container",
  "nv_label": "Form header",
  "attrs": {
    "style": {
      "gap": [null, "--sp--s0"],
      "overflow": [null, "hidden"]
    },
    "common": {
      "background": {
        "normal": {
          "type": "classic",
          "classic": { "color": "#ffffff" }
        }
      },
      "border": {
        "normal": {
          "type": "1",
          "width": [null, { "top": 1, "right": 1, "bottom": 1, "left": 1 }],
          "color": "#e7e9eb",
          "radius": [null, { "top": 12, "right": 12, "bottom": 12, "left": 12 }]
        }
      }
    }
  }
}
```

Generation rule:

- Wrap the request summary and metric row in `Form header`.
- Use `attrs.style.overflow = [null, "hidden"]` when rounded corners and nested visual panels are used.
- Give `Form header` its own background, border, and radius.

## Request Summary Panel And Custom CSS

Manual V2 uses custom CSS on `Request summary panel`:

```json
{
  "nv_label": "Request summary panel",
  "attrs": {
    "common": {
      "css": "selector\n{\n    background-image: linear-gradient(to right, oklch(0.546 0.245 262.881) 0%, oklch(0.541 0.281 293.009) 100%) !important;\n}",
      "ty": {
        "normal": {
          "color": "var(--c--background)"
        }
      }
    }
  }
}
```

Generation rule:

- Use native background/border/radius first.
- When the design requires a gradient and Yeeflow native background settings do not support it, set `attrs.common.css` on the target container.
- Use the `selector { ... }` CSS shape shown above.
- Set container text color intentionally through `attrs.common.ty.normal.color`; child headings/text can inherit unless they require local overrides.

## Request Metric Row

Manual V2 keeps `Request metric row` as a row container and styles child metric cards.

Row:

- `nv_label = "Request metric row"`
- `type = "container"`
- `attrs.style.direction = [null, "row"]`
- `attrs.style.gap = [null, "--sp--s200"]`
- `attrs.common.padding = [null, { top/right/bottom/left: "--sp--s250" }]`

Metric card:

- `type = "container"`
- `nv_label` examples: `Status metric`, `Cost metric`, `Owner metric`, `Next step metric`
- `attrs.style.direction = [null, "column"]`
- `attrs.style.gap = [null, "--sp--s050"]`
- `attrs.common.padding = --sp--s300` on all sides
- `attrs.common.background.normal.classic.color = "var(--c--neutral-light)"`
- `attrs.common.border.normal.type = "1"`
- `attrs.common.border.normal.color = "var(--c--neutral-light-active)"`
- `attrs.common.border.normal.radius = 8` on all corners

Metric labels/values are `heading` controls. After studying `Text Style Sample.ywf`, generated metric text should use:

- label: `attrs.heads.ty = [null, "xs-medium"]`
- value: `attrs.heads.ty = [null, "h5-medium"]`
- color: plain string token such as `attrs.heads.color = "var(--c--text)"`
- both use `attrs.common.positioning.widthtype = [null, "2"]`

## Text Control Quality

Manual V2 corrected generated text controls by adding explicit width/typography style.

Corrected heading:

```json
{
  "type": "heading",
  "nv_label": "Applicant Information heading",
  "attrs": {
    "heads": {
      "ty": [null, "h5-medium"],
      "color": "var(--c--text)"
    },
    "common": { "positioning": { "widthtype": [null, "2"] } }
  }
}
```

Corrected descriptive text:

```json
{
  "type": "text-editor",
  "nv_label": "Applicant Information description",
  "attrs": {
    "common": {
      "padding": [null, {
        "top": "--sp--s0",
        "right": "--sp--s0",
        "bottom": "--sp--s0",
        "left": "--sp--s0"
      }],
      "positioning": { "widthtype": [null, "2"] }
    },
    "ty": { "size": [null, 14] },
    "color": "var(--c--neutral-dark-hover)"
  }
}
```

Generation rule:

- Generated `heading` and `text-editor` controls should default to `attrs.common.positioning.widthtype = [null, "2"]`.
- Use `Text Style Sample.ywf` as the focused Text control source of truth: `attrs.heads.ty = [null, "h5-medium"]` for named presets, `attrs.heads.color = "var(--c--text)"` as a plain string, and `attrs.common.positioning.widthtype = [null, "2"]`.
- Dynamic Text controls use the same native `heading` control with `attrs.headc.title.variable[]`; links live under `attrs.headc.link`.
- Old generated shapes with `attrs.heads.color = [null, "var(--c--text)"]` should be replaced because they can leave Yeeflow designer style popups unresponsive.
- Generated visual Text/heading controls should use native-like UUID IDs where safe, not generator-specific `ctrl-*` IDs, because the manually added working controls use plain UUIDs and export back with the full style shape intact.
- Keep helper/description text padding at zero.
- Use meaningful `nv_label` values for every generated heading and helper text.

## Icon Badge Pattern

Manual V2 wraps section icons in a square container.

Wrapper:

```json
{
  "type": "container",
  "attrs": {
    "style": {
      "widthtype": [null, "3"],
      "width": [null, 46],
      "height": [null, "2"],
      "cushei": [null, 46],
      "align_items": [null, "center"],
      "justify_content": [null, "center"],
      "gap": [null, "--sp--s0"]
    },
    "common": {
      "border": {
        "normal": {
          "radius": [null, { "top": 16, "right": 16, "bottom": 16, "left": 16 }]
        }
      },
      "background": {
        "normal": {
          "type": "classic",
          "classic": { "color": "var(--c--primary-light)" }
        }
      }
    }
  }
}
```

Icon:

```json
{
  "type": "icon",
  "attrs": {
    "icon": {
      "icon": "fa-regular fa-file-lines",
      "size": [null, 16],
      "normal": { "pcolor": "var(--c--primary)" }
    },
    "common": {
      "positioning": { "widthtype": [null, "2"] }
    }
  }
}
```

Generation rule:

- Use square icon containers for section badges.
- Set container width and height to the same px value.
- Center children with `align_items` and `justify_content`.
- Set icon width inline.
- Icon size should be roughly half the wrapper width.

## Field Grid Layout

Manual V2 moves normal field controls into `flex_grid` containers.

Standard grid:

```json
{
  "type": "flex_grid",
  "label": "Grid",
  "attrs": {
    "ver": 1,
    "columns": {
      "1": { "list": [{ "value": 1, "unit": "fr" }, { "value": 1, "unit": "fr" }], "last": { "value": 1, "unit": "fr" } },
      "2": { "list": [{ "value": 1, "unit": "fr" }, { "value": 1, "unit": "fr" }], "last": { "value": 1, "unit": "fr" } },
      "3": { "list": [{ "value": 1, "unit": "fr" }], "last": { "value": 1, "unit": "fr" } }
    },
    "rows": { "1": { "list": [{ "unit": "auto" }], "last": { "unit": "auto" } } },
    "cgap": { "1": 10 },
    "cgapU": { "1": "px" }
  }
}
```

Generation rule:

- Standard form field sections use a `flex_grid`.
- Use two desktop/tablet columns and one mobile column.
- Set `displayLabel = [null, false]` on generated `flex_grid` layout controls so the grid caption is not displayed.
- Put normal controls in the grid.
- Place textarea, rich text, list/sublist, and long helper content outside the two-column grid or make them span the full row once column-span export evidence is available.

## Repaired Runtime-Sensitive Controls

Manual V2 replaced several generated controls by re-adding native Yeeflow controls.

Observed repaired patterns:

| Control | Generated v2 | Manual V2 |
| --- | --- | --- |
| Location | `location-picker` with `attrs.required` and `attrs.placeholder` | `location-picker` with empty `attrs` and a new generated binding such as `LocationID` / `delivery_location2` |
| Cost center | `cost-center-picker` with `attrs.required` and `attrs.placeholder` | `cost-center-picker` with empty `attrs` and new binding `field_81` |
| Icon upload / image | `icon-upload` with `attrs.maxCount` | `icon-upload` with `attrs.controlmultiple = true` and new binding `supporting_images2` |
| File upload | no `attrs.ver` | `file-upload` with `attrs.ver = 1` |

Generation rule:

- Treat location, department/organization, cost center, metadata, and image/icon upload as runtime-sensitive until more focused export/import tests prove stable generated shapes.
- Prefer fallback text fields when production-like reliability matters.
- If native controls are explicitly requested, use the minimal exported-back shape and document that environment metadata may still be needed.

## Calculated Field

Manual V2 replaced the editable Subtotal input with a native calculated control:

```json
{
  "type": "calculated",
  "label": "Sub total",
  "binding": "subtotal",
  "attrs": {
    "calculated": [
      {
        "exprType": "variable",
        "valueType": "number",
        "id": "quantity",
        "type": "expr",
        "name": "Workflow Variables:Quantity"
      },
      { "type": "op", "op": "*" },
      {
        "exprType": "variable",
        "valueType": "number",
        "id": "unit_price",
        "type": "expr",
        "name": "Workflow Variables:Unit Price"
      }
    ]
  }
}
```

Generation rule:

- `Subtotal = Quantity * Unit Price`.
- Fields named `Subtotal`, `Total`, `Amount`, `Balance`, `Difference`, or `Duration` should be reviewed for calculation intent.
- Do not generate editable input controls for calculated-looking fields without a documented reason.
- If a safe Yeeflow calculated expression cannot be built, generate readonly display and document calculation deferred.

## Root-Cause Classification

Bug/risk fixes:

- Full-page background was missing at page level.
- Request summary lacked a wrapper `Form header`.
- Text controls lacked enough positioning/typography information for consistent rendering.
- Normal fields were placed directly in field containers instead of grids.
- Some runtime-sensitive controls used generated attrs that did not match the manually re-added controls.
- `Subtotal` was editable instead of calculated.

Design improvements:

- Gradient request summary through `attrs.common.css`.
- Metric row inside header, with clear card treatments.
- Square icon badges.
- Better text hierarchy and section grouping.

Known gaps:

- Column span property for long controls inside `flex_grid` still needs a focused export if the generator wants to place them inside the grid.
- Department/organization and metadata controls were not present in this V2 export, so they remain runtime-sensitive and should fall back or require focused proof.
