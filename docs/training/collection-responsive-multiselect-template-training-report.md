# Collection Responsive Multi-Select Template Training

## Scope

The live Dashboard `All Tasks - multiple select (new)` from `Projects Center_1` is now trained as the golden reference `collection_control_responsive_multiple_select`.

This is a complete page-slice template, not a Collection-only snippet. The source root is `grid_table_col_multiselect_wrapper` and the source Collection is `grid_table_col_body`.

## Included structure

- Native responsive Collection with Table view on PC/laptop and tablet, and Card view on mobile.
- Leading selection column, selected-item state, selected-item count, normal operations, multi-selected operations, and the source Collection action bindings.
- All source page dependencies: `filterVars`, `tempVars`, `filter`, root `actions`, `formAction.onLoad`, and `exts` metadata.
- The complete Card item tree and responsive Table columns, including the intentional leading selection column.
- Mobile Full-width operation controls; item-operation overlay safety settings are preserved when present in the source revision.

## Training assets

- Full source artifact: `docs/reference/collection-control-responsive-multiple-select.template.json`
- Golden-reference registry: `docs/reference/dashboard-dataset-presentation-golden-references.json`
- Normalized template library: `docs/templates/yeeflow-ui-section-template-library.normalized.json`
- Human-readable template library: `docs/templates/yeeflow-ui-section-template-library.md`
- Generation and materialization wiring: `scripts/collection-control-generation-standard.js` and `scripts/materialize-full-app-generated-final.mjs`

## Validation

The training validator checks the root wrapper, responsive Table/Card shape, leading selection column, complete Collection actions, page dependency graph, selected-item variables, batch actions, Card content, and rejection of legacy `flex_grid` controls. The artifact is also included in the plugin patch-release path and mirrored under `dist/yeeflow-app-builder-plugin`.

## Proof boundary

The template is export-proven and locally structurally validated. Generated list IDs, action targets, permissions, API acceptance, persistence, and browser/runtime behavior remain package-specific and require separate tenant/runtime verification.
