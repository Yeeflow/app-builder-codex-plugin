# Yeeflow Dashboard Design Standards

Generated dashboards should be useful operational pages, not landing-page artwork.

## Required Shell

Use:

- Type `103` app page
- `attrs.hideHeaderAll = true`
- dashboard/app page root content width and padding:
  - `attrs.container.cw = "2"`
  - `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`
- page-level background on embedded page `attrs.background` when a full-page background is needed
- `Main` -> `Content`
- meaningful `nv_label` values

Supplier Onboarding & Risk Review runtime/designer evidence proves this exact root token-array shape. It is mandatory for every generated or upgraded dashboard/app page and must not be overridden by app requirements, layout style, design image, prompt wording, or later UI tuning. Scalar padding, numeric padding, object padding such as `{ "1": { top: 0, right: 0, bottom: 0, left: 0 } }`, `attrs.common.padding`, and `attrs.style.padding` do not satisfy the dashboard/app page root content-area gate. Inner layout containers may keep intentional spacing.

`Main` is structural. Do not set full-page background color on `Main.attrs.common.background`; use the page-level background instead. Section, card, header, KPI, Collection, and content-area backgrounds are allowed on their own containers.

## Default Structure

```text
Main
└─ Content
   ├─ Page header
   ├─ Summary section
   ├─ Body section
   └─ Collection section or Empty state
```

`Page header` should explain the current page in concise business language. `Summary section` should show KPI/status cards. `Body section` should hold tables, Collections, charts, or operational shortcuts.

## Visual Style

Use:

- neutral page background
- white or token background cards
- subtle neutral borders
- limited soft shadow
- clear spacing rhythm
- primary blue only for active actions, selected states, and main calls to action

Avoid broad gradients, decorative graphics, and oversized hero composition unless the user explicitly asks for a marketing page.

## KPI And Status Cards

Use semantic colors:

- primary for total/current focus
- success for completed/approved
- warning for pending/attention
- danger for overdue/rejected/failed
- neutral for draft/inactive/reference

Cards should have concise labels, a clear value, and optional helper metadata. Avoid filler metrics.

## Collection Presentation

Use Collection controls for repeated list-style data when source lists are local and proven. For table-like dashboard record lists, prefer the grid-table Collection pattern over dashboard `data-list` unless the user explicitly requests Data table.

Recommended names:

- `Collection section`
- `Collection`
- `Collection item`
- `Table header`
- `Table row`
- `Status badge`

For table-style Collections, keep visible captions off on layout-only grids and rely on `nv_label` for designer readability.

Grid-table Collections must be paired with a header `flex_grid` inside one wrapper container. The wrapper must set both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`. Planned row-click slide detail requires `attrs.data.link`, `attrs.data.opentype = "slide"`, `attrs.data.modalsize = 2`, and a concrete Type `1` custom detail layout for the source list. Helper-only metadata must not leak into encoded package objects.

## Empty States

Use business-friendly copy:

- state what is empty
- say what the user can do next
- avoid technical wording

Example: `No requests yet. Submitted requests will appear here after the workflow starts.`

## Validator Guidance

Fail when dashboards are missing hidden header or the exact root content-area shape `attrs.container.cw = "2"` plus token-array zero padding with `--sp--s0` on all sides. Warn for missing page-level background when `Main` has a background, missing `Main`, missing `Content`, missing meaningful `nv_label`, or many arbitrary hard-coded colors. Warn when `Main` carries a full-page-like background because generated dashboards should put full-page background on embedded page attrs.

Dashboard Text controls should follow the shared Yeeflow Text control standard in `docs/yeeflow-text-control-generation-standards.md`: native `heading` controls, inline width by default, typography presets as `[null, token]`, and `heads.color` as a plain string. Dashboard page titles should use a visible title token such as `attrs.heads.ty = [null, "h5-medium"]` unless another validated style is intentionally planned. Do not reuse the old CAPEX generated text style shape with pair-shaped color values.

## Form Actions Boundary

Approval-form exports prove native form actions for page load, button click, temp variables, Set variable, Confirm dialog, Query data, Submit form, and Save changes. Dashboard pages may share some front-end action concepts in later phases, but Submit form steps are not supported on dashboards.

For generated dashboards:

- do not generate Submit form or Save changes steps
- do not rely on approval-form wrapper shapes for dashboard action generation without a dashboard export
- continue to use page-level dashboard background, not Main background
- keep action-like buttons inline width with meaningful `nv_label`

## Runtime-Proven Generation Notes

The first Design System Request Tracker runtime package proved that a generated Type `103` dashboard with embedded page JSON should store `LayoutInResources[0].ID` and `LayoutInResources[0].RefId` as the dashboard `LayoutID` when the page resource is the runtime dashboard body. A separate resource ID imported successfully but rendered the dashboard as an empty designer placeholder. Use the dashboard `LayoutID` for the embedded resource unless a later export proves a safer split-resource pattern.

Keep `LayoutView = null`, `Ext2 = "{\"src\":true}"`, and `LayoutInResources[0].Resource` as the serialized page JSON. Before signing, installing, importing, upgrading, or handing off generated packages, parse each `Pages[].LayoutInResources[].Resource` JSON string and normalize the root object to `attrs.container.cw = "2"` plus `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. The runtime-proven shell also uses embedded `attrs.hideHeaderAll = true` and `Main` -> `Content`.
