# Dashboard Dataset And Layout Validator Tightening Training Report

## Scope

This training report closes two plugin-owned validator gaps found during the
0.8.99 Office Asset reverification before another clean E2E run.

## Findings

### Dataset Presentation Selection Was Too Broad

The Dashboard dataset presentation validator accepted an App Plan row that
selected `collection_control_responsive_card_grid` while the rationale described
dense table scanning with row and column comparison. The validator was matching
against the full row, so generic source/page terms such as request or queue could
make an incompatible template selection appear valid.

The validator must evaluate the selected template against the actual rationale
and display-need guidance near the selected template column, not broad row
context such as Dashboard name, dataset name, or source list name.

### v1.1 Content Card Fidelity Was Too Loose

The Dashboard Page Layouts v1.1 validator accepted a copied
`content_card_wrapper` that removed `section_title_area`. That weakened the
golden reference contract and conflicted with the regression fixture expecting
`DASH_LAYOUT_RESOURCE_SECTION_TITLE_AREA_MISSING`.

Copied v1.1 `content_card_wrapper` modules must preserve both
`section_title_area` and `section_content_area`. If a no-title business content
module is needed, it must be introduced as a separate approved template instead
of mutating the canonical wrapper.

## Training Requirements

1. Dashboard Collection App Plan template choices must be justified by the
   selected rationale/display-need text, not by broad row context.
2. `collection_control_responsive_card_grid` must fail when the rationale is
   dense row/column/table scanning unless explicit card-browsing intent is also
   present.
3. Generic words such as request and queue must not justify card-grid selection
   by themselves.
4. Copied Dashboard Page Layouts v1.1 `content_card_wrapper` modules must
   preserve `section_title_area` and `section_content_area`.
5. Keep the negative fixtures for
   `DASH_DATASET_APP_PLAN_SELECTION_RATIONALE_MISMATCH` and
   `DASH_LAYOUT_RESOURCE_SECTION_TITLE_AREA_MISSING` as release gates before
   clean E2E.
