# Generated Dashboard UI Quality Gates

Generated dashboard-heavy applications must report dashboard UI validation separately from signing and API acceptance.

## Dashboard Grid-Table Collection Gate

For dashboard record-list sections that claim the grid-table Collection pattern:

- Use `collection`, not dashboard `data-list`, unless Data table is explicitly requested.
- Pair each Collection with a header `flex_grid`.
- Wrap the header `flex_grid` and Collection in one container.
- Serialize both `attrs.container.gap = 0` and `attrs.style.gap = [null, 0]`.
- When row-click detail is planned, set `attrs.data.link`, `attrs.data.opentype = "slide"`, and `attrs.data.modalsize = 2`.
- Ensure the detail link resolves to a Type `1` custom detail layout for the same data list.
- Hide duplicate dashboard headers with `attrs.hideHeaderAll = true` when the app shell/navigation provides context.
- Use visible dashboard title styling, such as `attrs.heads.ty = [null, "h5-medium"]`.
- Include Text control designer/runtime style metadata.
- Keep internal helper metadata out of encoded package objects.
- Emit Type `1` custom detail layout `LayoutView` as a schema-compatible value such as an empty string, not `null`.

## Report Requirements

Dashboard-heavy generated-final YAPK reports must include:

- dashboard grid-table Collection validation
- wrapper gap validation
- detail layout link validation
- dashboard header visibility validation
- dashboard title/text style validation
- schema helper-leak validation
- runtime/designer visual proof boundary
- API signing and install acceptance as separate proof

## Proof Boundary

`setsign`, `verifysign`, and package install acceptance do not prove dashboard runtime or designer quality. Runtime/designer proof remains separate and requires opening the dashboard, inspecting the grid-table section, clicking rows when detail behavior is planned, and confirming navigation refresh still renders the page.


Dashboard/app page root content-area padding is a hard gate: every generated or upgraded Type 103 dashboard/app page must serialize `Pages[].LayoutInResources[].Resource` with root `attrs.container.cw = "2"` and `attrs.container.padding = [null, { top: "--sp--s0", right: "--sp--s0", bottom: "--sp--s0", left: "--sp--s0" }]`. Scalar padding, object/numeric padding, numeric array padding, `attrs.common.padding`, or `attrs.style.padding` alone are invalid for the root content area. Normalize existing dashboard/app page roots to this exact token-array shape before signing, installing, importing, or upgrading. Inner layout containers may keep intentional spacing.

Data-list custom form root content-area padding uses the same hard gate: every generated or upgraded New, Edit, View, Detail, or custom form under `Data.Childs[].Layouts[].LayoutInResources[].Resource` or `Childs[].Layouts[].LayoutInResources[].Resource` must parse to a root with `attrs.container.cw = "2"` and the same `--sp--s0` token-array padding. Scalar zero, numeric object zero, `attrs.common.padding`, or `attrs.style.padding` alone remain compatibility fallbacks only and do not satisfy generated-final validation. Inner form sections, cards, grids, controls, and content wrappers may keep intentional spacing.
