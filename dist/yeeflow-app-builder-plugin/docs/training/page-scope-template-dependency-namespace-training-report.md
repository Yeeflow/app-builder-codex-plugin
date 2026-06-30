# Page-Scope Template Dependency Namespace Training Report

## Problem

Golden reference templates are intentionally reusable and may contain generic page-level dependency names such as `filter_keywords`, selected-item temp variables, and form action names. When a generated page combines a page-layout template with one or more component templates, those generic names can collide inside the same runtime page/form scope.

The observed case is a master-detail Dashboard page whose Two-Panel or Three-Panel Workspace layout contains a Search filter using `filter_keywords`, while an inserted Collection template also contains a Search filter using `filter_keywords`. Both filters then produce the same page-level filter variable even though they are meant to drive different Collections. The same collision pattern can occur for `tempVars`, `actions`, and `formAction` names.

## Rule

Template source files may keep readable canonical dependency names. Generated resources must not merge those names directly into a page/form. Every cloned template instance must receive a page-and-region-specific namespace before dependencies are merged into the host resource.

The rule applies to:

- Dashboard pages, including `dashboard-page-layouts-v1.1`, `dashboard-page-layouts-workbench`, `dashboard-page-layouts-two-panel-workspace`, and `dashboard-page-layouts-three-panel-workspace`.
- Custom Data List forms, including New/Edit, View Item, and Workbench Item Details forms.
- Approval form submission pages, task pages, print pages, Data List workflow task pages, and Schedule workflow task pages.

## Required Generation Behavior

For each cloned component template instance:

- Rename template-owned `filterVars[]` with a stable page/region prefix.
- Rename template-owned `tempVars[]` with a stable page/region prefix.
- Rename template-owned `actions[]` and `formAction` entries with a stable page/region prefix.
- Rewrite all in-template references to those renamed dependencies, including `__filter_<name>`, `__temp_<name>`, `attrs.control_action`, Collection `attrs.data.fulltext[]`, Collection `attrs.data.filter[]`, Data Table filters, chart/pivot conditions, and form action hooks.
- Do not rename host page-layout contract variables that are intentionally shared by the selected layout. For example, master-detail workspace pages must preserve the shell-level `vCurrentItemID` contract used by `left_panel_data_items_wrapper` and `current_item_wrapper`.
- Do not rename business filters supplied by the App Plan after they have already been wired into a consumer. Namespace the cloned template's own dependencies before external App Plan bindings are applied.

## Hard Gate

Generated-final preflight must fail when a single page/form scope contains:

- Duplicate `filterVars[]` names.
- Duplicate `tempVars[]` names.
- Duplicate `actions[]` names.
- Duplicate `formAction` names.
- Multiple value-producing Data Filter/Search controls bound to the same filter variable unless they are explicitly the same control instance.

The focused validator is:

```bash
node scripts/validate-page-scope-template-dependencies.mjs --package <generated-final.yapk> --json
```

The focused regression suite is:

```bash
node scripts/test-page-scope-template-dependency-gates.mjs
```

The validator is also included in `scripts/yapk-first-generation-preflight.mjs` as the `page-scope-template-dependencies` gate.

## Expected Outcome

Combining page-layout templates and component templates must be safe by default. A page may contain multiple Search filters, selected-item toolbars, or form actions from different template instances, but their runtime variables and actions must be unique and must resolve only to their intended consumers.
