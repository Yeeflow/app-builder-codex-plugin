# Yeeflow Form Design Quality Rules

Use these rules for generated Yeeflow approval forms, custom list forms, and dashboard pages when a richer native UI is needed.

These rules are based on the manually improved `IT Hardware CAPEX Request Runtime V2.yap` export and should be applied as warning-first generator standards until more app types prove the same patterns.

## Page Background

- Put full-page approval form backgrounds on `page.formdef.attrs.background`.
- Put full-page data-list custom form backgrounds on the custom form `attrs.background`.
- Put full-page dashboard backgrounds on embedded dashboard page `attrs.background`.
- Keep `Main` as a structural wrapper.
- Do not set full-page background on `Main.attrs.common.background`.
- `Content` may carry padding and a neutral surface, but should not be the only source of the full-page background.

## Standard Shell

Approval form pages should use:

- `attrs.container.cw = "2"`
- zero page padding with `--sp--s0`
- `Main`
- `Content`
- `Form body`
- `Form bottom`

Submission forms that include a request summary should also use:

- `Form header`
- `Request summary panel`
- `Request metric row`

## Form Header

Use a dedicated `Form header` container for the top visual area.

Recommended properties:

- `attrs.style.overflow = [null, "hidden"]`
- `attrs.common.background.normal`
- `attrs.common.border.normal.type = "1"`
- `attrs.common.border.normal.width = [null, { top: 1, right: 1, bottom: 1, left: 1 }]`
- `attrs.common.border.normal.radius = [null, { top: 12, right: 12, bottom: 12, left: 12 }]`

## Request Summary Panel

Use native background first. When a gradient is required, use:

```css
selector
{
    background-image: linear-gradient(to right, <start> 0%, <end> 100%) !important;
}
```

Store it at:

- `attrs.common.css`

Set inherited text color on the container when useful:

- `attrs.common.ty.normal.color`

## Metric Row

Use:

- row container: `Request metric row`
- child containers: `Status metric`, `Cost metric`, `Owner metric`, `Next step metric`
- row direction: `attrs.style.direction = [null, "row"]`
- row gap: `--sp--s200`
- metric card padding: `--sp--s300`
- metric card background: `var(--c--neutral-light)` or `var(--c--background)`
- metric border: `var(--c--neutral-light-active)`
- metric radius: `8`

Metric labels and values should be `heading` controls with inline width.

## Text Controls

Generated `heading` and `text-editor` controls should default to:

- meaningful `nv_label`
- `attrs.common.positioning.widthtype = [null, "2"]`
- zero padding for helper/description text
- tokenized typography when the visual hierarchy matters

Use the focused `Text Style Sample.ywf` export as the source of truth for generated Text controls. The native Text control is `type: "heading"` with `label: "Text"`.

```json
{
  "headc": { "title": { "value": "Workflow route", "variable": null } },
  "heads": {
    "ty": [null, "h5-medium"],
    "color": "var(--c--text)"
  },
  "common": { "positioning": { "widthtype": [null, "2"] } }
}
```

Observed safe heading tokens:
- `attrs.heads.ty = [null, "h5-medium"]` for section headings, card titles, and metric values
- `attrs.heads.ty = [null, "xs-medium"]` for labels and eyebrow text
- custom typography objects under `attrs.heads.ty` only when explicitly export-backed

Text Style Sample correction:
- `attrs.heads.ty` should be a config pair such as `[null, "h5-medium"]` for named presets, or an explicit typography object.
- `attrs.heads.color` should be a plain string such as `"var(--c--text)"`, not `[null, "var(--c--text)"]`.
- The prior CAPEX attempts rendered visually but left Typography/Text shadow editors unresponsive because they mixed unsupported generated style shapes.

Use helper text pattern:

```json
{
  "ty": { "size": [null, 14] },
  "color": "var(--c--neutral-dark-hover)"
}
```

## Icon Badges

Section icons should be wrapped in square containers.

Wrapper rules:

