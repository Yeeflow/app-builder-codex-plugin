# Data List Custom Form LayoutView Runtime Source Standard

## Purpose

Generated Type `1` custom Data List forms must load in Yeeflow runtime and Designer without a manual repair. Runtime and Designer read the custom form JSON from `Layouts[].LayoutView`, while export/package surfaces also carry the same JSON in `Layouts[].LayoutInResources[0].Resource`.

## Required Contract

For every generated Type `1` custom form layout on a Data List or Document Library:

- `Layout.LayoutView` must be a JSON string containing the complete rendered form resource.
- `Layout.LayoutInResources[0].Resource` must be a JSON string containing the same complete rendered form resource.
- `Layout.LayoutView` and `LayoutInResources[0].Resource` must be semantically equivalent after stable JSON normalization.
- The rendered form resource must contain the actual form tree, including `children`, the selected Data List Form Layouts v1.1 template provenance, and business field controls.
- New/Edit forms must use `data_list_form_layout_new_edit_v1_1`.
- View forms must use `data_list_form_layout_view_item_v1_1`.

## Forbidden Patterns

The following are signing-readiness blockers:

- `Layout.LayoutView` is `null`, empty, omitted, malformed, or a placeholder.
- `Layout.LayoutView` contains a minimal handoff object such as `source: "minimal-resource-graph"`.
- `Layout.LayoutView` and `LayoutInResources[0].Resource` drift.
- `LayoutInResources[0].Resource` is complete but `Layout.LayoutView` is only a shell.
- The generated package relies on Designer publish to repair an incomplete `LayoutView`.

## Proof Boundary

Package generation, signing, API upgrade acceptance, and Version Management submission do not prove custom form runtime loading. Generated-final validation must catch incomplete custom form runtime sources before signing. Browser proof remains a separate stage after install or upgrade.
