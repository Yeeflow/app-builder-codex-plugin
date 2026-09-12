# Dashboard Dataset Composition

Introduced in plugin 1.15.4. This contract applies to full-app YAPK, standalone YDP, generated-final validation and incremental Dashboard repairs. Use `scripts/lib/dashboard-dataset-composition.mjs`; run `scripts/test-dashboard-dataset-composition.mjs` and the existing Dashboard/standalone gates.

## One title owner

The registered `dataset-caption-v1` variant preserves `content_card_wrapper` (including 60/40 variants), its width/padding/background, and `section_content_area`. Set `attrs.dashboardCardVariant` to `dataset-caption-v1`. Omit the direct `section_title_area` only when the content slot contains exactly one Collection or Kanban with a nonempty section caption. Keep the entire component caption, operations, table header and dataset subtree. A Kanban lane heading or Collection column heading is not a section caption.

This conditional variant overrides the generic v1.1 mandatory outer-title rule. An unmarked card without a title still fails; a forged variant without a real caption, with mixed datasets, or with a retained outer title fails. Do not globally make all card titles optional. For multi-dataset or mixed chart/dataset sections, keep a meaningful grouping title. For captionless controls, keep the outer title.

Remove duplicated outer titles and the generated filler descriptions `Review <title> and open a record for details.` or `Review <title> records and related activity.`. Preserve independent scope/method descriptions, dynamic title expressions and configured outer operations. If these are needed, keep the titled card; do not silently discard them. A later explicitly planned consolidation may move unique explanatory content into the component caption, with dependency preservation and runtime review.

## Toolbar and responsive layout

Preserve reference child order: Search, then Add, then other actions. Normalize only recognized dataset operation rows (`op_normal`, `grid_table_col_operations`, and caption-bearing Kanban operation rows), never arbitrary page actions. Preserve Add permissions, collection action IDs, filter binding/variables, fulltext consumers, bulk-selection state, table columns and mobile Card layout. Source generation and incremental edits use the same normalizer and validator.

Retain Golden reference responsive caption/operations width and direction shapes. Use a wide one-column section for dense tables; use multi-column cards only for short comparable content. At narrow sizes the caption and operations must remain usable according to the selected responsive reference; do not force a search input to squeeze alongside a button or overwrite responsive slots with desktop-only widths. Desktop half-card and tablet/mobile visual checks must verify Search legibility, Add visibility, wrapping and overflow. Structural checks are not browser rendering proof.

## Empty layout cleanup

After materialization and any later action/template cleanup, remove empty known layout modules bottom-up, including `kpi_cards_kpi_row` and now-empty KPI/section wrappers. The final gate rejects leftovers. Do not equate zero query results with an empty control tree: retain bound Collection/Kanban and other real controls, meaningful text, Custom Code and configured action controls. Do not indiscriminately delete all containers or controls with empty children.

## Repair and evidence

For existing Dashboards, first read the exact application/page and preserve IDs, data bindings, actions and existing business changes. Apply the shared composition helper to the decoded resource, validate the result, and use the supported incremental save/readback route. Check layout and actions in Designer/runtime separately. Updating this plugin does not itself modify previously generated applications.

The regression uses tenant-neutral Golden references and synthetic structures. Kanban composition coverage is conditional structural coverage, not a new Kanban template or certified runtime interaction. No customer exports are distributed.