- width type fixed: `attrs.style.widthtype = [null, "3"]`
- width and height use the same pixel value
- center children horizontally and vertically
- use token background such as `var(--c--primary-light)`
- use rounded corners

Icon rules:

- set icon width inline: `attrs.common.positioning.widthtype = [null, "2"]`
- set icon size to about half the wrapper width
- use token foreground color such as `var(--c--primary)`

## Field Grids

Default field sections should use `flex_grid`.

Recommended grid:

- desktop/tablet: two `1fr` columns
- mobile: one `1fr` column
- row size: auto
- column gap: `10px` or a token-equivalent if supported
- display caption: off, represented as `displayLabel = [null, false]`

Generated layout-only `Grid`/`flex_grid` controls must keep captions off by default. Only generate a visible grid caption when the user explicitly asks for a titled grid or a real export requires that title. Route summaries, KPI/status chips, and horizontal information blocks should use container/card blocks with spacing/gap rather than captioned grids.

Long controls should be full row:

- textarea
- richtext
- list/sublist
- large upload areas
- long helper text

Until column-span behavior is export-proven, place long controls outside the two-column grid below the grid.

Submission approval forms should focus on submitter inputs and business context. Do not show internal approval routing, budget owner, finance approver, decision notes, or reviewer-only routing details on the submit page unless the user requests them. Task pages may show reviewer decision sections and routing context.

## Runtime-Sensitive Controls

The following controls are schema-supported but runtime-sensitive:

- `location-picker`
- `organization-picker` / department picker
- `cost-center-picker`
- `metadata`
- `mutiple-metadata`
- `icon-upload`
- file/image controls when missing export-backed attrs

V2 showed repaired pickers with minimal attrs:

- `location-picker`: empty `attrs`
- `cost-center-picker`: empty `attrs`
- `icon-upload`: `attrs.controlmultiple = true`
- `file-upload`: `attrs.ver = 1`

Generation rule:

- Use fallback controls unless the user explicitly wants native runtime-sensitive controls.
- If native controls are used, follow the studied export shape and warn that environment metadata may still be needed.

## Calculated Fields

Detect calculated intent from names and descriptions:

- Subtotal
- Total
- Amount
- Balance
- Difference
- Duration
- Cost derived from quantity and price

Do not generate editable controls for these fields unless the requirement clearly says users enter the value.

Export-proven pattern:

- control type: `calculated`
- formula array at `attrs.calculated`
- variables referenced as `{ exprType: "variable", valueType: "number", id, type: "expr", name }`
- operator object such as `{ type: "op", op: "*" }`

CAPEX baseline:

- `Subtotal = Quantity * Unit Price`
- total estimated cost should aggregate subtotals when line items are introduced

## Validator Policy

Use warnings first for design-quality findings:

- missing page-level background
- background on `Main`
- missing `Form header`
- `Form header` without overflow/background/radius
- text/icon controls without inline width
- field sections without a `flex_grid`
- grids not using two desktop columns

## Action Buttons

The Form Actions Phase 1 export proves native `action_button` controls as a reusable form UI pattern.

Default generated action buttons should use:

- `type: "action_button"`
- `attrs.common.positioning.widthtype = [null, "2"]`
- meaningful visible label
- meaningful `nv_label`
- `attrs["button-style"]` chosen by purpose

Observed style codes:

- `"2"`: primary action
- `"3"`: soft secondary action
- `"4"`: outline primary/save action
- `"5"`: neutral outline/verify action
- `"6"`: dashed utility action such as import, add, or next

For icon buttons, use export-backed Font Awesome values such as `fa-regular fa-plus` and `fa-regular fa-arrow-right`, with `attrs["icon-type"] = "3"` and `attrs["icon-posi"]` set to `1` for before-text or `2` for after-text.
- runtime-sensitive controls using unproven attrs
- calculated-looking fields generated as editable inputs

Escalate to errors only after focused runtime testing proves a shape breaks import or runtime behavior.
